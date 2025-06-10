import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Create authenticated Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 1. Check if the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error fetching session',
        error: sessionError.message
      }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required'
      }, { status: 401 });
    }
    
    // 2. Check if users table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (tableError) {
      // Table doesn't exist or can't be accessed
      return NextResponse.json({
        success: false,
        message: 'Database issues detected',
        details: {
          users_table_accessible: false,
          error: tableError.message,
          code: tableError.code
        },
        recommended_action: 'Check that your users table exists and has the correct schema'
      });
    }
    
    // 3. Check if current user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      // User doesn't exist, try to create it
      if (userError.code === 'PGRST116') { // Not found error
        try {
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              email: session.user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              spotify_connected: false
            })
            .select()
            .single();
          
          if (insertError) {
            return NextResponse.json({
              success: false,
              message: 'Failed to create user record',
              error: insertError.message,
              details: {
                users_table_accessible: true,
                user_exists: false,
                insert_successful: false,
                insert_error: insertError
              }
            });
          }
          
          return NextResponse.json({
            success: true,
            message: 'User record created successfully',
            details: {
              users_table_accessible: true,
              user_exists: true,
              was_created: true,
              user_id: newUser.id
            }
          });
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: 'Exception when creating user record',
            error: error.message,
            details: {
              users_table_accessible: true,
              user_exists: false
            }
          });
        }
      } else {
        // Some other error
        return NextResponse.json({
          success: false,
          message: 'Error checking user record',
          error: userError.message,
          details: {
            users_table_accessible: true,
            user_check_error: userError
          }
        });
      }
    }
    
    // 4. User exists, return success
    return NextResponse.json({
      success: true,
      message: 'User record exists',
      details: {
        users_table_accessible: true,
        user_exists: true,
        user_id: userData.id,
        spotify_connected: userData.spotify_connected
      }
    });
    
  } catch (error: any) {
    console.error('Error in fix-db-issues API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Unexpected error',
      error: error.message
    }, { status: 500 });
  }
} 