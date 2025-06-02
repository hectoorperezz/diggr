import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generatePlaylist, PlaylistCriteria } from '@/lib/openai/client';
import { searchTracks, refreshAccessToken, SpotifyTrack } from '@/lib/spotify/client';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { formData } = body;

    if (!formData) {
      return NextResponse.json({ error: 'Missing form data' }, { status: 400 });
    }

    // Create Supabase client for authentication
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      return NextResponse.json({ 
        error: 'Spotify account not connected',
        needsSpotifyConnection: true
      }, { status: 400 });
    }

    // Transform form data to OpenAI criteria
    const criteria: PlaylistCriteria = {
      genres: formData.genres || [],
      subgenres: formData.subGenres || [],
      country: formData.regions && formData.regions.length > 0 ? formData.regions[0] : undefined,
      language: formData.languages && formData.languages.length > 0 ? formData.languages[0] : undefined,
      mood: formData.moods && formData.moods.length > 0 ? formData.moods[0] : undefined,
      era: formData.eras && formData.eras.length > 0 ? formData.eras[0] : undefined,
      uniqueness: formData.uniquenessLevel || 3,
      songCount: formData.trackCount || 25
    };

    console.log('Generating playlist with criteria:', criteria);

    // Call OpenAI to generate playlist recommendations
    const recommendations = await generatePlaylist(criteria);
    
    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
    }

    console.log(`Generated ${recommendations.length} recommendations`);

    // Get a fresh Spotify access token
    const tokens = await refreshAccessToken(user.spotify_refresh_token);
    const accessToken = tokens.access_token;

    // Search for each recommended track on Spotify
    const spotifyTracks: SpotifyTrack[] = [];
    const failedTracks: any[] = [];

    // Process tracks in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < recommendations.length; i += batchSize) {
      const batch = recommendations.slice(i, i + batchSize);
      
      // Process tracks in parallel within the batch
      const batchPromises = batch.map(async (recommendation) => {
        try {
          const query = `track:${recommendation.title} artist:${recommendation.artist}`;
          const searchResults = await searchTracks(query, accessToken, 1);
          
          if (searchResults && searchResults.length > 0) {
            // Found a match
            return { 
              track: searchResults[0],
              recommendation,
              status: 'found'
            };
          } else {
            // Try a more lenient search (just artist and partial title)
            const fallbackQuery = `artist:${recommendation.artist}`;
            const fallbackResults = await searchTracks(fallbackQuery, accessToken, 5);
            
            if (fallbackResults && fallbackResults.length > 0) {
              // Use fuzzy matching to find the closest match
              // For now, just take the first result as a fallback
              return {
                track: fallbackResults[0],
                recommendation,
                status: 'fallback'
              };
            }
            
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
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Return the results
    return NextResponse.json({
      success: true,
      recommendations,
      spotifyTracks,
      failedTracks,
      stats: {
        total: recommendations.length,
        found: spotifyTracks.length,
        notFound: failedTracks.length
      }
    });
  } catch (error: any) {
    console.error('Error in playlist generation:', error);
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
} 