import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient<Database>({ req, res });
  
  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();
  
  // Log for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Middleware: Path=${req.nextUrl.pathname}, HasSession=${!!session}, Email=${session?.user?.email || 'none'}`);
  }

  // Check if the request is for a protected route
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                          req.nextUrl.pathname.startsWith('/settings') || 
                          req.nextUrl.pathname.startsWith('/create-playlist') || 
                          req.nextUrl.pathname.startsWith('/playlists');

  // Allow access to the /auth/callback route regardless of auth status
  if (req.nextUrl.pathname.startsWith('/auth/callback')) {
    return res;
  }

  // If the route is protected and the user is not authenticated, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is authenticated and trying to access auth pages, redirect to dashboard
  if (session && (req.nextUrl.pathname.startsWith('/auth/login') || req.nextUrl.pathname.startsWith('/auth/register'))) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    // Match all protected routes
    '/dashboard/:path*',
    '/settings/:path*',
    '/create-playlist/:path*',
    '/playlists/:path*',
    // Match authentication routes
    '/auth/login',
    '/auth/register',
    // Match callback route
    '/auth/callback',
  ],
}; 