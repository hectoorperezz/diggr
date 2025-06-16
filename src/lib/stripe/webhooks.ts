import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import Stripe from 'stripe';

// Supabase admin client for direct database access
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Get subscription data for database update
function getSubscriptionData(subscription: Stripe.Subscription) {
  console.log('WEBHOOK: Analizando suscripción', subscription.id);
  
  // Get the price ID from the subscription
  const priceId = subscription.items.data[0]?.price.id;
  const stripePriceId = process.env.STRIPE_PRO_PRICE_ID;
  
  console.log('WEBHOOK: Price ID encontrado:', priceId);
  console.log('WEBHOOK: STRIPE_PRO_PRICE_ID configurado:', stripePriceId);
  console.log('WEBHOOK: Price IDs match?', priceId === stripePriceId);
  
  // Log additional subscription information
  console.log('WEBHOOK: Subscription plan details:',
    JSON.stringify({
      items: subscription.items.data.map(item => ({
        id: item.id,
        priceId: item.price.id,
        productId: item.price.product,
      })),
    })
  );

  let planType: 'free' | 'premium' = 'free';

  /**
   * PREMIUM DETECTION RULES (ENHANCED)
   * --------------------------------------------------
   * 1. If STRIPE_PRO_PRICE_ID env is set and matches priceId → premium.
   * 2. If priceId starts with "price_" and subscription is active → premium (robust matching).
   * 3. If env var is NOT configured (common in local dev) but priceId is present → premium.
   * 4. If subscription is active AND contains at least one item → premium (fallback safety-net).
   */

  if (stripePriceId && priceId === stripePriceId) {
    planType = 'premium';
    console.log('WEBHOOK: Plan determined as PREMIUM (exact price ID match)');
  } else if (priceId && priceId.startsWith('price_') && subscription.status === 'active') {
    // Any active subscription with a valid Stripe price ID is premium
    planType = 'premium';
    console.log('WEBHOOK: Plan determined as PREMIUM (Stripe price detected)');
  } else if (!stripePriceId && priceId) {
    planType = 'premium';
    console.warn('WEBHOOK: STRIPE_PRO_PRICE_ID env not set; defaulting to PREMIUM because priceId exists');
  } else if (subscription.status === 'active' && subscription.items.data.length > 0) {
    // Enhanced detection: Any active subscription with items is considered premium
    // This ensures users who upgrade get premium access even if price IDs don't exactly match
    planType = 'premium';
    console.log('WEBHOOK: Plan determined as PREMIUM based on active status fallback');
  }
  
  console.log('WEBHOOK: Final plan type:', planType);
  console.log('WEBHOOK: Subscription status:', subscription.status);

  // Include basic subscription data and other properties that may be set later
  return {
    stripe_subscription_id: subscription.id,
    plan_type: planType,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    // Additional fields that might be set by other handlers
    cancel_at_period_end: subscription.cancel_at_period_end,
  };
}

// Handler for checkout.session.completed event
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    // First, let's check if this checkout session is for a subscription
    if (!subscriptionId) {
      console.log('No subscription in checkout session, skipping');
      return;
    }

    // Get the user ID from the session metadata or from the customer
    const userId = session.metadata?.userId;

    console.log(`WEBHOOK CHECKOUT: Processing checkout for user ${userId}, subscription ${subscriptionId}, customer ${customerId}`);

    if (!userId) {
      console.error('No user ID in checkout session metadata');
      return;
    }

    // Retrieve the subscription from Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log(`WEBHOOK CHECKOUT: Retrieved subscription from Stripe:`, JSON.stringify(subscription));

    // Get line items to verify this is a premium subscription
    // This adds an extra check to ensure we identify premium purchases correctly
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    console.log(`WEBHOOK CHECKOUT: Session line items:`, JSON.stringify(lineItems.data));
    
    // Force premium plan for any subscription created via checkout
    // This guarantees users who purchase get premium access regardless of price ID matching
    const subscriptionData = {
      ...getSubscriptionData(subscription),
      // Force plan_type to premium for any completed checkout with a subscription
      plan_type: 'premium' as 'free' | 'premium'
    };
    
    console.log(`WEBHOOK CHECKOUT: Updating subscription data with PREMIUM plan:`, JSON.stringify(subscriptionData));

    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log(`WEBHOOK CHECKOUT: Existing subscription:`, JSON.stringify(existingData));

    let data, error;
    if (existingData) {
      console.log('WEBHOOK CHECKOUT: Updating existing subscription row');
      ({ data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          ...subscriptionData,
          stripe_customer_id: customerId,
        })
        .eq('user_id', userId)
        .select());
    } else {
      console.log('WEBHOOK CHECKOUT: Inserting new subscription row');
      ({ data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          stripe_customer_id: customerId,
          ...subscriptionData,
        })
        .select());
    }

    if (error) {
      console.error('WEBHOOK CHECKOUT ERROR: Error updating subscription in database:', error);
      throw error;
    }

    console.log(`WEBHOOK CHECKOUT: Subscription ${subscriptionId} updated for user ${userId}:`, JSON.stringify(data));
  } catch (error) {
    console.error('WEBHOOK CHECKOUT ERROR: Error handling checkout.session.completed:', error);
    throw error;
  }
}

// Handler for customer.subscription.updated event
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID from the subscription
    const customerId = subscription.customer as string;
    console.log(`WEBHOOK UPDATE: Processing subscription update for customer ${customerId}, subscription ${subscription.id}`);
    console.log(`WEBHOOK UPDATE: Subscription status: ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end}`);
    
    // Find the user with this customer ID
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, plan_type')
      .eq('stripe_customer_id', customerId)
      .single();

    let userId: string;
    let currentPlanType: 'free' | 'premium' = 'free';

    if (subscriptionError || !subscriptionData) {
      console.error('WEBHOOK UPDATE ERROR: Error finding user for customer:', subscriptionError);
      console.log('WEBHOOK UPDATE: Trying alternative lookup by subscription ID');
      
      // Try looking up by subscription ID as a fallback
      const { data: subData, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id, plan_type')
        .eq('stripe_subscription_id', subscription.id)
        .single();
        
      if (subError || !subData) {
        console.error('WEBHOOK UPDATE ERROR: Could not find user by subscription ID either:', subError);
        return;
      }
      
      console.log(`WEBHOOK UPDATE: Found user by subscription ID: ${subData.user_id}`);
      userId = subData.user_id;
      currentPlanType = subData.plan_type as 'free' | 'premium';
    } else {
      console.log(`WEBHOOK UPDATE: Found user by customer ID: ${subscriptionData.user_id}`);
      userId = subscriptionData.user_id;
      currentPlanType = subscriptionData.plan_type as 'free' | 'premium';
    }

    // Base update data from subscription details
    const updateData = getSubscriptionData(subscription);
    
    // If the current plan is already premium, let's make sure we don't downgrade it accidentally
    // This preserves premium status for existing premium users
    if (currentPlanType === 'premium' && subscription.status === 'active') {
      console.log(`WEBHOOK UPDATE: Preserving existing premium status for active subscription`);
      updateData.plan_type = 'premium';
    }
    
    // Special handling for canceled subscriptions
    if (subscription.cancel_at_period_end === true) {
      console.log(`WEBHOOK UPDATE: Subscription is set to cancel at period end: ${new Date(subscription.current_period_end * 1000).toISOString()}`);
      
      // We keep plan_type as 'premium' until period_end is reached
      // The status will be 'active' until period_end
      // This ensures users keep premium access until their paid period expires
      updateData.status = subscription.status; // Should still be 'active'
      
      // Add a flag to indicate this subscription is scheduled for cancellation
      updateData.cancel_at_period_end = true;
      
      console.log(`WEBHOOK UPDATE: User will retain premium access until: ${updateData.current_period_end}`);
    } else if (subscription.status === 'canceled') {
      // Immediate cancellation (rare case - typically subscriptions cancel at period end)
      console.log(`WEBHOOK UPDATE: Subscription immediately canceled`);
      
      // Set status to canceled and downgrade to free plan
      updateData.status = 'canceled';
      updateData.plan_type = 'free';
    }
    
    console.log(`WEBHOOK UPDATE: Updating with data:`, JSON.stringify(updateData));

    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log(`WEBHOOK UPDATE: Existing subscription:`, JSON.stringify(existingData));

    // Perform update
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('WEBHOOK UPDATE ERROR: Error updating subscription in database:', error);
      throw error;
    }

    console.log(`WEBHOOK UPDATE: Subscription ${subscription.id} updated for user ${userId}:`, JSON.stringify(data));
  } catch (error) {
    console.error('WEBHOOK UPDATE ERROR: Error handling customer.subscription.updated:', error);
    throw error;
  }
}

// Add the handleSubscriptionDeleted function that was missing
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID from the subscription
    const customerId = subscription.customer as string;
    console.log(`WEBHOOK DELETE: Processing subscription deletion for customer ${customerId}, subscription ${subscription.id}`);

    // Find the user with this customer ID
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (subscriptionError || !subscriptionData) {
      console.error('WEBHOOK DELETE ERROR: Error finding user for customer:', subscriptionError);
      return;
    }

    console.log(`WEBHOOK DELETE: Downgrading subscription for user ${subscriptionData.user_id}`);

    // Update the subscription in the database - downgrade to free plan
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_type: 'free',
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', subscriptionData.user_id)
      .select();

    if (error) {
      console.error('WEBHOOK DELETE ERROR: Error updating subscription in database:', error);
      throw error;
    }

    console.log(`WEBHOOK DELETE: Subscription ${subscription.id} canceled for user ${subscriptionData.user_id}:`, JSON.stringify(data));
  } catch (error) {
    console.error('WEBHOOK DELETE ERROR: Error handling customer.subscription.deleted:', error);
    throw error;
  }
}

// Main webhook handler function
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    console.log(`WEBHOOK: Processing event type ${event.type}, ID ${event.id}`);
    
    // Log the event data for important subscription events to help with debugging
    if (event.type.startsWith('customer.subscription') || event.type === 'checkout.session.completed') {
      const eventData = event.data.object as any;
      console.log(`WEBHOOK: Event data summary:`, JSON.stringify({
        id: eventData.id,
        customerId: eventData.customer,
        subscriptionId: eventData.subscription || eventData.id,
        status: eventData.status,
        planType: eventData.plan?.id || 'unknown',
        priceId: eventData.items?.data[0]?.price?.id || eventData.display_items?.[0]?.price?.id || 'unknown'
      }));
    }
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      // Handle billing portal events
      case 'billing_portal.configuration.created':
      case 'billing_portal.configuration.updated':
        console.log(`WEBHOOK: Received portal configuration event: ${event.type}`);
        // These events don't require database updates, just acknowledge them
        break;
      case 'billing_portal.session.created':
        console.log(`WEBHOOK: Billing portal session created for customer: ${
          (event.data.object as any).customer
        }`);
        break;
      default:
        console.log(`WEBHOOK: Unhandled event type: ${event.type}`);
    }
    
    console.log(`WEBHOOK: Successfully processed event ${event.type}, ID ${event.id}`);
    return true;
  } catch (error) {
    console.error(`WEBHOOK ERROR: Error handling webhook event ${event.type}:`, error);
    // We still throw the error to ensure proper error handling up the call stack
    throw error;
  }
}