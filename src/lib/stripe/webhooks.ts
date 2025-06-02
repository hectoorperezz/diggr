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
  const planType = subscription.items.data[0]?.price.product === process.env.STRIPE_PRO_PRODUCT_ID
    ? 'premium'
    : 'free';

  return {
    stripe_subscription_id: subscription.id,
    plan_type: planType,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
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

    if (!userId) {
      console.error('No user ID in checkout session metadata');
      return;
    }

    // Retrieve the subscription from Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update the subscription in the database
    const subscriptionData = getSubscriptionData(subscription);

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        ...subscriptionData,
        stripe_customer_id: customerId,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription in database:', error);
      throw error;
    }

    console.log(`Subscription ${subscriptionId} updated for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
    throw error;
  }
}

// Handler for customer.subscription.updated event
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID from the subscription
    const customerId = subscription.customer as string;

    // Find the user with this customer ID
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (subscriptionError || !subscriptionData) {
      console.error('Error finding user for customer:', subscriptionError);
      return;
    }

    // Update the subscription in the database
    const updateData = getSubscriptionData(subscription);

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', subscriptionData.user_id);

    if (error) {
      console.error('Error updating subscription in database:', error);
      throw error;
    }

    console.log(`Subscription ${subscription.id} updated for user ${subscriptionData.user_id}`);
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
    throw error;
  }
}

// Handler for customer.subscription.deleted event
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID from the subscription
    const customerId = subscription.customer as string;

    // Find the user with this customer ID
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (subscriptionError || !subscriptionData) {
      console.error('Error finding user for customer:', subscriptionError);
      return;
    }

    // Update the subscription in the database - downgrade to free plan
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_type: 'free',
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', subscriptionData.user_id);

    if (error) {
      console.error('Error updating subscription in database:', error);
      throw error;
    }

    console.log(`Subscription ${subscription.id} canceled for user ${subscriptionData.user_id}`);
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
    throw error;
  }
}

// Main webhook handler function
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
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
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    throw error;
  }
} 