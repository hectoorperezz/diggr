import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Use the latest stable API version
});

// Supabase admin client for direct database access
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Subscription price IDs (to be created in Stripe dashboard)
export const SUBSCRIPTION_PRICES = {
  FREE: 'free', // Not a real Stripe ID, just for reference
  PRO: process.env.STRIPE_PRO_PRICE_ID || '',
};

// Create a new customer in Stripe
export async function createCustomer(email: string, userId: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    // Store the customer ID in the database
    await supabaseAdmin
      .from('subscriptions')
      .update({ stripe_customer_id: customer.id })
      .eq('user_id', userId);

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Get or create a Stripe customer for the user
export async function getOrCreateCustomer(userId: string, email: string) {
  // First, try to get the customer ID from the database
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  // If we have a customer ID, fetch the customer from Stripe
  if (subscription?.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
      if (!customer.deleted) {
        return customer;
      }
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      // Continue to create a new customer if there's an error
    }
  }

  // If no customer exists or there was an error, create a new one
  return createCustomer(email, userId);
}

// Create a checkout session for a subscription
export async function createCheckoutSession(userId: string, email: string, priceId: string, returnUrl: string) {
  try {
    const customer = await getOrCreateCustomer(userId, email);

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        userId,
      },
    });

    return checkoutSession;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create a portal session for managing subscriptions
export async function createPortalSession(userId: string, email: string, returnUrl: string) {
  try {
    const customer = await getOrCreateCustomer(userId, email);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });

    return portalSession;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

// Get a user's subscription from Stripe
export async function getSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Construct a webhook event from payload and signature
export function constructWebhookEvent(payload: any, signature: string) {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    throw error;
  }
}

// For testing: List all products and prices
export async function listProductsAndPrices() {
  try {
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });
    
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
    });
    
    return {
      products: products.data,
      prices: prices.data,
    };
  } catch (error) {
    console.error('Error listing products and prices:', error);
    throw error;
  }
}

export default stripe; 