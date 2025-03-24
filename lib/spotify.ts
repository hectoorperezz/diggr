const SPOTIFY_API = "https://api.spotify.com/v1"
const SPOTIFY_AUTH_API = "https://accounts.spotify.com/api/token"

export async function getSpotifyToken(code: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI

  console.log(
    "Getting Spotify token. Credentials present:",
    clientId ? "Yes" : "No",
    clientSecret ? "Yes" : "No",
    redirectUri,
  )

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Spotify credentials")
  }

  const params = new URLSearchParams()
  params.append("grant_type", "authorization_code")
  params.append("code", code)
  params.append("redirect_uri", redirectUri)

  try {
    console.log("Sending request to Spotify API")
    const response = await fetch(SPOTIFY_AUTH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: params,
    })

    console.log("Spotify API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Spotify API error:", errorData)
      throw new Error(`Failed to get Spotify token: ${errorData.error?.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    console.log("Spotify token received:", data.access_token ? "Yes" : "No")
    return data
  } catch (error) {
    console.error("Error getting Spotify token:", error)
    throw error
  }
}

export async function getUserProfile(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Error getting user profile, response:", errorData)
    throw new Error(`Failed to get user profile: ${errorData.error?.message || JSON.stringify(errorData)}`)
  }

  return response.json()
}

export async function createSpotifyPlaylist(accessToken: string, userId: string, name: string, description: string) {
  const response = await fetch(`${SPOTIFY_API}/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Error creating playlist, response:", errorData)
    throw new Error("Failed to create playlist: " + (errorData.error?.message || JSON.stringify(errorData)))
  }

  return response.json()
}

export async function addTracksToPlaylist(accessToken: string, playlistId: string, trackUris: string[]) {
  const response = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uris: trackUris,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Error adding tracks to playlist, response:", errorData)
    throw new Error("Failed to add tracks to playlist: " + (errorData.error?.message || JSON.stringify(errorData)))
  }

  return response.json()
}

export async function searchTracks(accessToken: string, query: string, limit = 50) {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: limit.toString(),
  })

  const response = await fetch(`${SPOTIFY_API}/search?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Error searching tracks, response:", errorData)
    throw new Error("Failed to search tracks: " + (errorData.error?.message || JSON.stringify(errorData)))
  }

  return response.json()
}

export async function getPlaylist(accessToken: string, playlistId: string) {
  const response = await fetch(`${SPOTIFY_API}/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Error getting playlist, response:", errorData)
    throw new Error("Failed to get playlist: " + (errorData.error?.message || JSON.stringify(errorData)))
  }

  return response.json()
}

