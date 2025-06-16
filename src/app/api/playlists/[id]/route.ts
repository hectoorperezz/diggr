import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing playlist ID' }, { status: 400 });
    }
    
    // Create Supabase client for authentication
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch the playlist from the database
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching playlist:', error);
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
    
    // Check if the playlist belongs to the current user
    if (playlist.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      success: true,
      playlist 
    });
  } catch (error: any) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
} 