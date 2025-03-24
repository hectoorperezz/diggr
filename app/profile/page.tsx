import { getSession, getUser } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { UserNav } from "@/components/user-nav"

export default async function ProfilePage() {
  const session = await getSession()
  const user = await getUser()

  if (!session || !user) {
    redirect("/auth/signin")
  }

  // Get profile data from Supabase
  const { data: profile } = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`,
    {
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    },
  ).then((res) => res.json())

  const userProfile = profile?.[0] || {
    spotify_connected: false,
    created_at: user.created_at,
    subscription_tier: "free",
    playlists_created_this_month: 0,
  }

  // Format subscription dates if they exist
  const subscriptionStart = userProfile.subscription_start_date
    ? new Date(userProfile.subscription_start_date).toLocaleDateString()
    : "N/A"

  const subscriptionEnd = userProfile.subscription_end_date
    ? new Date(userProfile.subscription_end_date).toLocaleDateString()
    : "N/A"

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
          <CardHeader>
            <CardTitle className="text-white">Your Profile</CardTitle>
            <CardDescription className="text-gray-400">Manage your account and connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-700 p-4 rounded-lg space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-300">Email</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-300">Spotify Connection</p>
                <p className="text-sm">
                  {userProfile.spotify_connected ? (
                    <span className="text-green-500">Connected</span>
                  ) : (
                    <span className="text-yellow-500">Not connected</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-300">Member Since</p>
                <p className="text-sm text-gray-400">{new Date(userProfile.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="bg-gray-700 p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-300">Current Plan</p>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    userProfile.subscription_tier === "premium"
                      ? "bg-green-900 text-green-300"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  {userProfile.subscription_tier === "premium" ? "Premium" : "Free"}
                </span>
              </div>

              {userProfile.subscription_tier === "free" && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-300">Playlists This Month</p>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, (userProfile.playlists_created_this_month / 5) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-400">{userProfile.playlists_created_this_month}/5</span>
                  </div>
                </div>
              )}

              {userProfile.subscription_tier === "premium" && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-300">Billing Period</p>
                    <p className="text-sm text-gray-400">
                      {subscriptionStart} - {subscriptionEnd}
                    </p>
                  </div>
                </>
              )}

              <div className="pt-2">
                <Link href="/pricing">
                  <Button variant="outline" size="sm" className="w-full">
                    {userProfile.subscription_tier === "premium" ? "Manage Subscription" : "Upgrade to Premium"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <Link href="/application">
              <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full">
                Go to Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

