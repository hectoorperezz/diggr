import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Log for debugging
  console.log('Spotify auth callback:', { 
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

  // Instead of processing here, redirect to a temporary page to debug
  return NextResponse.redirect(
    requestUrl.origin + '/settings/spotify-debug?code=' + encodeURIComponent(code) + 
    '&state=' + encodeURIComponent(state || '')
  );
} 