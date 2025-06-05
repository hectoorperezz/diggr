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
  console.log(`[STRIPE] Getting or creating customer for user: ${userId}, email: ${email}`);
  
  // First, try to get the customer ID from the database
  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();
  
  if (subscriptionError) {
    console.error(`[STRIPE] Error fetching subscription for user ${userId}:`, subscriptionError);
  } else {
    console.log(`[STRIPE] Found subscription:`, subscription);
  }

  // If we have a customer ID, fetch the customer from Stripe
  if (subscription?.stripe_customer_id) {
    try {
      console.log(`[STRIPE] Retrieving existing customer: ${subscription.stripe_customer_id}`);
      const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
      
      if (!customer.deleted) {
        console.log(`[STRIPE] Successfully retrieved customer:`, customer.id);
        return customer;
      } else {
        console.log(`[STRIPE] Customer found but marked as deleted, will create new`);
      }
    } catch (error: any) {
      // Log the specific Stripe error
      if (error.type === 'StripeInvalidRequestError') {
        console.error(`[STRIPE] Invalid customer ID: ${subscription.stripe_customer_id}`, error.message);
      } else {
        console.error(`[STRIPE] Error retrieving customer:`, error);
      }
      // Continue to create a new customer if there's an error
      console.log(`[STRIPE] Will create new customer due to error`);
    }
  } else {
    console.log(`[STRIPE] No customer ID found in database, creating new customer`);
  }

  // If no customer exists or there was an error, create a new one
  try {
    const newCustomer = await createCustomer(email, userId);
    console.log(`[STRIPE] Created new customer: ${newCustomer.id}`);
    return newCustomer;
  } catch (error) {
    console.error(`[STRIPE] Failed to create customer:`, error);
    throw error;
  }
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
    console.log('[STRIPE CLIENT] Creating portal session for user:', userId, 'email:', email);
    
    // Validate inputs
    if (!userId || !email || !returnUrl) {
      const missingParams: string[] = [];
      if (!userId) missingParams.push('userId');
      if (!email) missingParams.push('email');
      if (!returnUrl) missingParams.push('returnUrl');
      
      const errorMsg = `Missing required parameters: ${missingParams.join(', ')}`;
      console.error('[STRIPE CLIENT] ' + errorMsg);
      throw new Error(errorMsg);
    }
    
    // Get the customer
    let customer;
    try {
      customer = await getOrCreateCustomer(userId, email);
      console.log('[STRIPE CLIENT] Got customer:', customer.id);
    } catch (customerError) {
      console.error('[STRIPE CLIENT] Failed to get or create customer:', customerError);
      throw new Error('Failed to retrieve customer information');
    }
    
    if (!customer || !customer.id) {
      console.error('[STRIPE CLIENT] Invalid customer object returned');
      throw new Error('Invalid customer data');
    }

    // Create the portal session
    console.log('[STRIPE CLIENT] Creating billing portal session with return URL:', returnUrl);
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: returnUrl,
      });
      
      if (!portalSession || !portalSession.url) {
        console.error('[STRIPE CLIENT] Portal session created but missing URL');
        throw new Error('Portal session created but missing URL');
      }
      
      console.log('[STRIPE CLIENT] Portal session created:', portalSession.id, 'URL:', portalSession.url);
      return portalSession;
    } catch (portalError: any) {
      // Handle specific Stripe errors
      if (portalError.type === 'StripeInvalidRequestError') {
        console.error(`[STRIPE CLIENT] Invalid request to create portal:`, portalError.message);
        
        // Check for common issues
        if (portalError.message.includes('No subscription found')) {
          throw new Error('No active subscription found for this customer');
        } else if (portalError.message.includes('does not exist')) {
          throw new Error('Customer no longer exists in Stripe');
        }
      }
      
      console.error('[STRIPE CLIENT] Error creating portal session:', portalError);
      throw portalError;
    }
  } catch (error) {
    console.error('[STRIPE CLIENT] Error in createPortalSession:', error);
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