import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getPlaylistDetails } from "@/lib/actions"
import { Logo } from "@/components/logo"
import { UserNav } from "@/components/user-nav"
import { getUser } from "@/lib/supabase"

export default async function ResultsPage() {
  const playlist = await getPlaylistDetails()
  const user = await getUser()

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <header className="bg-opacity-0 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Logo className="w-32" />
            <UserNav user={{ email: user?.email || "" }} />
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-70px)] flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Something went wrong</CardTitle>
              <CardDescription>We couldn't find your playlist details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Please try creating a playlist again.</p>
              <div className="flex justify-center">
                <Link href="/">
                  <Button>Go Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="bg-opacity-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo className="w-32" />
          <UserNav user={{ email: user?.email || "" }} />
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-70px)] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Your Playlist is Ready!</CardTitle>
            <CardDescription>We've created a personalized playlist based on your preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-md">
              {playlist.images && playlist.images[0] ? (
                <img
                  src={playlist.images[0].url || "/placeholder.svg"}
                  alt="Playlist cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">No cover image</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold">{playlist.name}</h3>
              <p className="text-gray-600">{playlist.tracks.total} songs</p>
              <p className="text-gray-600">{playlist.description}</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Songs:</h4>
              <ul className="space-y-2">
                {playlist.tracks.items?.slice(0, 5).map((item: any, index: number) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.track.name}</span>
                    <span className="text-gray-500">{item.track.artists[0].name}</span>
                  </li>
                ))}
                {playlist.tracks.total > 5 && (
                  <li className="text-center text-gray-500">And {playlist.tracks.total - 5} more songs...</li>
                )}
              </ul>
            </div>

            <div className="flex justify-center space-x-4 pt-4">
              <a href={playlist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-500 hover:bg-green-600">Open in Spotify</Button>
              </a>
              <Link href="/questionnaire">
                <Button variant="outline">Create Another Playlist</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

