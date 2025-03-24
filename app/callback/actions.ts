"use server"

import { cookies } from "next/headers"
import { getSpotifyToken, getUserProfile } from "@/lib/spotify"
import { supabase } from "@/lib/supabase"

export async function handleSpotifyCallback(code: string, state: string | undefined) {
  // Obtenemos el estado almacenado en la cookie
  const storedState = cookies().get("spotify_auth_state")?.value

  // Parse the state to extract Supabase user ID if present
  let supabaseUserId: string | null = null
  if (state && state.includes(":")) {
    const [stateValue, userId] = state.split(":")
    if (stateValue !== storedState) {
      return { success: false, error: "State mismatch. Possible CSRF attack." }
    }
    supabaseUserId = userId
  } else if (state !== storedState) {
    return { success: false, error: "State mismatch. Possible CSRF attack." }
  }

  try {
    console.log("Getting Spotify token")
    const tokenData = await getSpotifyToken(code)
    console.log("Token received:", tokenData.access_token ? "Present" : "Missing")

    if (!tokenData.access_token) {
      return { success: false, error: "No access token received from Spotify" }
    }

    // Guardamos el token de acceso en una cookie HTTP-only
    cookies().set("spotify_access_token", tokenData.access_token, {
      maxAge: tokenData.expires_in,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    // Si hay refresh token, lo guardamos
    if (tokenData.refresh_token) {
      cookies().set("spotify_refresh_token", tokenData.refresh_token, {
        maxAge: 30 * 24 * 60 * 60, // 30 días
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
    }

    console.log("Getting user profile")
    const userProfile = await getUserProfile(tokenData.access_token)
    console.log("User profile received:", userProfile.id)

    // Guardamos el ID del usuario
    cookies().set("spotify_user_id", userProfile.id, {
      maxAge: 30 * 24 * 60 * 60, // 30 días
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    // If we have a Supabase user ID, store the Spotify connection
    if (supabaseUserId) {
      // Update the user's profile to mark Spotify as connected
      const { error } = await supabase.from("profiles").upsert({
        id: supabaseUserId,
        spotify_connected: true,
        spotify_id: userProfile.id,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error updating profile:", error)
      }

      // Store the Spotify tokens in a separate table for security
      const { error: tokenError } = await supabase.from("spotify_connections").upsert({
        user_id: supabaseUserId,
        spotify_id: userProfile.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (tokenError) {
        console.error("Error storing Spotify tokens:", tokenError)
      }
    }

    // Limpiamos la cookie de estado
    cookies().set("spotify_auth_state", "", { maxAge: 0, path: "/" })

    return { success: true }
  } catch (error) {
    console.error("Error handling Spotify callback:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

