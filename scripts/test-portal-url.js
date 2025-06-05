// Test script to verify Stripe portal URL generation
require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

async function testPortalUrl() {
  try {
    console.log('=== STRIPE PORTAL URL TEST ===');
    
    // Check if we have essential environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('ERROR: STRIPE_SECRET_KEY is missing from environment variables');
      return;
    }
    
    console.log('✓ Stripe secret key found');
    
    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    // Get all customers to choose from
    console.log('Fetching customers from Stripe...');
    const customers = await stripe.customers.list({ limit: 10 });
    
    if (customers.data.length === 0) {
      console.error('ERROR: No customers found in Stripe account');
      return;
    }
    
    console.log(`Found ${customers.data.length} customers in Stripe account`);
    
    // Use the first customer for testing
    const customer = customers.data[0];
    console.log(`Using customer: ${customer.id} (${customer.email || 'No email'})`);
    
    // Check if the customer has any subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1
    });
    
    if (subscriptions.data.length === 0) {
      console.log('Note: This customer has no subscriptions. Portal URL may not show subscription management options');
    } else {
      console.log(`Customer has ${subscriptions.data.length} subscriptions`);
      const sub = subscriptions.data[0];
      console.log(`Subscription: ${sub.id}, Status: ${sub.status}, Plan: ${sub.items.data[0]?.price.id || 'Unknown'}`);
    }
    
    // Create a portal session
    console.log('Creating portal session...');
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: 'http://localhost:3000/settings',
    });
    
    console.log('\n✅ SUCCESS: Portal URL generated successfully');
    console.log(`\nPortal URL: ${session.url}`);
    console.log('\nTry opening this URL in your browser');
  } catch (error) {
    console.error('\n❌ ERROR generating portal URL:');
    console.error(error);
    
    if (error.type === 'StripeInvalidRequestError') {
      console.log('\nCommon reasons for this error:');
      console.log('1. Customer ID is invalid or does not exist');
      console.log('2. Billing portal is not enabled for your Stripe account');
      console.log('3. Billing portal configuration is missing required settings');
      console.log('\nVisit https://dashboard.stripe.com/settings/billing/portal to verify your portal settings');
    }
  }
}

// Run the test
testPortalUrl(); 