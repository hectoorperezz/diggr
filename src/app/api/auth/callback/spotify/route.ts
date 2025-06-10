import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Log for debugging
  console.log('Spotify auth callback (API route):', { 
    hasCode: !!code, 
    hasState: !!state,
    error,
    error_description,
    url: requestUrl.toString()
  });

  // Handle the specific invalid redirect URI error
  if (error === 'invalid_client' || (error_description && error_description.includes('redirect URI'))) {
    console.error('Spotify redirect URI error:', error, error_description);
    return NextResponse.redirect(requestUrl.origin + '/spotify-config');
  }

  // Handle other errors from Spotify
  if (error) {
    console.error('Spotify auth error:', error, error_description);
    return NextResponse.redirect(
      requestUrl.origin + '/settings?error=' + encodeURIComponent(error_description || error)
    );
  }

  // If there's no code, redirect back to settings
  if (!code) {
    console.error('No code received from Spotify');
    return NextResponse.redirect(
      requestUrl.origin + '/settings?error=No authorization code received'
    );
  }

  try {
    // For debugging, you can still redirect to the debug page
    const isDebugMode = false;
    if (isDebugMode) {
      return NextResponse.redirect(
        requestUrl.origin + '/settings/spotify-debug?code=' + encodeURIComponent(code) + 
        '&state=' + encodeURIComponent(state || '')
      );
    }

    // Get client credentials
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials');
      return NextResponse.redirect(
        requestUrl.origin + '/settings?error=Server configuration error: Missing Spotify credentials'
      );
    }
    
    // Build the token request
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || `${requestUrl.origin}/api/auth/callback/spotify`;
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });
    
    console.log('Making token request with params:', {
      redirectUri,
      grantType: 'authorization_code',
      codeLength: code.length,
    });
    
    // Exchange the code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', tokenResponse.status, errorText);
      
      // If it's an invalid grant error, it might be because the code expired
      if (errorText.includes('invalid_grant')) {
        return NextResponse.redirect(
          requestUrl.origin + '/settings?error=Authorization code expired. Please try again.'
        );
      }
      
      return NextResponse.redirect(
        requestUrl.origin + '/settings?error=' + encodeURIComponent(`Spotify API error: ${tokenResponse.status}`)
      );
    }
    
    // Successfully exchanged the code for tokens
    const tokens = await tokenResponse.json();
    console.log('Token exchange successful:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
    });
    
    // Get the user info from Spotify to get the Spotify user ID
    const userProfileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    if (!userProfileResponse.ok) {
      console.error('Error getting Spotify user profile:', userProfileResponse.status);
      return NextResponse.redirect(
        requestUrl.origin + '/settings?error=Failed to get Spotify user profile'
      );
    }
    
    const userProfile = await userProfileResponse.json();
    const spotifyUserId = userProfile.id;
    
    // Check if this Spotify account is in cooling period
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const now = new Date().toISOString();
    const { data: coolingPeriodData, error: coolingPeriodError } = await adminClient
      .from('deleted_accounts')
      .select('cooling_period_end')
      .eq('spotify_user_id', spotifyUserId)
      .gt('cooling_period_end', now)
      .maybeSingle();
    
    if (coolingPeriodError) {
      console.error('Error checking cooling period:', coolingPeriodError);
      return NextResponse.redirect(
        requestUrl.origin + '/settings?error=Error checking account status'
      );
    }
    
    // If the account is in cooling period, redirect with error
    if (coolingPeriodData) {
      const coolingEndDate = new Date(coolingPeriodData.cooling_period_end);
      const daysRemaining = Math.ceil((coolingEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return NextResponse.redirect(
        requestUrl.origin + '/settings?error=' + encodeURIComponent(
          `This Spotify account was recently associated with a deleted Diggr account and cannot be connected for ${daysRemaining} more days.`
        )
      );
    }
    
    // Create a Supabase client to update the user's profile
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      console.error('No authenticated user found');
      return NextResponse.redirect(
        requestUrl.origin + '/settings?error=You must be logged in to connect Spotify'
      );
    }
    
    // Update the user's profile with Spotify information
    const { error: updateError } = await supabase
      .from('users')
      .update({
        spotify_connected: true,
        spotify_refresh_token: tokens.refresh_token,
        spotify_user_id: spotifyUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.redirect(
        requestUrl.origin + '/settings?error=Failed to save Spotify connection'
      );
    }
    
    // Redirect back to settings with success message
    return NextResponse.redirect(
      requestUrl.origin + '/settings'
    );
    
  } catch (error: any) {
    console.error('Unexpected error in Spotify callback:', error);
    return NextResponse.redirect(
      requestUrl.origin + '/settings'
    );
  }
} 