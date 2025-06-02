import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PostgrestError } from '@supabase/supabase-js';

// Define the user data type
interface UserData {
  id: string;
  email: string;
  spotify_connected: boolean;
  created_at: string;
  [key: string]: any; // Allow for other properties
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Check database connection by querying the users table
    let userError: PostgrestError | null = null;
    let userData: UserData | null = null;
    
    if (session?.user) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      userData = data as UserData;
      userError = error;
    }
    
    // Return debug information
    return NextResponse.json({
      time: new Date().toISOString(),
      auth: {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionError: sessionError || null,
      },
      database: {
        hasUserData: !!userData,
        userData: userData ? {
          id: userData.id,
          email: userData.email,
          spotify_connected: userData.spotify_connected,
          created_at: userData.created_at
        } : null,
        userError: userError ? {
          message: userError.message,
          code: userError.code,
          details: userError.details
        } : null
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    });
  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred',
      stack: error.stack
    }, { status: 500 });
  }
} 