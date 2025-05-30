/**
 * Helper functions for Spotify authentication
 */

/**
 * Generate a random string for the state parameter
 */
export function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join('');
}

/**
 * Generate a code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

/**
 * Generate a code challenge from a code verifier
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Get the Spotify authorization URL
 */
export function getSpotifyAuthURL(redirectUri: string): string {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('Missing Spotify client ID. Please check your environment variables.');
  }
  
  // Create a random state value for security
  const state = generateRandomString(16);
  
  // Store the state in localStorage to verify when redirected back
  if (typeof window !== 'undefined') {
    localStorage.setItem('spotify_auth_state', state);
  }
  
  // Define the scope - what permissions we need
  const scope = [
    'user-read-private',
    'user-read-email',
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');
  
  // Build the authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    state,
  });
  
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Get the Spotify authorization URL with PKCE (Preferred method)
 */
export async function getSpotifyAuthURLWithPKCE(redirectUri: string): Promise<string> {
  // Store code verifier in localStorage for later use
  const codeVerifier = generateCodeVerifier();
  localStorage.setItem('spotify_code_verifier', codeVerifier);
  
  // Generate random state
  const state = generateRandomString(16);
  localStorage.setItem('spotify_auth_state', state);

  // Generate code challenge
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Required scopes for the application
  const scope = [
    'user-read-private',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private'
  ].join(' ');

  // Build the authorization URL with PKCE
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
    scope,
    show_dialog: 'true'
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Validate the state parameter returned from Spotify
 */
export function validateState(returnedState: string): boolean {
  const originalState = localStorage.getItem('spotify_auth_state');
  return originalState === returnedState;
}

/**
 * Exchange the authorization code for an access token using PKCE
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Clear the code verifier and state from localStorage
  localStorage.removeItem('spotify_code_verifier');
  localStorage.removeItem('spotify_auth_state');

  return response.json();
} 