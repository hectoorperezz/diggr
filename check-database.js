// Script to check subscription data in the database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkSubscriptions() {
  try {
    console.log('Checking subscriptions in database...');
    
    // Query all subscriptions
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error retrieving subscriptions:', error);
      return;
    }
    
    console.log(`Found ${subscriptions.length} subscription records in database`);
    
    // Log details of each subscription
    subscriptions.forEach((sub, index) => {
      console.log(`\nSubscription DB Record ${index + 1}:`);
      console.log(`User ID: ${sub.user_id}`);
      console.log(`Plan Type: ${sub.plan_type}`);
      console.log(`Status: ${sub.status}`);
      console.log(`Stripe Subscription ID: ${sub.stripe_subscription_id || 'N/A'}`);
      console.log(`Stripe Customer ID: ${sub.stripe_customer_id || 'N/A'}`);
      console.log(`Current Period Start: ${sub.current_period_start || 'N/A'}`);
      console.log(`Current Period End: ${sub.current_period_end || 'N/A'}`);
      console.log(`Cancel At Period End: ${sub.cancel_at_period_end === true ? 'Yes' : 'No'}`);
      console.log(`Updated At: ${sub.updated_at || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error checking subscriptions:', error);
  }
}

// Run the function
checkSubscriptions().catch(console.error); 