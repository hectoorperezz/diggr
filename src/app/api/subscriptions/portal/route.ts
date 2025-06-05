import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createPortalSession } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    console.log('[PORTAL API] Received request to create portal session');
    
    // Get the current user's session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('[PORTAL API] No session found, returning unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[PORTAL API] User authenticated:', session.user.id);

    // Get the return URL from the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[PORTAL API] Failed to parse request body:', e);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { returnUrl } = body;
    console.log('[PORTAL API] Return URL:', returnUrl);

    if (!returnUrl) {
      console.log('[PORTAL API] No return URL provided');
      return NextResponse.json({ error: 'Return URL is required' }, { status: 400 });
    }

    // Create a portal session
    console.log('[PORTAL API] Creating portal session for user:', session.user.id);
    const portalSession = await createPortalSession(
      session.user.id,
      session.user.email as string,
      returnUrl
    );
    
    if (!portalSession || !portalSession.url) {
      console.error('[PORTAL API] Portal session created but missing URL');
      return NextResponse.json({ error: 'Failed to create portal URL' }, { status: 500 });
    }
    
    console.log('[PORTAL API] Portal session created successfully:', portalSession.url);

    // Use a more direct response format
    return NextResponse.json({ 
      success: true,
      url: portalSession.url 
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      } 
    });
  } catch (error: any) {
    console.error('[PORTAL API] Error creating portal session:', error);
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred',
      success: false 
    }, { status: 500 });
  }
} 