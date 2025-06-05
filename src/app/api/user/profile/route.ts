import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

// Create admin client for direct database access
const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * API endpoint to debug user profile data directly from the database
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[API] Checking profile for user ID: ${userId}`);

    // Try to get auth user data in multiple ways for debugging
    let authUser;
    try {
      // First try with session user (most reliable client-side)
      authUser = session.user;
      
      // Also try admin API for complete data
      try {
        const { data: adminAuthData, error: adminError } = await adminClient.auth.admin.getUserById(userId);
        if (!adminError && adminAuthData?.user) {
          console.log('[API] Got user from admin API');
          authUser = {
            ...authUser,
            // Add any additional admin fields not in the session user
            admin_data: adminAuthData.user
          };
        }
      } catch (adminErr) {
        console.error('[API] Error getting user from admin API:', adminErr);
      }
    } catch (authError) {
      console.error('[API] Error fetching auth user:', authError);
      // Still use the session user if available
      authUser = session.user;
    }
    
    // Get user profile from database using admin client (more reliable)
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      return NextResponse.json({ 
        error: `Error fetching user profile: ${profileError.message}`, 
        authUser: authUser,
        exists: false,
        session_user: {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at
        }
      }, { status: 200 });
    }
    
    // Parse various dates for debugging
    const authCreatedAt = authUser?.created_at ? new Date(authUser.created_at) : null;
    const profileCreatedAt = profile?.created_at ? new Date(profile.created_at) : null;
    
    // Ensure we have a valid date in the profile
    let created_at_display: string = 'N/A';
    let created_at_formatted: string | null = null;
    let created_at_timestamp: number | null = null;
    
    // Try profile date first (most reliable)
    if (profileCreatedAt && !isNaN(profileCreatedAt.getTime())) {
      created_at_display = profileCreatedAt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      created_at_formatted = profileCreatedAt.toISOString();
      created_at_timestamp = profileCreatedAt.getTime();
    } 
    // Fall back to auth date
    else if (authCreatedAt && !isNaN(authCreatedAt.getTime())) {
      created_at_display = authCreatedAt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      created_at_formatted = authCreatedAt.toISOString();
      created_at_timestamp = authCreatedAt.getTime();
      
      // If we had to use auth date, ensure profile has a date for next time
      if (!profile.created_at) {
        try {
          console.log('[API] Fixing missing profile date with auth date');
          await adminClient
            .from('users')
            .update({
              created_at: authCreatedAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        } catch (updateError) {
          console.error('[API] Error fixing profile date:', updateError);
        }
      }
    }
    
    // Check if dates match
    const datesMatch = authCreatedAt && profileCreatedAt && 
      authCreatedAt.toISOString() === profileCreatedAt.toISOString();
    
    // Return detailed information about the user for debugging
    return NextResponse.json({
      success: true,
      auth: {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        created_at_formatted: authUser.created_at ? new Date(authUser.created_at).toISOString() : null,
      },
      profile: {
        ...profile,
        created_at_formatted,
        created_at_display,
        created_at_timestamp
      },
      timestamps: {
        auth_created: authUser.created_at,
        profile_created: profile.created_at,
        now: new Date().toISOString(),
        dates_match: datesMatch
      },
      session: {
        expires_at: session.expires_at,
        expires_in: session.expires_in
      }
    });
  } catch (error) {
    console.error('[API] Error in user profile debug endpoint:', error);
    return NextResponse.json({ 
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 