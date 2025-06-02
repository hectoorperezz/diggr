import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createPortalSession } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    // Get the current user's session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the return URL from the request body
    const { returnUrl } = await request.json();

    if (!returnUrl) {
      return NextResponse.json({ error: 'Return URL is required' }, { status: 400 });
    }

    // Create a portal session
    const portalSession = await createPortalSession(
      session.user.id,
      session.user.email as string,
      returnUrl
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 