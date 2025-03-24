import { getSession, getUser } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check } from "lucide-react"
import { SubscribeButton } from "@/components/subscription/subscribe-button"
import { LimitBanner } from "./limit-banner"
import { SubscriptionStatus } from "@/components/subscription/subscription-status"

export default async function PricingPage() {
  const session = await getSession()
  const user = session ? await getUser() : null

  // Get user subscription status if logged in
  let subscriptionTier = "free"
  if (user) {
    const { data } = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=subscription_tier`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      },
    ).then((res) => res.json())

    subscriptionTier = data?.[0]?.subscription_tier || "free"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Modern Spotify-like header */}
      <header className="bg-opacity-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo className="w-32" />
          {user ? (
            <UserNav user={{ email: user.email || "" }} />
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-white hover:text-green-400">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" className="text-white border-green-500 hover:bg-green-500">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <LimitBanner />
        <SubscriptionStatus />

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get the most out of your music experience with our premium features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 flex flex-col h-full">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Free</h2>
              <p className="text-gray-400">Perfect for casual listeners</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Create up to 5 playlists per month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>AI-powered playlist generation</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Connect with your Spotify account</span>
              </li>
            </ul>

            <div className="mt-auto">
              {user ? (
                subscriptionTier === "free" ? (
                  <Button disabled className="w-full bg-gray-600 cursor-not-allowed">
                    Current Plan
                  </Button>
                ) : (
                  <SubscribeButton tier="free" userId={user.id} currentTier={subscriptionTier} />
                )
              ) : (
                <Link href="/auth/signup">
                  <Button className="w-full bg-gray-600 hover:bg-gray-700">Sign Up Free</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-gray-800 rounded-xl p-8 border border-green-600 flex flex-col h-full relative overflow-hidden">
            {/* Recommended badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-green-600 text-white px-4 py-1 transform rotate-45 translate-x-2 translate-y-3 text-sm font-medium">
                Popular
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Premium</h2>
              <p className="text-gray-400">For music enthusiasts</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span className="font-bold">Unlimited playlists</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Priority AI processing</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Advanced customization options</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Exclusive premium features</span>
              </li>
            </ul>

            <div className="mt-auto">
              {user ? (
                subscriptionTier === "premium" ? (
                  <Button disabled className="w-full bg-gray-600 cursor-not-allowed">
                    Current Plan
                  </Button>
                ) : (
                  <SubscribeButton tier="premium" userId={user.id} currentTier={subscriptionTier} />
                )
              ) : (
                <Link href="/auth/signup">
                  <Button className="w-full bg-green-600 hover:bg-green-700">Get Premium</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

