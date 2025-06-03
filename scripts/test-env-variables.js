// Script to test loading environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

console.log('Testing direct environment variable loading from .env.local...');

const stripeVariables = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRO_PRODUCT_ID: process.env.STRIPE_PRO_PRODUCT_ID
};

console.log('Environment variables from .env.local:');
console.log(JSON.stringify(stripeVariables, null, 2));

// Check if we have the critical variables
if (!process.env.STRIPE_PRO_PRICE_ID) {
  console.log('\n⚠️ STRIPE_PRO_PRICE_ID is missing or empty - this is causing your checkout error');
}

console.log('\nNote: In Next.js, variables must be prefixed with NEXT_PUBLIC_ to be available on the client side.');
console.log('However, Stripe secret keys should NOT be prefixed as they should only be used on the server side.'); 