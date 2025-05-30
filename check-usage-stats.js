require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkUsageStats() {
  console.log('Checking usage_stats table...');

  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or service key is missing. Check your .env file.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check usage_stats table
    const { data: usageStats, error: usageStatsError } = await supabase
      .from('usage_stats')
      .select('*');

    if (usageStatsError) {
      console.error('❌ Error accessing usage_stats table:', usageStatsError.message);
      return;
    }

    if (!usageStats || usageStats.length === 0) {
      console.log('❌ No usage stats found in the database.');
      return;
    }

    console.log(`✅ Found ${usageStats.length} entries in usage_stats table:`);
    usageStats.forEach(stat => {
      console.log(`   - User ID: ${stat.user_id}`);
      console.log(`     Playlists created: ${stat.playlists_created_count}`);
      console.log(`     Reset date: ${stat.reset_date}`);
      console.log(`     Created: ${stat.created_at}`);
      console.log(`     Updated: ${stat.updated_at}`);
      console.log('---');
    });

    // Also check playlists table for comparison
    const { data: playlists, error: playlistsError } = await supabase
      .from('playlists')
      .select('user_id, created_at')
      .order('created_at', { ascending: false });

    if (playlistsError) {
      console.error('❌ Error accessing playlists table:', playlistsError.message);
      return;
    }

    if (!playlists || playlists.length === 0) {
      console.log('❌ No playlists found in the database.');
      return;
    }

    // Group playlists by user
    const playlistsByUser = playlists.reduce((acc, playlist) => {
      acc[playlist.user_id] = (acc[playlist.user_id] || 0) + 1;
      return acc;
    }, {});

    console.log('\nPlaylists count by user:');
    Object.entries(playlistsByUser).forEach(([userId, count]) => {
      console.log(`   - User ${userId}: ${count} playlists`);
      
      // Compare with usage stats
      const userStats = usageStats.find(stat => stat.user_id === userId);
      if (userStats) {
        console.log(`     Usage stats count: ${userStats.playlists_created_count}`);
        if (userStats.playlists_created_count !== count) {
          console.log(`     ⚠️ MISMATCH: Usage stats show ${userStats.playlists_created_count} but user has ${count} playlists`);
        }
      } else {
        console.log(`     ⚠️ ERROR: No usage stats entry for this user`);
      }
    });

  } catch (error) {
    console.error('Error during execution:', error);
  }
}

checkUsageStats(); 