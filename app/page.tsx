import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ListMusic, Sparkles, Headphones } from "lucide-react"
import { getSession, getUser } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { UserNav } from "@/components/user-nav"

export default async function HomePage() {
  const session = await getSession()
  const isLoggedIn = !!session
  const user = isLoggedIn ? await getUser() : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <header className="bg-opacity-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo className="w-32" />
          {isLoggedIn && user ? (
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

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="flex flex-col items-center justify-center mb-6">
          <h1 className="text-4xl md:text-6xl font-bold">Discover new music, AI can help you.</h1>
        </div>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mb-10">
          Create personalized Spotify playlists tailored to your preferences using the power of AI
        </p>
        <Link href={isLoggedIn ? "/application" : "/auth/signup"}>
          <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 rounded-full text-lg font-semibold transition-all transform hover:scale-105">
            {isLoggedIn ? "Go to Dashboard" : "Get Started"}
          </Button>
        </Link>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<ListMusic size={48} className="text-green-500" />}
            title="Answer Questions"
            description="Tell us about your music preferences, including genre, era, mood, and language."
          />
          <FeatureCard
            icon={<Sparkles size={48} className="text-green-500" />}
            title="AI Generation"
            description="Our AI analyzes your preferences and creates the perfect playlist just for you."
          />
          <FeatureCard
            icon={<Headphones size={48} className="text-green-500" />}
            title="Enjoy Your Music"
            description="Your custom playlist is created directly in your Spotify account, ready to enjoy."
          />
        </div>
      </section>

      {/* Testimonial/Info Section */}
      <section className="bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gray-700 rounded-xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Discover New Music Effortlessly</h2>
            <p className="text-gray-300 text-lg mb-8 text-center">
              Our AI-powered playlist generator helps you discover new music that matches your taste perfectly. Create
              an account, connect your Spotify, and let us do the work for you.
            </p>
            <div className="flex justify-center">
              <Link href={isLoggedIn ? "/application" : "/auth/signup"}>
                <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full">
                  {isLoggedIn ? "Go to Dashboard" : "Sign Up Now"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© {new Date().getFullYear()} AI Playlist Generator. Powered by Spotify and OpenAI.</p>
          <p className="mt-2 text-sm">Not affiliated with Spotify. Created for music lovers.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center text-center transition-transform hover:transform hover:scale-105">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  )
}

