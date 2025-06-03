#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkTables() {
  try {
    // Check if users table exists
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });
    
    if (usersError) {
      console.error('❌ Users table does not exist or is not accessible:', usersError.message);
    } else {
      console.log('✅ Users table exists');
    }

    // Check if playlists table exists
    const { data: playlistsData, error: playlistsError } = await supabase
      .from('playlists')
      .select('count(*)', { count: 'exact', head: true });
    
    if (playlistsError) {
      console.error('❌ Playlists table does not exist or is not accessible:', playlistsError.message);
    } else {
      console.log('✅ Playlists table exists');
    }

    // Check if subscriptions table exists
    const { data: subscriptionsData, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('count(*)', { count: 'exact', head: true });
    
    if (subscriptionsError) {
      console.error('❌ Subscriptions table does not exist or is not accessible:', subscriptionsError.message);
    } else {
      console.log('✅ Subscriptions table exists');
    }

    // Check if usage_stats table exists
    const { data: usageStatsData, error: usageStatsError } = await supabase
      .from('usage_stats')
      .select('count(*)', { count: 'exact', head: true });
    
    if (usageStatsError) {
      console.error('❌ Usage Stats table does not exist or is not accessible:', usageStatsError.message);
    } else {
      console.log('✅ Usage Stats table exists');
    }

    console.log('\n');
    if (usersError || playlistsError || subscriptionsError || usageStatsError) {
      console.log('IMPORTANT: Some tables are missing in your Supabase database!');
      console.log('Please follow these instructions to create the tables:');
      console.log('1. Go to https://app.supabase.com/project/llkaervhlvqygjhqbvec/sql/new');
      console.log('2. Copy and paste each SQL script from the supabase-setup-instructions.md file');
      console.log('3. Execute them in the order listed in the document');
    } else {
      console.log('All tables exist in your Supabase database!');
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables(); 