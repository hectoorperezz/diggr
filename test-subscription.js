// Script to test Stripe subscription functionality
require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Get API key and log whether it's available
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
console.log(`API key available: ${!!stripeApiKey}`);
if (!stripeApiKey) {
  console.error('STRIPE_SECRET_KEY environment variable is missing!');
  process.exit(1);
}

// Initialize Stripe client
const stripe = new Stripe(stripeApiKey, {
  apiVersion: '2023-10-16',
});

async function testSubscription() {
  try {
    console.log('Getting all active subscriptions...');
    
    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 10
    });
    
    console.log(`Found ${subscriptions.data.length} active subscriptions`);
    
    // Log details of each subscription
    subscriptions.data.forEach((sub, index) => {
      console.log(`\nSubscription ${index + 1}:`);
      console.log(`ID: ${sub.id}`);
      console.log(`Status: ${sub.status}`);
      console.log(`Customer: ${sub.customer}`);
      console.log(`Period: ${new Date(sub.current_period_start * 1000).toISOString()} to ${new Date(sub.current_period_end * 1000).toISOString()}`);
      console.log(`Cancel at period end: ${sub.cancel_at_period_end}`);
      
      // Check the price and product
      if (sub.items.data.length > 0) {
        const item = sub.items.data[0];
        console.log(`Price: ${item.price.id}`);
        console.log(`Product: ${item.price.product}`);
      }
    });
    
    // Just to confirm environment variables
    console.log('\nEnvironment check:');
    console.log(`STRIPE_PRO_PRICE_ID: ${process.env.STRIPE_PRO_PRICE_ID}`);
    
  } catch (error) {
    console.error('Error testing subscriptions:', error);
  }
}

// Run the function
testSubscription().catch(console.error); 