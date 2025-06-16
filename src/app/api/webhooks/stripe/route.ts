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
      console.error('WEBHOOK ERROR: No signature found in headers');
      return NextResponse.json({ error: 'No signature found' }, { status: 400 });
    }

    // In App Router, we can directly get the raw body without bodyParser config
    const body = await request.text();

    // Verify the event
    const event = constructWebhookEvent(body, signature);
    console.log(`WEBHOOK: Processing ${event.type} event with ID ${event.id}`);

    // Handle the event
    await handleStripeWebhook(event);

    // Return a successful response
    console.log(`WEBHOOK: Successfully processed ${event.type} event`);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('WEBHOOK ERROR: Error handling webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 