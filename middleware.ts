import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // Get the pathname
  const { pathname } = request.nextUrl

  // Create a Supabase client configured to use cookies
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/auth/check-email", "/auth/callback"]

  // Protected routes that require authentication
  const protectedRoutes = ["/application", "/questionnaire", "/results", "/profile", "/debug"]

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicAuthRoute = ["/auth/signin", "/auth/signup"].some((route) => pathname.startsWith(route))

  // If user is signed in and trying to access auth pages, redirect to application
  if (session && isPublicAuthRoute) {
    return NextResponse.redirect(new URL("/application", request.url))
  }

  // If the route is protected and the user is not authenticated, redirect to sign in
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }

  // Check for Spotify token for specific routes
  if (["/questionnaire", "/results"].some((route) => pathname.startsWith(route))) {
    const spotifyToken = request.cookies.get("spotify_access_token")
    if (!spotifyToken) {
      return NextResponse.redirect(new URL("/application", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/application/:path*",
    "/questionnaire/:path*",
    "/results/:path*",
    "/profile/:path*",
    "/debug/:path*",
    "/auth/signin/:path*",
    "/auth/signup/:path*",
  ],
}

