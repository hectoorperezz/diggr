import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { refreshAccessToken, createPlaylist, addTracksToPlaylist, getCurrentUser, uploadPlaylistCover, getPlaylist } from '@/lib/spotify/client';
import { canCreateMorePlaylists } from '@/lib/stripe/subscription';

export async function POST(request: NextRequest) {
  console.log('Playlist creation request received');
  
  try {
    // Get the request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { 
      name,
      description,
      isPublic,
      tracks,
      coverImage // Optional base64 image data
    } = body;

    // Validate required fields
    if (!name || !tracks || !Array.isArray(tracks) || tracks.length === 0) {
      console.error('Missing required fields:', { name, tracksProvided: !!tracks, isArray: Array.isArray(tracks), trackCount: tracks?.length });
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'Name and tracks are required. Tracks must be a non-empty array.' 
      }, { status: 400 });
    }

    // Create Supabase client for authentication
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', session.user.id);

    // Check subscription and playlist limits
    const canCreate = await canCreateMorePlaylists(session.user.id);
    if (!canCreate) {
      console.log('User has reached their playlist limit based on subscription');
      return NextResponse.json({
        error: 'Monthly playlist limit reached',
        limitReached: true,
        needsUpgrade: true
      }, { status: 403 });
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
      console.error('Spotify not connected for user:', session.user.id);
      return NextResponse.json({ 
        error: 'Spotify account not connected',
        needsSpotifyConnection: true
      }, { status: 400 });
    }

    console.log('User has Spotify connected, refreshing token');

    // Get a fresh Spotify access token
    const tokens = await refreshAccessToken(user.spotify_refresh_token);
    const accessToken = tokens.access_token;

    console.log('Access token refreshed successfully');

    // Get current Spotify user to create playlist
    const spotifyUser = await getCurrentUser(accessToken);
    const userId = spotifyUser.id;

    console.log('Got Spotify user ID:', userId);

    // Create the playlist
    console.log('Creating playlist with params:', { name, description: description || '(No description)', isPublic });
    const playlist = await createPlaylist(
      userId,
      accessToken,
      name,
      description || 'Created with Diggr - AI-powered music discovery',
      isPublic !== undefined ? isPublic : true
    );

    console.log('Playlist created on Spotify:', playlist.id);

    // Extract the track URIs from the tracks array
    const trackUris = tracks.map((track: any) => track.uri);
    console.log(`Adding ${trackUris.length} tracks to playlist`);

    // Add tracks to the playlist
    await addTracksToPlaylist(playlist.id, accessToken, trackUris);
    console.log('Tracks added to playlist successfully');
    
    // Upload cover image if provided
    let updatedImageUrl: string | null = null;
    if (coverImage) {
      try {
        console.log('Uploading custom cover image');
        await uploadPlaylistCover(playlist.id, accessToken, coverImage);
        
        // Get the updated playlist to get the new image URL
        const updatedPlaylist = await getPlaylist(playlist.id, accessToken);
        updatedImageUrl = updatedPlaylist.images && updatedPlaylist.images.length > 0 
          ? updatedPlaylist.images[0].url 
          : null;
          
        console.log('Cover image uploaded successfully');
      } catch (coverError) {
        console.error('Error uploading cover image:', coverError);
        // Continue with playlist creation even if cover upload fails
      }
    }

    // Prepare data for database insert
    // Ensure boolean fields are properly typed
    const imageUrl: string | null = updatedImageUrl || 
      (playlist.images && playlist.images.length > 0 ? playlist.images[0].url : null);
      
    const playlistData = {
      user_id: session.user.id,
      spotify_playlist_id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      track_count: trackUris.length,
      is_public: typeof playlist.public === 'boolean' ? playlist.public : true,
      criteria: body.criteria || {},
      spotify_url: playlist.external_urls.spotify,
      image_url: imageUrl
    };
    
    console.log('Saving playlist to database with data:', JSON.stringify(playlistData, null, 2));

    // Try first with error information
    try {
      // Store the playlist in our database
      let savedPlaylist;
      const { data: savedPlaylistData, error: saveError } = await supabase
        .from('playlists')
        .insert(playlistData)
        .select()
        .single();
      
      savedPlaylist = savedPlaylistData;

      if (saveError) {
        console.error('Error saving playlist to database:', saveError);
        // Log the detailed error
        if (saveError.details) {
          console.error('Error details:', saveError.details);
        }
        if (saveError.hint) {
          console.error('Error hint:', saveError.hint);
        }
        
        // Try alternative approach with explicit column list
        console.log('Trying alternative insert approach...');
        const { data: savedPlaylistAlt, error: saveErrorAlt } = await supabase
          .from('playlists')
          .insert({
            user_id: session.user.id,
            spotify_playlist_id: playlist.id,
            name: playlist.name,
            description: playlist.description || null,
            track_count: trackUris.length,
            criteria: body.criteria || {},
            spotify_url: playlist.external_urls.spotify || null,
            image_url: (playlist.images && playlist.images.length > 0) ? playlist.images[0].url : null,
            is_public: true  // Use explicit value to avoid type issues
          })
          .select()
          .single();
          
        if (saveErrorAlt) {
          console.error('Alternative insert also failed:', saveErrorAlt);
        } else {
          console.log('Alternative insert succeeded:', savedPlaylistAlt.id);
          // Use this playlist for the response
          savedPlaylist = savedPlaylistAlt;
        }
      } else {
        console.log('Playlist saved to database successfully:', savedPlaylist.id);
      }

      // Update the user's usage stats
      try {
        console.log('Updating usage stats for user:', session.user.id);
        
        // First, try to get existing usage stats
        const { data: existingStats, error: statsError } = await supabase
          .from('usage_stats')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (statsError) {
          if (statsError.code === 'PGRST116') {
            console.log('No usage stats record exists, creating one');
            // No usage stats record exists, create one
            const { data: insertData, error: insertError } = await supabase
              .from('usage_stats')
              .insert({
                user_id: session.user.id,
                playlists_created_count: 1,
                reset_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
              })
              .select();
            
            if (insertError) {
              console.error('Error creating usage stats:', insertError);
            } else {
              console.log('Usage stats created successfully:', insertData);
            }
          } else {
            console.error('Error fetching usage stats:', statsError);
          }
        } else {
          console.log('Existing usage stats found:', existingStats);
          
          // Calculate new count with explicit increment
          const newCount = (typeof existingStats.playlists_created_count === 'number' ? 
                           existingStats.playlists_created_count : 0) + 1;
          
          console.log(`Updating count from ${existingStats.playlists_created_count} to ${newCount}`);
          
          // Update existing usage stats with direct SQL to avoid any RLS or trigger issues
          const { data: updateData, error: updateError } = await supabase.rpc(
            'increment_playlist_count',
            { user_id_param: session.user.id }
          );
          
          if (updateError) {
            console.error('Error updating usage stats:', updateError);
            
            // Fallback to regular update
            const { data: regularUpdateData, error: regularUpdateError } = await supabase
              .from('usage_stats')
              .update({
                playlists_created_count: newCount,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', session.user.id)
              .select();
            
            if (regularUpdateError) {
              console.error('Fallback update also failed:', regularUpdateError);
            } else {
              console.log('Usage stats updated via fallback:', regularUpdateData);
            }
          } else {
            console.log('Usage stats updated successfully via RPC:', updateData);
          }
        }
      } catch (statsError) {
        console.error('Exception updating usage stats:', statsError);
        // Continue anyway, the playlist was created successfully
      }

      console.log('Playlist creation completed successfully');

      // Return the created playlist
      return NextResponse.json({
        success: true,
        playlist: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          public: playlist.public,
          trackCount: trackUris.length,
          url: playlist.external_urls.spotify,
          images: playlist.images,
          uri: playlist.uri
        },
        dbPlaylist: savedPlaylist || null
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Return a success response anyway since the Spotify playlist was created
      return NextResponse.json({
        success: true,
        warning: "Playlist was created in Spotify but there was an error saving to the database",
        playlist: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          public: playlist.public,
          trackCount: trackUris.length,
          url: playlist.external_urls.spotify,
          images: playlist.images,
          uri: playlist.uri
        }
      });
    }
  } catch (error: any) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
} 