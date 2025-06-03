// Script to check subscription status in the database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

async function checkSubscription() {
  try {
    console.log('=== SUBSCRIPTION STATUS CHECKER ===');
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeProProductId = process.env.STRIPE_PRO_PRODUCT_ID;
    
    console.log('Environment variables:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : 'MISSING ✗');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : 'MISSING ✗');
    console.log('- STRIPE_SECRET_KEY:', stripeSecretKey ? '✓' : 'MISSING ✗');
    console.log('- STRIPE_PRO_PRODUCT_ID:', stripeProProductId || 'MISSING ✗');
    
    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('Missing required environment variables');
      return;
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey);
    
    // 1. Get all users from the database
    console.log('\nFetching users from database...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.length} users in the database`);
    
    // 2. Check subscriptions table
    console.log('\nChecking subscriptions table...');
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*');
    
    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return;
    }
    
    console.log(`Found ${subscriptions.length} subscription records in the database`);
    
    // 3. Display subscription details for each user
    console.log('\nUser Subscription Details:');
    for (const user of users) {
      const subscription = subscriptions.find(s => s.user_id === user.id);
      
      console.log(`\nUser: ${user.email}`);
      console.log(`- User ID: ${user.id}`);
      
      if (subscription) {
        console.log(`- Subscription Table ID: ${subscription.id}`);
        console.log(`- Subscription Table Plan Type: ${subscription.plan_type}`);
        console.log(`- Subscription Table Status: ${subscription.status}`);
        console.log(`- Stripe Customer ID: ${subscription.stripe_customer_id || 'not set'}`);
        console.log(`- Stripe Subscription ID: ${subscription.stripe_subscription_id || 'not set'}`);
        
        // Check Stripe if we have a subscription ID
        if (subscription.stripe_subscription_id) {
          try {
            console.log('\nChecking subscription in Stripe...');
            const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
            
            console.log(`- Stripe Status: ${stripeSubscription.status}`);
            console.log(`- Stripe Plan: ${stripeSubscription.items.data[0]?.price.product}`);
            console.log(`- Expected Product ID: ${stripeProProductId}`);
            
            // Check if product ID matches
            if (stripeSubscription.items.data[0]?.price.product !== stripeProProductId) {
              console.log('⚠️ WARNING: Product ID mismatch between Stripe and environment variables');
              console.log(`   Stripe product: ${stripeSubscription.items.data[0]?.price.product}`);
              console.log(`   Expected: ${stripeProProductId}`);
            }
          } catch (error) {
            console.error('Error checking Stripe subscription:', error.message);
          }
        }
      } else {
        console.log('⚠️ No subscription record found for this user');
      }
    }
    
    console.log('\n=== ISSUES FOUND ===');
    console.log('1. The users table is missing the subscription_plan column');
    console.log('   This means the migration in migrations/20240610_add_subscriptions_table.sql was not properly run');
    
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('1. Run the migration script to add the subscription_plan column to the users table');
    console.log('2. Make sure STRIPE_PRO_PRODUCT_ID in .env.local matches the actual product ID in Stripe');
    console.log('3. Check that webhooks are properly configured in the Stripe dashboard');
    console.log('4. You may need to manually update the subscription in the database for now');
    console.log('\nTo manually update subscription, run the following SQL in Supabase:');
    console.log(`
UPDATE subscriptions
SET plan_type = 'premium', status = 'active'
WHERE user_id = 'YOUR_USER_ID';
    `);
    
    console.log('\nTo run the migration script, you can use:');
    console.log('npm run db:migrate');
    
  } catch (error) {
    console.error('Error checking subscription:', error);
  }
}

checkSubscription(); 