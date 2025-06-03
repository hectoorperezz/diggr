// Script to fix subscription records
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixSubscription() {
  try {
    console.log('=== SUBSCRIPTION FIXER ===');
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return;
    }
    
    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. First check which users have active sessions
    console.log('Checking active sessions...');
    const { data: sessions, error: sessionsError } = await supabase.auth.admin.listUsers();
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return;
    }
    
    console.log(`Found ${sessions.users.length} users`);
    
    // 2. Get all users from the users table
    console.log('\nFetching users from database...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.length} users in the database`);
    
    // 3. Log each session with user ID and email
    console.log('\nActive users:');
    sessions.users.forEach((sessionUser, index) => {
      console.log(`${index + 1}. ${sessionUser.email} (ID: ${sessionUser.id})`);
    });
    
    // 4. Check existing subscription records
    console.log('\nChecking existing subscription records...');
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*');
    
    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return;
    }
    
    console.log(`Found ${subscriptions.length} subscription records`);
    
    // Display each subscription record
    subscriptions.forEach((sub, index) => {
      const user = users.find(u => u.id === sub.user_id);
      console.log(`${index + 1}. User: ${user?.email || 'Unknown'} (${sub.user_id})`);
      console.log(`   Plan: ${sub.plan_type}, Status: ${sub.status}`);
    });
    
    // 5. Now update or create subscription records for all users
    console.log('\nUpdating subscription records for all users...');
    
    for (const sessionUser of sessions.users) {
      console.log(`\nProcessing user: ${sessionUser.email} (${sessionUser.id})`);
      
      // Check if user has a subscription record
      const existingSub = subscriptions.find(sub => sub.user_id === sessionUser.id);
      
      if (existingSub) {
        console.log('Existing subscription found, updating to premium...');
        
        // Update existing subscription
        const { data: updateData, error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_type: 'premium',
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', sessionUser.id)
          .select();
        
        if (updateError) {
          console.error('Error updating subscription:', updateError);
        } else {
          console.log('Subscription updated successfully');
        }
      } else {
        console.log('No subscription record found, creating new one...');
        
        // Create new subscription
        const { data: insertData, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: sessionUser.id,
            plan_type: 'premium',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (insertError) {
          console.error('Error creating subscription:', insertError);
        } else {
          console.log('Subscription created successfully');
        }
      }
      
      // Also check if user has a usage_stats record
      const { data: usageData, error: usageError } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', sessionUser.id)
        .single();
      
      if (usageError && usageError.code === 'PGRST116') {
        console.log('No usage_stats record found, creating new one...');
        
        // Create new usage_stats record
        const { data: insertUsageData, error: insertUsageError } = await supabase
          .from('usage_stats')
          .insert({
            user_id: sessionUser.id,
            playlists_created_count: 0,
            reset_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (insertUsageError) {
          console.error('Error creating usage_stats:', insertUsageError);
        } else {
          console.log('Usage stats record created successfully');
        }
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('1. All users now have premium subscriptions');
    console.log('2. Restart your Next.js server: npm run dev');
    console.log('3. Force refresh your browser: Ctrl+Shift+R or Cmd+Shift+R');
    
  } catch (error) {
    console.error('Error fixing subscriptions:', error);
  }
}

fixSubscription(); 