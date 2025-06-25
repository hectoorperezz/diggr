import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generatePlaylist, PlaylistCriteria } from '@/lib/openai/client';
import { searchTracks, refreshAccessToken, SpotifyTrack } from '@/lib/spotify/client';

// Helper function for development logging
const devLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] [DEV ONLY] ${message}`);
    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  devLog('🎵 PLAYLIST GENERATION REQUEST STARTED 🎵');
  
  try {
    // Get the request body
    const body = await request.json();
    const { formData } = body;

    devLog('Request form data:', formData);

    if (!formData) {
      return NextResponse.json({ error: 'Missing form data' }, { status: 400 });
    }

    // Create Supabase client for authentication
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      devLog('Authentication failed: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    devLog('User authenticated:', { userId: session.user.id });

    // Check if user has Spotify connected
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('spotify_refresh_token, spotify_connected')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.spotify_connected || !user.spotify_refresh_token) {
      devLog('Spotify not connected for user');
      return NextResponse.json({ 
        error: 'Spotify account not connected',
        needsSpotifyConnection: true
      }, { status: 400 });
    }

    devLog('Spotify connection verified');

    // Transform form data to OpenAI criteria
    const criteria: PlaylistCriteria = {
      genres: formData.genres || [],
      subgenres: formData.subGenres || [],
      regions: formData.regions || [],
      languages: formData.languages || [],
      moods: formData.moods || [],
      eras: formData.eras || [],
      uniqueness: formData.uniquenessLevel || 3,
      songCount: formData.trackCount || 25,
      userPrompt: formData.userPrompt || undefined
    };

    devLog('Transformed criteria for OpenAI:', criteria);

    // Call OpenAI to generate playlist recommendations
    const openaiStartTime = Date.now();
    devLog('Calling OpenAI API...');
    const recommendations = await generatePlaylist(criteria);
    const openaiEndTime = Date.now();
    
    if (!recommendations || recommendations.length === 0) {
      devLog('OpenAI returned no recommendations');
      return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
    }

    devLog(`OpenAI API call completed in ${(openaiEndTime - openaiStartTime) / 1000}s`);
    devLog(`Generated ${recommendations.length} recommendations`);

    // Get a fresh Spotify access token
    devLog('Refreshing Spotify access token...');
    const spotifyAuthStartTime = Date.now();
    const tokens = await refreshAccessToken(user.spotify_refresh_token);
    const accessToken = tokens.access_token;
    const spotifyAuthEndTime = Date.now();
    devLog(`Spotify token refresh completed in ${(spotifyAuthEndTime - spotifyAuthStartTime) / 1000}s`);

    // Search for each recommended track on Spotify
    const spotifyTracks: SpotifyTrack[] = [];
    const failedTracks: any[] = [];

    // Process tracks in batches to avoid rate limits
    const batchSize = 5;
    const spotifySearchStartTime = Date.now();
    devLog(`Starting Spotify search in batches of ${batchSize}...`);
    
    for (let i = 0; i < recommendations.length; i += batchSize) {
      const batch = recommendations.slice(i, i + batchSize);
      devLog(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recommendations.length / batchSize)}`);
      
      // Process tracks in parallel within the batch
      const batchPromises = batch.map(async (recommendation) => {
        try {
          const query = `track:${recommendation.title} artist:${recommendation.artist}`;
          devLog(`Searching Spotify for: ${query}`);
          const searchResults = await searchTracks(query, accessToken, 1);
          
          if (searchResults && searchResults.length > 0) {
            // Found a match
            devLog(`Found exact match for: ${recommendation.title} by ${recommendation.artist}`);
            return { 
              track: searchResults[0],
              recommendation,
              status: 'found'
            };
          } else {
            // Try a more lenient search (just artist and partial title)
            devLog(`No exact match found, trying fallback search for artist: ${recommendation.artist}`);
            const fallbackQuery = `artist:${recommendation.artist}`;
            const fallbackResults = await searchTracks(fallbackQuery, accessToken, 5);
            
            if (fallbackResults && fallbackResults.length > 0) {
              // Use fuzzy matching to find the closest match
              // For now, just take the first result as a fallback
              devLog(`Found fallback track for artist: ${recommendation.artist}`);
              return {
                track: fallbackResults[0],
                recommendation,
                status: 'fallback'
              };
            }
            
            devLog(`No tracks found for artist: ${recommendation.artist}`);
            return {
              recommendation,
              status: 'not_found'
            };
          }
        } catch (error) {
          console.error(`Error searching for track ${recommendation.title} by ${recommendation.artist}:`, error);
          return {
            recommendation,
            error: error instanceof Error ? error.message : String(error),
            status: 'error'
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Process batch results
      for (const result of batchResults) {
        if ((result.status === 'found' || result.status === 'fallback') && result.track) {
          spotifyTracks.push(result.track);
        } else {
          failedTracks.push(result);
        }
      }
      
      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < recommendations.length) {
        devLog(`Waiting 500ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const spotifySearchEndTime = Date.now();
    devLog(`Spotify search completed in ${(spotifySearchEndTime - spotifySearchStartTime) / 1000}s`);

    // Calculate overall stats
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    
    const stats = {
      total: recommendations.length,
      found: spotifyTracks.length,
      notFound: failedTracks.length,
      timing: {
        total: `${totalDuration.toFixed(2)}s`,
        openai: `${((openaiEndTime - openaiStartTime) / 1000).toFixed(2)}s`,
        spotifyAuth: `${((spotifyAuthEndTime - spotifyAuthStartTime) / 1000).toFixed(2)}s`,
        spotifySearch: `${((spotifySearchEndTime - spotifySearchStartTime) / 1000).toFixed(2)}s`,
      }
    };
    
    devLog('Playlist generation completed with stats:', stats);

    // Return the results
    return NextResponse.json({
      success: true,
      recommendations,
      spotifyTracks,
      failedTracks,
      stats
    });
  } catch (error: any) {
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    
    console.error('Error in playlist generation:', error);
    devLog(`❌ Playlist generation failed after ${totalDuration.toFixed(2)}s:`, { 
      error: error.message || 'Unknown error'
    });
    
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
} 