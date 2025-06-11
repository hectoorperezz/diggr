import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createPortalSession } from '@/lib/stripe/client';

// This function handles the POST request and returns a redirect response
export async function POST(request: NextRequest) {
  console.log('[PORTAL-DIRECT] Received request');
  
  try {
    // Get the current user's session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('[PORTAL-DIRECT] No session found');
      return new Response('Unauthorized', { status: 401 });
    }
    
    console.log('[PORTAL-DIRECT] User authenticated:', session.user.id);

    // Extraer la URL base de la solicitud
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    // Parse form data
    const formData = await request.formData();
    const returnUrl = formData.get('returnUrl') as string || `${origin}/settings`;
    
    console.log('[PORTAL-DIRECT] Return URL:', returnUrl);
    
    // Create a portal session
    console.log('[PORTAL-DIRECT] Creating portal session');
    const portalSession = await createPortalSession(
      session.user.id,
      session.user.email as string,
      returnUrl
    );

    if (!portalSession || !portalSession.url) {
      console.error('[PORTAL-DIRECT] Failed to create portal URL');
      return new Response('Failed to create portal URL', { status: 500 });
    }
    
    console.log('[PORTAL-DIRECT] Portal URL created, redirecting to:', portalSession.url);
    
    // Return a response that redirects to the portal URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': portalSession.url,
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error('[PORTAL-DIRECT] Error:', error.message);
    return new Response(error.message || 'An error occurred', { status: 500 });
  }
} 