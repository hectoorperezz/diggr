export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { cookies } from "next/headers"
import Link from "next/link"
import { getSession, getUser } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { UserNav } from "@/components/user-nav"

export default async function ApplicationPage() {
  // Get the Supabase session
  const session = await getSession()
  const user = await getUser()

  if (!session || !user) {
    redirect("/auth/signin")
  }

  // Check for Spotify connection
  const accessToken = cookies().get("spotify_access_token")?.value
  const userId = cookies().get("spotify_user_id")?.value

  // Server action for Spotify login
  async function handleSpotifyLogin() {
    "use server"

    const clientId = process.env.SPOTIFY_CLIENT_ID
    let redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI

    console.log("Client ID:", clientId ? "Set" : "Not set")
    console.log("Redirect URI:", redirectUri)

    // Verificamos credenciales
    if (!clientId || !redirectUri) {
      console.error("Missing Spotify credentials")
      return { error: "Missing Spotify credentials" }
    }

    // Si deseas quitar la barra final para evitar confusiones:
    if (redirectUri.endsWith("/")) {
      redirectUri = redirectUri.slice(0, -1)
    }

    // Definimos scopes
    const scope = "playlist-modify-private playlist-modify-public user-read-private user-read-email"
    // Generamos un state aleatorio
    const state = Math.random().toString(36).substring(7)

    // Guardamos el state en una cookie para validarlo después
    cookies().set("spotify_auth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })

    // Store the Supabase user ID in the state to link accounts
    const supabaseUserId = user.id
    const combinedState = `${state}:${supabaseUserId}`

    // Construimos la URL de autorización
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(combinedState)}`

    console.log("Auth URL:", authUrl)

    // Redirigimos al usuario a Spotify
    redirect(authUrl)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Modern Spotify-like header */}
      <header className="bg-opacity-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo className="w-32" />
          <UserNav user={{ email: user.email || "" }} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-lg bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4"></div>
            <CardDescription className="text-gray-300">Create personalized Spotify playlists using AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-white text-sm mb-2">Signed in as:</p>
              <p className="text-green-400 font-medium">{user.email}</p>
            </div>

            {accessToken && userId ? (
              <>
                <p className="text-center text-gray-300">
                  Your Spotify account is connected. Ready to create a playlist?
                </p>
                <div className="flex justify-center">
                  <Link href="/questionnaire">
                    <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full">
                      Create Playlist
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-gray-300">
                  Connect your Spotify account to get started. We'll ask you a few questions about your music
                  preferences and create the perfect playlist for you.
                </p>
                <div className="flex justify-center">
                  <form action={handleSpotifyLogin}>
                    <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full">
                      Connect with Spotify
                    </Button>
                  </form>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

