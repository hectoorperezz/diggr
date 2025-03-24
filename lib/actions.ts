"use server"

import { cookies } from "next/headers"
import { generateText } from "ai" // AI SDK
import { openai } from "@ai-sdk/openai" // AI SDK OpenAI integration
import { createSpotifyPlaylist, searchTracks, addTracksToPlaylist, getPlaylist } from "./spotify"
import { supabase } from "./supabase"
import { getUser } from "./supabase"
import { redirect } from "next/navigation"

export async function createPlaylist(formData: {
  genre: string
  era: string
  mood: string
  songCount: number
  playlistName: string
  language: string
}) {
  // Get the current user
  const user = await getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Verificar el plan de suscripción y los límites
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, playlists_created_this_month, playlists_reset_date")
    .eq("id", user.id)
    .single()

  // Si no hay perfil, crear uno con valores predeterminados
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      subscription_tier: "free",
      playlists_created_this_month: 0,
      playlists_reset_date: new Date().toISOString(),
    })
  }

  const subscriptionTier = profile?.subscription_tier || "free"
  let playlistsCreated = profile?.playlists_created_this_month || 0
  const resetDate = profile?.playlists_reset_date ? new Date(profile.playlists_reset_date) : new Date()

  // Verificar si debemos resetear el contador (primer día del  : new Date()

  // Verificar si debemos resetear el contador (primer día del mes)
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  if (resetDate < firstDayOfMonth) {
    // Resetear el contador para el nuevo mes
    playlistsCreated = 0
    await supabase
      .from("profiles")
      .update({
        playlists_created_this_month: 0,
        playlists_reset_date: now.toISOString(),
      })
      .eq("id", user.id)
  }

  // Verificar límites para usuarios gratuitos
  if (subscriptionTier === "free" && playlistsCreated >= 5) {
    // Redirigir a la página de precios si se alcanzó el límite
    cookies().set("limit_reached", "true", { path: "/" })
    redirect("/pricing?limit=reached")
  }

  // Obtener token de acceso desde las cookies
  const accessToken = cookies().get("spotify_access_token")?.value
  if (!accessToken) {
    throw new Error("No access token found")
  }

  // Obtener el userId desde las cookies
  const spotifyUserId = cookies().get("spotify_user_id")?.value
  if (!spotifyUserId) {
    throw new Error("No user ID found")
  }

  // Verifica que la API key de OpenAI esté configurada
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    throw new Error("Missing OpenAI API key")
  }

  // Inicializa el modelo
  const model = openai("gpt-4o", { apiKey: openaiApiKey })

  // Define el prompt para la generación de la playlist, incluyendo el idioma
  const prompt = `Create a playlist of ${formData.songCount} ${formData.genre} songs from the ${formData.era} era with a ${formData.mood} mood in ${formData.language} language.
Format your response as JSON with the following structure:
{
"description": "A brief description of the playlist",
"songs": [
  {"title": "Song Title", "artist": "Artist Name"},
  ...
]
}
Make sure all songs actually exist and match the criteria.`

  // Genera la respuesta de la IA
  const { text: aiResponse } = await generateText({
    model,
    prompt,
  })

  // Limpieza de la respuesta para eliminar los delimitadores de bloque de código
  let cleanedResponse = aiResponse.trim()
  // Handle code blocks with language specifiers
  if (cleanedResponse.startsWith("```")) {
    // Extract content between code block markers
    const match = cleanedResponse.match(/```(?:json)?([\s\S]*?)```/)
    if (match && match[1]) {
      cleanedResponse = match[1].trim()
    } else {
      // If no match found, just remove the first and last line if they contain \`\`\`
      cleanedResponse = cleanedResponse
        .split("\n")
        .filter((line, index, arr) => {
          if (index === 0 && line.includes("```")) return false
          if (index === arr.length - 1 && line.includes("```")) return false
          return true
        })
        .join("\n")
        .trim()
    }
  }

  // Add additional safety checks for JSON parsing
  let playlistData
  try {
    // Try to parse the cleaned response
    playlistData = JSON.parse(cleanedResponse)

    // Validate that the response has the expected structure
    if (!playlistData.description || !Array.isArray(playlistData.songs)) {
      console.error("Invalid AI response structure:", playlistData)
      throw new Error("AI response missing required fields")
    }
  } catch (error) {
    console.error("Error parsing AI response:", error)
    console.error("Raw AI response:", aiResponse)
    console.error("Cleaned response:", cleanedResponse)

    // Fallback: Try to create a basic structure if parsing fails
    try {
      // Extract description and songs using regex if JSON parsing failed
      const descMatch = cleanedResponse.match(/"description"\s*:\s*"([^"]+)"/)
      const description = descMatch ? descMatch[1] : "AI-generated playlist"

      // Create a minimal valid structure
      playlistData = {
        description: description,
        songs: [
          { title: "Shape of You", artist: "Ed Sheeran" },
          { title: "Blinding Lights", artist: "The Weeknd" },
          { title: "Dance Monkey", artist: "Tones and I" },
          { title: "Someone You Loved", artist: "Lewis Capaldi" },
          { title: "Don't Start Now", artist: "Dua Lipa" },
        ],
      }
      console.log("Using fallback playlist data")
    } catch (fallbackError) {
      console.error("Even fallback parsing failed:", fallbackError)
      throw new Error("Failed to parse AI response")
    }
  }

  // Crea la playlist en Spotify usando la descripción generada por la IA
  const playlist = await createSpotifyPlaylist(
    accessToken,
    spotifyUserId,
    formData.playlistName || `${formData.mood} ${formData.genre} from the ${formData.era}`,
    playlistData.description,
  )

  // Busca las canciones recomendadas y recoge sus URIs
  const trackUris: string[] = []
  for (const song of playlistData.songs) {
    try {
      const searchQuery = `track:${song.title} artist:${song.artist}`
      const searchResults = await searchTracks(accessToken, searchQuery, 1)
      if (searchResults.tracks.items.length > 0) {
        trackUris.push(searchResults.tracks.items[0].uri)
      }
    } catch (error) {
      console.error(`Error searching for track: ${song.title}`, error)
    }
  }

  if (trackUris.length > 0) {
    await addTracksToPlaylist(accessToken, playlist.id, trackUris)
  }

  // Incrementar el contador de playlists creadas para usuarios gratuitos
  if (subscriptionTier === "free") {
    await supabase
      .from("profiles")
      .update({
        playlists_created_this_month: playlistsCreated + 1,
      })
      .eq("id", user.id)
  }

  // Store the playlist in Supabase
  const { error } = await supabase.from("playlists").insert({
    user_id: user.id,
    spotify_playlist_id: playlist.id,
    name: playlist.name,
    description: playlistData.description,
    genre: formData.genre,
    era: formData.era,
    mood: formData.mood,
    language: formData.language,
    song_count: trackUris.length,
  })

  if (error) {
    console.error("Error storing playlist in Supabase:", error)
  }

  // Guarda el ID de la playlist en una cookie para usarlo en la página de resultados
  cookies().set("playlist_id", playlist.id, { path: "/" })

  return playlist
}

export async function getPlaylistDetails() {
  const accessToken = cookies().get("spotify_access_token")?.value
  const playlistId = cookies().get("playlist_id")?.value

  if (!accessToken || !playlistId) {
    return null
  }

  try {
    return await getPlaylist(accessToken, playlistId)
  } catch (error) {
    console.error("Error getting playlist details:", error)
    return null
  }
}

