import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirect_uri } = body;
    
    // Log the request parameters
    console.log('Debug API route called with parameters:', {
      code: code ? `${code.substring(0, 10)}...` : null,
      redirect_uri
    });
    
    // Get client credentials
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials:', { 
        hasClientId: !!clientId, 
        hasClientSecret: !!clientSecret,
        env: Object.keys(process.env).filter(key => key.includes('SPOTIFY'))
      });
      
      return NextResponse.json({
        error: 'Missing client credentials',
        details: {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          env: Object.keys(process.env).filter(key => key.includes('SPOTIFY'))
        }
      }, { status: 500 });
    }
    
    console.log('Credentials found:', {
      clientIdLength: clientId.length,
      clientIdStart: clientId.substring(0, 4),
      clientIdEnd: clientId.substring(clientId.length - 4),
      secretLength: clientSecret.length,
      secretStart: clientSecret.substring(0, 4),
      secretEnd: clientSecret.substring(clientSecret.length - 4)
    });
    
    // Build the token request
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
    });
    
    console.log('Making token request with params:', {
      authHeaderLength: authHeader.length,
      grantType: 'authorization_code',
      codeLength: code.length,
      redirectUri: redirect_uri,
      clientIdMatch: clientId === process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    });
    
    // Make the request to Spotify
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    
    console.log('Token response status:', tokenResponse.status, tokenResponse.statusText);
    
    const responseText = await tokenResponse.text();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange error details:', responseText);
      
      // Try to parse the error response
      try {
        const errorData = JSON.parse(responseText);
        console.error('Parsed error:', errorData);
        
        // Check for specific error types
        if (errorData.error === 'invalid_grant') {
          return NextResponse.json({
            error: 'Invalid authorization code',
            details: 'The authorization code has expired or has already been used. Codes are valid for a short time and can only be used once.',
            rawError: errorData
          }, { status: 400 });
        }
      } catch (e) {
        // If we can't parse the error, just continue with the normal error handling
      }
      
      return NextResponse.json({
        error: `Spotify API error: ${tokenResponse.status} ${tokenResponse.statusText}`,
        details: responseText
      }, { status: tokenResponse.status });
    }
    
    try {
      // Try to parse the response as JSON
      const tokens = JSON.parse(responseText);
      console.log('Token exchange successful. Received tokens:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in
      });
      
      return NextResponse.json({
        success: true,
        tokens: {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          tokenType: tokens.token_type,
          expiresIn: tokens.expires_in
        }
      });
    } catch (parseError) {
      console.error('Error parsing token response:', parseError);
      return NextResponse.json({
        error: 'Error parsing token response',
        details: responseText
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Unexpected error in debug API route:', error);
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
} 