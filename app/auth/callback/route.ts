import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    try {
      // Create a new supabase client for this route handler
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient(
        {
          cookies: () => cookieStore,
        },
        {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      )

      console.log("Exchanging code for session")
      const result = await supabase.auth.exchangeCodeForSession(code)

      if (result.error) {
        console.error("Error exchanging code for session:", result.error)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(result.error.message)}`, request.url),
        )
      }

      console.log("Session exchange successful")
    } catch (error) {
      console.error("Exception in auth callback:", error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent("Authentication failed")}`, request.url),
      )
    }
  } else {
    console.error("No code provided in callback")
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/application", request.url))
}

