"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

type Profile = {
  id: string
  email: string
  spotify_connected: boolean
  created_at: string
}

export function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      try {
        // Use the client-side supabase instance
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/signin")
          return
        }

        // Get profile data from profiles table
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)
          return
        }

        setProfile({
          id: user.id,
          email: user.email || "",
          spotify_connected: data?.spotify_connected || false,
          created_at: data?.created_at || user.created_at || "",
        })
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center">User not found. Please sign in.</p>
          <Button className="mt-4 w-full" onClick={() => router.push("/auth/signin")}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Manage your account and connections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Spotify Connection</p>
          <p className="text-sm text-gray-500">
            {profile.spotify_connected ? (
              <span className="text-green-500">Connected</span>
            ) : (
              <span className="text-yellow-500">Not connected</span>
            )}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Member Since</p>
          <p className="text-sm text-gray-500">{new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/application")}>
          Go to App
        </Button>
        <Button variant="destructive" onClick={handleSignOut} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Logging out...
            </span>
          ) : (
            <span className="flex items-center">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

