import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // Get the current URL to extract parameters
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const error_code = requestUrl.searchParams.get('error_code');
  const debug_attempt = requestUrl.searchParams.get('debug_attempt');
  
  // Enhanced logging for debugging purposes
  console.log('Auth callback requested:', {
    hasCode: !!code,
    hasError: !!error,
    debug_attempt: debug_attempt || false,
    url: requestUrl.toString().substring(0, 100) + '...'
  });
  
  // Log detailed information about any errors
  if (error) {
    console.error('OAuth callback error:', { 
      error,
      error_description, 
      error_code,
      url: requestUrl.toString()
    });
    
    // For database errors specifically, add more detailed information to help debugging
    if (error === 'server_error' && error_description?.includes('Database error')) {
      console.error('Database error details:', {
        description: error_description,
        code: error_code,
        // Include additional context that might help diagnose the issue
        timestamp: new Date().toISOString(),
        auth_provider: requestUrl.searchParams.get('provider') || 'unknown'
      });
      
      // Try to check Supabase status for extra diagnostics
      try {
        const statusResponse = await fetch('https://status.supabase.com/api/v2/status.json', { 
          cache: 'no-store'
        });
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('Supabase service status:', statusData);
        }
      } catch (statusError) {
        console.error('Failed to check Supabase status:', statusError);
      }
    }
    
    // Special handling for email verification errors
    if (error_code === 'provider_email_needs_verification' || 
        error_description?.includes('Unverified email with spotify')) {
      let customMessage = 'Se ha enviado un correo de confirmación a tu email de Spotify. Por favor verifica tu email para continuar.';
      
      // Redirect to login with friendly message using info parameter instead of error
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?info=${encodeURIComponent(customMessage)}`
      );
    }
    
    // Redirect to login with error message
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent(error_description || error)}`
    );
  }
  
  // If there's no code, something went wrong
  if (!code) {
    console.error('No authorization code received in callback');
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent('No authorization code received')}`
    );
  }
  
  try {
    // Create a Supabase client with server cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Exchanging code for session...');
    
    // Exchange the code for a session, the SDK handles this automatically
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Session exchange error:', error);
      
      // Enhanced error logging for specific errors
      if (error.message?.includes('Database error') || error.message?.includes('database')) {
        console.error('Database-related error details:', {
          message: error.message,
          code: error.status,
          fullError: JSON.stringify(error)
        });
      }
      
      throw error;
    }
    
    console.log('Session established successfully', {
      user_id: data.session?.user?.id,
      provider: data.session?.user?.app_metadata?.provider,
      is_new_user: data.session?.user?.app_metadata?.is_new_user || false
    });
    
    // Check if this was a Spotify authentication
    if (data.session?.user?.app_metadata?.provider === 'spotify') {
      console.log('Spotify authentication detected, auto-linking account...');
      
      try {
        // Get access to Spotify user information from the provider token
        const { provider_token, provider_refresh_token } = data.session.user.app_metadata;
        
        if (provider_token) {
          // Get the user info from Spotify to get the Spotify user ID
          const userProfileResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              'Authorization': `Bearer ${provider_token}`
            }
          });
          
          if (userProfileResponse.ok) {
            const spotifyProfile = await userProfileResponse.json();
            const spotifyUserId = spotifyProfile.id;
            
            console.log('Retrieved Spotify profile:', { 
              spotify_id: spotifyUserId,
              spotify_email: spotifyProfile.email 
            });
            
            // Update the user profile with Spotify information
            const { error: updateError } = await supabase
              .from('users')
              .update({
                spotify_connected: true,
                spotify_refresh_token: provider_refresh_token,
                spotify_user_id: spotifyUserId,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.session.user.id);
            
            if (updateError) {
              console.error('Error updating Spotify connection:', updateError);
              
              // Check if the error is related to the user record not existing yet
              if (updateError.code === 'PGRST116') {
                console.log('User record not found in database, creating one...');
                
                // Try to create the user record
                const { error: insertError } = await supabase
                  .from('users')
                  .insert({
                    id: data.session.user.id,
                    email: data.session.user.email,
                    spotify_connected: true,
                    spotify_refresh_token: provider_refresh_token,
                    spotify_user_id: spotifyUserId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });
                  
                if (insertError) {
                  console.error('Failed to create user record:', insertError);
                } else {
                  console.log('Successfully created new user record with Spotify info');
                }
              }
            } else {
              console.log('Successfully linked Spotify account automatically');
            }
          } else {
            const errorText = await userProfileResponse.text();
            console.error('Failed to fetch Spotify profile:', errorText);
          }
        } else {
          console.error('No provider token available for Spotify user');
        }
      } catch (spotifyError) {
        console.error('Error auto-linking Spotify account:', spotifyError);
        // Continue with the login flow even if auto-linking fails
      }
    }
    
    // Redirect to dashboard after success
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    
    // Detailed error information
    const errorMessage = error.message || 'Unknown error';
    const errorDetails = error.stack || '';
    console.error('Error details:', { errorMessage, errorDetails });
    
    // If there's an error, redirect to the login page with a message
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent('Authentication error: ' + errorMessage)}`
    );
  }
} 