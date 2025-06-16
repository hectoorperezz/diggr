import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { refreshAccessToken, uploadPlaylistCover, getPlaylist } from '@/lib/spotify/client';

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing playlist ID' }, { status: 400 });
    }
    
    // Get the request body
    const body = await request.json();
    const { imageBase64 } = body;
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }
    
    // Create Supabase client for authentication
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch the playlist from the database to make sure it belongs to the user
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('spotify_playlist_id, user_id')
      .eq('id', id)
      .single();
    
    if (playlistError || !playlist) {
      console.error('Error fetching playlist:', playlistError);
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
    
    // Check if the playlist belongs to the current user
    if (playlist.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get Spotify playlist ID
    const spotifyPlaylistId = playlist.spotify_playlist_id;
    
    if (!spotifyPlaylistId) {
      return NextResponse.json({ error: 'Spotify playlist ID not found' }, { status: 400 });
    }
    
    // Get user's Spotify refresh token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('spotify_refresh_token')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !user || !user.spotify_refresh_token) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 400 });
    }
    
    // Get a fresh Spotify access token
    const tokens = await refreshAccessToken(user.spotify_refresh_token);
    const accessToken = tokens.access_token;
    
    // Upload the cover image to Spotify
    await uploadPlaylistCover(spotifyPlaylistId, accessToken, imageBase64);
    
    // Get the updated playlist to get the new image URL
    const spotifyPlaylist = await getPlaylist(spotifyPlaylistId, accessToken);
    const newImageUrl = spotifyPlaylist.images && spotifyPlaylist.images.length > 0 
      ? spotifyPlaylist.images[0].url 
      : null;
    
    // Update the image URL in our database
    if (newImageUrl) {
      await supabase
        .from('playlists')
        .update({ image_url: newImageUrl, updated_at: new Date().toISOString() })
        .eq('id', id);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Playlist cover updated successfully',
      imageUrl: newImageUrl
    });
  } catch (error: any) {
    console.error('Error updating playlist cover:', error);
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
} 