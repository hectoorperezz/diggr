// Script to manually update subscription status
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function updateSubscription() {
  try {
    console.log('=== SUBSCRIPTION UPDATER ===');
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return;
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all users first to let the user choose which one to update
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log('Available users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.id})`);
    });
    
    // For this script, we'll use the second user (index 1) since that's the one with the Stripe Customer ID
    // In a real app, you'd prompt the user to select, but we'll hardcode for simplicity
    const selectedUserIndex = 1; // 0-based index, so this is the second user
    const selectedUser = users[selectedUserIndex];
    
    if (!selectedUser) {
      console.error('Selected user not found');
      return;
    }
    
    console.log(`\nUpdating subscription for user: ${selectedUser.email}`);
    
    // Update the subscription in the database
    const { data: updateData, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_type: 'premium',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', selectedUser.id)
      .select();
    
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return;
    }
    
    console.log('Subscription updated successfully!');
    console.log('New subscription data:', updateData);
    
    console.log('\nNext steps:');
    console.log('1. Restart your Next.js server: npm run dev');
    console.log('2. Refresh your browser page to see the updated subscription status');
    console.log('3. Fix the webhook issue to ensure future subscription changes are processed correctly');
    
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

updateSubscription(); 