// Script to list Stripe products and prices
require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

async function listProductsAndPrices() {
  try {
    // Get the Stripe secret key from environment variables
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      console.error('STRIPE_SECRET_KEY is not set in your .env.local file');
      return;
    }
    
    // Initialize Stripe with the secret key
    const stripe = new Stripe(secretKey);
    
    // List all active products
    console.log('Fetching active products...');
    const products = await stripe.products.list({
      active: true,
      limit: 10,
    });
    
    if (products.data.length === 0) {
      console.log('No active products found in your Stripe account');
      console.log('\nYou need to create a product for your Pro subscription:');
      console.log('1. Go to https://dashboard.stripe.com/products');
      console.log('2. Click "Add product"');
      console.log('3. Enter "Diggr Pro Subscription" as the name');
      console.log('4. Set up recurring pricing');
      console.log('5. After creating, copy the Price ID (starts with price_)');
      return;
    }
    
    console.log('\nActive Products:');
    products.data.forEach((product) => {
      console.log(`- ${product.name} (${product.id})`);
    });
    
    // List all active prices
    console.log('\nFetching active prices...');
    const prices = await stripe.prices.list({
      active: true,
      limit: 20,
    });
    
    if (prices.data.length === 0) {
      console.log('No active prices found in your Stripe account');
      return;
    }
    
    console.log('\nActive Prices:');
    prices.data.forEach((price) => {
      const amount = price.unit_amount / 100;
      const currency = price.currency.toUpperCase();
      const productId = price.product;
      const product = products.data.find(p => p.id === productId);
      
      console.log(`- ${product ? product.name : 'Unknown Product'}: ${amount} ${currency} (${price.id})`);
    });
    
    console.log('\nTo fix your checkout error:');
    console.log('1. Copy one of the price IDs above (starts with price_)');
    console.log('2. Add this line to your .env.local file:');
    console.log('   STRIPE_PRO_PRICE_ID=price_your_selected_id_here');
    console.log('3. Add this line to your .env.local file:');
    console.log('   STRIPE_PRO_PRODUCT_ID=prod_your_selected_product_id_here');
    console.log('4. Restart your Next.js server');
    
  } catch (error) {
    console.error('Error fetching products and prices:', error);
  }
}

listProductsAndPrices(); 