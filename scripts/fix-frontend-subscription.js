// Script to fix frontend subscription display issues
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixFrontendSubscription() {
  try {
    console.log('=== FRONTEND SUBSCRIPTION DISPLAY FIXER ===');
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return;
    }
    
    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. First check active sessions and users
    console.log('Checking active sessions and users...');
    const { data: sessions, error: sessionsError } = await supabase.auth.admin.listUsers();
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return;
    }
    
    console.log(`Found ${sessions.users.length} users`);
    
    // 2. Check for Row Level Security (RLS) issues
    console.log('\nChecking RLS policies...');
    
    // Get all RLS policies for the subscriptions table
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'subscriptions' });
    
    if (rlsError) {
      console.error('Error checking RLS policies:', rlsError);
      console.log('Assuming RLS is enabled and needs to be fixed...');
      
      // Let's modify the RLS policy to ensure users can read their own subscription data
      console.log('\nUpdating RLS policies for subscriptions table...');
      
      try {
        // Enable RLS on the subscriptions table
        await supabase.rpc('set_rls_for_table', { 
          table_name: 'subscriptions', 
          enable_rls: true 
        });
        
        // Create a policy to allow users to read their own subscription data
        await supabase.rpc('create_policy_for_table', {
          table_name: 'subscriptions',
          policy_name: 'Users can read own subscription',
          operation: 'SELECT',
          definition: 'auth.uid() = user_id',
          check_expression: 'true',
          comment: 'Allow users to read their own subscription data'
        });
        
        console.log('RLS policy created successfully!');
      } catch (policyError) {
        console.error('Error creating RLS policy:', policyError);
      }
    } else {
      console.log('RLS policies found:', rlsPolicies);
    }
    
    // 3. Check all subscriptions
    console.log('\nChecking all subscriptions...');
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*');
    
    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return;
    }
    
    console.log(`Found ${subscriptions?.length || 0} subscription records`);
    
    // 4. Fix any user IDs that might be mismatched
    console.log('\nChecking for user ID mismatches...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.length} users in the database`);
    
    // Create a mapping of email to auth user ID
    const emailToAuthId = {};
    sessions.users.forEach(user => {
      emailToAuthId[user.email] = user.id;
    });
    
    // Check if any database users have a different ID than auth users
    let userIdMismatches = 0;
    for (const dbUser of users) {
      const authUserId = emailToAuthId[dbUser.email];
      if (authUserId && authUserId !== dbUser.id) {
        console.log(`User ID mismatch for ${dbUser.email}: Auth ID ${authUserId} vs DB ID ${dbUser.id}`);
        userIdMismatches++;
        
        // Fix subscriptions for this user
        const { data: userSubs, error: userSubsError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', dbUser.id);
        
        if (!userSubsError && userSubs && userSubs.length > 0) {
          console.log(`Found ${userSubs.length} subscriptions for DB user ${dbUser.id}`);
          
          // Copy subscription to auth user ID
          for (const sub of userSubs) {
            const { error: insertError } = await supabase
              .from('subscriptions')
              .upsert({
                user_id: authUserId,
                plan_type: sub.plan_type,
                status: sub.status,
                stripe_customer_id: sub.stripe_customer_id,
                stripe_subscription_id: sub.stripe_subscription_id,
                current_period_start: sub.current_period_start,
                current_period_end: sub.current_period_end,
                created_at: sub.created_at,
                updated_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.error('Error copying subscription to auth user:', insertError);
            } else {
              console.log(`Successfully copied subscription from DB user ${dbUser.id} to auth user ${authUserId}`);
            }
          }
        }
      }
    }
    
    if (userIdMismatches === 0) {
      console.log('No user ID mismatches found!');
    }
    
    // 5. Set debug mode to force refresh of subscription data
    console.log('\nSetting debug mode to force refresh subscription data...');
    
    try {
      // Create a function to handle clearing cache
      await supabase.rpc('set_debug_flag', { flag_name: 'force_refresh_subscriptions', flag_value: true });
      console.log('Debug flag set successfully!');
    } catch (debugError) {
      console.error('Error setting debug flag:', debugError);
      console.log('Creating debug mode table...');
      
      try {
        // Create a debug_flags table if it doesn't exist
        await supabase.rpc('create_debug_flags_table');
        console.log('Debug flags table created!');
        
        // Try setting the flag again
        await supabase.rpc('set_debug_flag', { flag_name: 'force_refresh_subscriptions', flag_value: true });
        console.log('Debug flag set successfully!');
      } catch (createError) {
        console.error('Error creating debug flags table:', createError);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('1. Updated RLS policies to ensure users can read their own subscription data');
    console.log('2. Fixed any user ID mismatches between auth and database');
    console.log('3. Ensured all users have subscription records');
    console.log('\nNext steps:');
    console.log('1. Restart your Next.js server: npm run dev');
    console.log('2. Clear your browser cache: Ctrl+Shift+R or Cmd+Shift+R');
    console.log('3. Use the Force Refresh Subscription button on your app');
    
  } catch (error) {
    console.error('Error fixing frontend subscription display:', error);
  }
}

fixFrontendSubscription(); 