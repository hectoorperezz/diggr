import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Update user profile to remove Spotify connection
    const { error } = await supabase
      .from('users')
      .update({
        spotify_connected: false,
        spotify_refresh_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error disconnecting Spotify:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Spotify disconnected successfully' 
    });
  } catch (error: any) {
    console.error('Unexpected error disconnecting Spotify:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unexpected error' },
      { status: 500 }
    );
  }
} 