import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { refreshAccessToken, getPlaylist } from '@/lib/spotify/client';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for authentication
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's Spotify refresh token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('spotify_refresh_token')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !user || !user.spotify_refresh_token) {
      console.error('Error fetching user Spotify token:', userError);
      // Continue to fetch playlists from database only
    }
    
    // Fetch all playlists for the current user, sorted by most recent first
    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching playlists:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If the user has Spotify connected, fetch updated image URLs
    if (user?.spotify_refresh_token && playlists && playlists.length > 0) {
      try {
        // Get a fresh Spotify access token
        const tokens = await refreshAccessToken(user.spotify_refresh_token);
        const accessToken = tokens.access_token;
        
        // Fetch Spotify details for each playlist and update the image URLs
        const updatedPlaylists = await Promise.all(playlists.map(async (playlist) => {
          if (!playlist.spotify_playlist_id) return playlist;
          
          try {
            const spotifyPlaylist = await getPlaylist(playlist.spotify_playlist_id, accessToken);
            
            // Update the image URL if available
            if (spotifyPlaylist.images && spotifyPlaylist.images.length > 0) {
              // Update the playlist in the database with the new image URL
              await supabase
                .from('playlists')
                .update({ image_url: spotifyPlaylist.images[0].url })
                .eq('id', playlist.id)
                .eq('user_id', session.user.id);
              
              return {
                ...playlist,
                image_url: spotifyPlaylist.images[0].url,
                track_count: spotifyPlaylist.tracks.total
              };
            }
            
            return playlist;
          } catch (error) {
            console.error(`Error fetching Spotify playlist ${playlist.spotify_playlist_id}:`, error);
            return playlist;
          }
        }));
        
        return NextResponse.json({ 
          success: true,
          playlists: updatedPlaylists || [] 
        });
      } catch (spotifyError) {
        console.error('Error refreshing Spotify token:', spotifyError);
        // Continue to return playlists from database only
      }
    }
    
    return NextResponse.json({ 
      success: true,
      playlists: playlists || [] 
    });
  } catch (error: any) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
} 