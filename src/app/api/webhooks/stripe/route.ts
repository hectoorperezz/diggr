import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe/client';
import { handleStripeWebhook } from '@/lib/stripe/webhooks';

// Required config for webhook routes
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get the signature from the header
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature found' }, { status: 400 });
    }

    // In App Router, we can directly get the raw body without bodyParser config
    const body = await request.text();

    // Verify the event
    const event = constructWebhookEvent(body, signature);

    // Handle the event
    await handleStripeWebhook(event);

    // Return a successful response
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 