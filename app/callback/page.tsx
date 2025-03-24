import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { handleSpotifyCallback } from "./actions"

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; state?: string }
}) {
  console.log("Callback page reached. Search params:", searchParams)

  const { code, error, state } = searchParams

  if (error) {
    console.error("Error during Spotify authentication:", error)
    return <CallbackError title="Spotify Authentication Error" description={`Error: ${error}`} />
  }

  if (!code) {
    console.error("No code provided in callback")
    return (
      <CallbackError title="Missing Authorization Code" description="No authorization code was provided by Spotify." />
    )
  }

  // Llamamos a la acción del servidor para intercambiar el code por un token
  const result = await handleSpotifyCallback(code, state)

  if (result.success) {
    console.log("Spotify authentication successful, redirecting to application")

    // Retornamos una página con meta refresh para que se apliquen las cookies
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-500 to-gray-800">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-800">Authentication Successful!</CardTitle>
            <CardDescription>You will be redirected to the application in a few seconds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Your Spotify account is now connected.</p>
            <Link href="/application">
              <Button>Go to Application Now</Button>
            </Link>
          </CardContent>
        </Card>
        <meta httpEquiv="refresh" content="3;url=/application" />
      </main>
    )
  } else {
    console.error("Spotify authentication failed:", result.error)
    return (
      <CallbackError
        title="Authentication Failed"
        description={result.error || "An unknown error occurred during authentication."}
      />
    )
  }
}

function CallbackError({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-500 to-gray-800">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Please try connecting your Spotify account again.</p>
          <div className="flex justify-center">
            <Link href="/application">
              <Button>Go to Application</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

