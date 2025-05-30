import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Log for debugging
  console.log('Auth callback:', { code: !!code, error, error_description });

  if (error) {
    console.error('Auth error:', error, error_description);
    // Redirect to login with error
    return NextResponse.redirect(
      requestUrl.origin + '/auth/login?error=' + encodeURIComponent(error_description || error)
    );
  }

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(
          requestUrl.origin + '/auth/login?error=' + encodeURIComponent(error.message)
        );
      }

      console.log('Session established successfully');
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      return NextResponse.redirect(
        requestUrl.origin + '/auth/login?error=An unexpected error occurred'
      );
    }
  }

  // URL to redirect to after sign in
  return NextResponse.redirect(requestUrl.origin + '/dashboard');
} 