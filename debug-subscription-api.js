// Script to debug the subscription API endpoint
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugSubscriptionApi() {
  try {
    console.log('=== SUBSCRIPTION API DEBUGGER ===');
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing required environment variables');
      return;
    }
    
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Initialize Supabase client with anon key (like the browser would use)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get all users first
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    // Select the user with hectorperezled02@gmail.com (the one we updated)
    const targetUser = users.find(user => user.email === 'hectorperezled02@gmail.com');
    
    if (!targetUser) {
      console.error('Target user not found');
      return;
    }
    
    console.log(`Testing subscription API for user: ${targetUser.email}`);
    
    // Now let's check what the subscription API would return for this user
    // We'll simulate what happens in getUserQuota
    
    console.log('\nStep 1: Get subscription details from database');
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', targetUser.id)
      .single();
    
    if (subscriptionError) {
      console.error('Error getting subscription:', subscriptionError);
      return;
    }
    
    console.log('Subscription from database:');
    console.log(subscription);
    
    console.log('\nStep 2: Get usage stats from database');
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from('usage_stats')
      .select('playlists_created_count, reset_date')
      .eq('user_id', targetUser.id)
      .single();
    
    if (usageError) {
      console.error('Error getting usage stats:', usageError);
      return;
    }
    
    console.log('Usage stats from database:');
    console.log(usageData);
    
    console.log('\nStep 3: Simulate getUserQuota calculation');
    const isPremium = subscription?.plan_type === 'premium' && subscription?.status === 'active';
    
    const quota = {
      isPremium,
      playlistsCreated: usageData?.playlists_created_count || 0,
      playlistLimit: isPremium ? Infinity : 5,
      resetDate: usageData?.reset_date,
      subscription: {
        plan: subscription?.plan_type || 'free',
        status: subscription?.status || 'inactive',
        currentPeriodEnd: subscription?.current_period_end,
      },
    };
    
    console.log('Generated quota object:');
    console.log(quota);
    
    console.log('\n=== ANALYSIS ===');
    console.log(`Premium status: ${isPremium ? 'YES ✓' : 'NO ✗'}`);
    
    if (!isPremium) {
      console.log('Reasons why isPremium is false:');
      if (subscription?.plan_type !== 'premium') {
        console.log(`- plan_type is "${subscription?.plan_type}" (should be "premium")`);
      }
      if (subscription?.status !== 'active') {
        console.log(`- status is "${subscription?.status}" (should be "active")`);
      }
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    if (isPremium) {
      console.log('1. The API should correctly return isPremium as true.');
      console.log('2. Try hard-refreshing your browser (Ctrl+F5 or Cmd+Shift+R)');
      console.log('3. Clear your browser cache or try in an incognito window');
      console.log('4. Restart your Next.js server: npm run dev');
    } else {
      console.log('1. Double-check that the subscription was updated properly:');
      console.log(`   - plan_type should be "premium" (current: "${subscription?.plan_type}")`);
      console.log(`   - status should be "active" (current: "${subscription?.status}")`);
      console.log('2. Run the update-subscription.js script again if needed');
    }
    
  } catch (error) {
    console.error('Error debugging subscription API:', error);
  }
}

debugSubscriptionApi(); 