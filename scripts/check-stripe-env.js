// Script to check Stripe environment variables
console.log('Checking Stripe environment variables...');

// Check for STRIPE_SECRET_KEY
console.log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? 'Set ✓' : 'NOT SET ✗'}`);
if (process.env.STRIPE_SECRET_KEY) {
  console.log(`  Format: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_') ? 'Valid ✓' : 'INVALID ✗'}`);
}

// Check for STRIPE_PRO_PRICE_ID
console.log(`STRIPE_PRO_PRICE_ID: ${process.env.STRIPE_PRO_PRICE_ID ? 'Set ✓' : 'NOT SET ✗'}`);
if (process.env.STRIPE_PRO_PRICE_ID) {
  console.log(`  Format: ${process.env.STRIPE_PRO_PRICE_ID.startsWith('price_') ? 'Valid ✓' : 'INVALID ✗'}`);
} else {
  console.log('  ERROR: This is likely causing your checkout error');
}

// Check for STRIPE_WEBHOOK_SECRET
console.log(`STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Set ✓' : 'NOT SET ✗'}`);
if (process.env.STRIPE_WEBHOOK_SECRET) {
  console.log(`  Format: ${process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_') ? 'Valid ✓' : 'INVALID ✗'}`);
}

// Check for STRIPE_PRO_PRODUCT_ID
console.log(`STRIPE_PRO_PRODUCT_ID: ${process.env.STRIPE_PRO_PRODUCT_ID ? 'Set ✓' : 'NOT SET ✗'}`);
if (process.env.STRIPE_PRO_PRODUCT_ID) {
  console.log(`  Format: ${process.env.STRIPE_PRO_PRODUCT_ID.startsWith('prod_') ? 'Valid ✓' : 'INVALID ✗'}`);
}

console.log('\nTo fix the checkout error:');
console.log('1. Go to your Stripe Dashboard: https://dashboard.stripe.com/');
console.log('2. Navigate to Products > Select your Pro product > Copy the Price ID');
console.log('3. Add to your .env.local file: STRIPE_PRO_PRICE_ID=price_your_id_here');
console.log('4. Restart your development server'); 