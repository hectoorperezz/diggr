import { Buffer } from 'buffer';

export interface SpotifyAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  expires_at?: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  uri: string;
  popularity: number;
  preview_url: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  public: boolean;
  tracks: {
    total: number;
    items: Array<{ track: SpotifyTrack }>;
  };
  images: Array<{ url: string; height: number; width: number }>;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

/**
 * Get a Spotify access token using the client credentials flow
 */
export async function getClientCredentialsToken(): Promise<SpotifyAccessToken> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify client credentials');
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Exchange an authorization code for an access token
 */
export async function getAccessToken(code: string, customRedirectUri?: string): Promise<SpotifyAccessToken> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = customRedirectUri || process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Spotify client credentials');
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Refresh an access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyAccessToken> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify client credentials');
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    refresh_token: refreshToken, // Spotify doesn't always return a new refresh token
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Search for tracks on Spotify
 */
export async function searchTracks(
  query: string, 
  accessToken: string, 
  limit: number = 10
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.tracks.items;
}

/**
 * Create a playlist on Spotify
 */
export async function createPlaylist(
  userId: string,
  accessToken: string,
  name: string,
  description: string,
  isPublic: boolean = true
): Promise<SpotifyPlaylist> {
  const response = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Add tracks to a playlist
 */
export async function addTracksToPlaylist(
  playlistId: string,
  accessToken: string,
  trackUris: string[]
): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(accessToken: string): Promise<any> {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Upload a custom image to a playlist
 * Note: The image must be a JPEG and under 256KB
 * @param playlistId - The Spotify playlist ID
 * @param accessToken - The Spotify access token
 * @param imageBase64 - The base64-encoded image without the "data:image/jpeg;base64," prefix
 */
export async function uploadPlaylistCover(
  playlistId: string,
  accessToken: string,
  imageBase64: string
): Promise<void> {
  // Remove data URL prefix if it exists
  const base64Data = imageBase64.replace(/^data:image\/jpeg;base64,/, '');
  
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/images`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'image/jpeg',
      },
      body: base64Data,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

/**
 * Get the current user's playlists
 */
export async function getCurrentUserPlaylists(
  accessToken: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ items: SpotifyPlaylist[], total: number, next: string | null }> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a playlist by its ID
 */
export async function getPlaylist(
  playlistId: string,
  accessToken: string
): Promise<SpotifyPlaylist> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
} 