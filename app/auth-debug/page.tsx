"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function AuthDebugPage() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAuthData() {
      try {
        // Get session using client-side supabase
        const { data: sessionData } = await supabase.auth.getSession()
        setSession(sessionData.session)

        // Get user using client-side supabase
        const { data: userData } = await supabase.auth.getUser()
        setUser(userData.user)

        // Get cookies (this is a simplified approach, won't show HTTP-only cookies)
        const cookieList = document.cookie.split(";").map((cookie) => cookie.trim())
        setCookies(cookieList)
      } catch (error) {
        console.error("Error loading auth data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAuthData()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Authentication Debug</h1>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle>Session Status</CardTitle>
                <CardDescription className="text-gray-400">
                  {session ? "You are signed in" : "You are not signed in"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 p-4 rounded-md overflow-auto max-h-60 text-sm">
                  {JSON.stringify(session, null, 2) || "No session found"}
                </pre>
              </CardContent>
              <CardFooter>
                {session ? (
                  <Button onClick={handleSignOut} variant="destructive" className="w-full">
                    Sign Out
                  </Button>
                ) : (
                  <Button onClick={() => (window.location.href = "/auth/signin")} className="w-full">
                    Go to Sign In
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle>User Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 p-4 rounded-md overflow-auto max-h-60 text-sm">
                  {JSON.stringify(user, null, 2) || "No user found"}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Browser Cookies</CardTitle>
                <CardDescription className="text-gray-400">
                  Note: HTTP-only cookies are not visible here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {cookies.length > 0 ? (
                    cookies.map((cookie, index) => (
                      <li key={index} className="bg-gray-900 p-2 rounded-md">
                        {cookie}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">No cookies found</li>
                  )}
                </ul>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
                  Refresh Data
                </Button>
                <Button onClick={() => (window.location.href = "/")} variant="outline">
                  Go to Home
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

