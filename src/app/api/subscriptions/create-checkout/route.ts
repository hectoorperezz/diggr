import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createCheckoutSession, SUBSCRIPTION_PRICES } from '@/lib/stripe/client';

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

    // Create a checkout session
    const checkoutSession = await createCheckoutSession(
      session.user.id,
      session.user.email as string,
      SUBSCRIPTION_PRICES.PRO,
      returnUrl
    );

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 