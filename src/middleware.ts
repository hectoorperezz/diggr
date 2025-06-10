import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Si viene de account-deleted con escape_redirect=true, permitir acceso directo
  if (req.nextUrl.pathname === '/' && req.nextUrl.searchParams.get('escape_redirect') === 'true') {
    console.log('Permitiendo acceso directo desde account-deleted con escape_redirect');
    return res;
  }
  
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

  try {
    // Create admin client for checking deleted status
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Solo verificar si hay sesión
    if (session?.user?.id) {
      // Check if user account is marked as deleted
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('deleted_at')
        .eq('id', session.user.id)
        .not('deleted_at', 'is', null)
        .maybeSingle();

      if (userError) {
        console.error('Error checking deleted status in middleware:', userError);
        return res;
      }

      // If user account is marked as deleted, sign them out and redirect
      if (userData) {
        // Sign the user out
        await supabase.auth.signOut();
        
        // Get cooling period info if available
        let coolingPeriodEnd = null;
        try {
          const { data: coolingData, error: coolingError } = await adminClient
            .from('deleted_accounts')
            .select('cooling_period_end')
            .eq('email', session.user.email)
            .maybeSingle();
          
          if (!coolingError && coolingData) {
            coolingPeriodEnd = coolingData.cooling_period_end;
          }
        } catch (err) {
          console.error('Error getting cooling period info:', err);
        }
        
        // Redirect to a page explaining the account is deleted
        if (req.nextUrl.pathname !== '/account-deleted') {
          const redirectUrl = new URL('/account-deleted', req.url);
          
          // Add cooling period end date if available
          if (coolingPeriodEnd) {
            redirectUrl.searchParams.set('until', encodeURIComponent(coolingPeriodEnd));
          }
          
          // Add message
          redirectUrl.searchParams.set('message', encodeURIComponent(
            'This account has been marked for deletion and cannot be used.'
          ));
          
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  } catch (error) {
    console.error('Error in auth middleware:', error);
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
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - /api/auth/login/check (api route for checking login)
    // - /account-deleted (the deleted account page itself)
    '/((?!_next/static|_next/image|favicon.ico|api/auth/login/check|account-deleted).*)',
  ],
}; 