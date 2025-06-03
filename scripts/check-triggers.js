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

async function checkTriggersAndUsers() {
  try {
    console.log('Checking auth users and public users...');
    
    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase.rpc('get_auth_users');
    
    if (authError) {
      console.error('❌ Error getting auth users:', authError.message);
      console.log('\nCreating the get_auth_users function...');
      
      // Create function to get auth users
      const { error: createFnError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION get_auth_users()
          RETURNS TABLE (id uuid, email text, created_at timestamptz)
          LANGUAGE sql
          SECURITY DEFINER
          AS $$
            SELECT id, email, created_at FROM auth.users;
          $$;
        `
      });
      
      if (createFnError) {
        console.error('❌ Could not create get_auth_users function:', createFnError.message);
        console.log('\nPlease run this SQL in the Supabase SQL Editor:');
        console.log(`
CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (id uuid, email text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, email, created_at FROM auth.users;
$$;
        `);
      } else {
        console.log('✅ Created get_auth_users function. Please run this script again.');
        return;
      }
    } else {
      console.log(`✅ Found ${authUsers.length} users in auth.users table:`);
      authUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }
    
    // Check public.users table
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, created_at');
    
    if (publicError) {
      console.error('❌ Error getting public users:', publicError.message);
    } else {
      console.log(`\n✅ Found ${publicUsers.length} users in public.users table:`);
      publicUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }
    
    // Check if there are users in auth that are not in public
    if (authUsers && publicUsers) {
      const authIds = authUsers.map(user => user.id);
      const publicIds = publicUsers.map(user => user.id);
      
      const missingUsers = authUsers.filter(user => !publicIds.includes(user.id));
      
      if (missingUsers.length > 0) {
        console.log('\n⚠️ Found users in auth.users that are missing in public.users:');
        missingUsers.forEach(user => {
          console.log(`   - ${user.email} (${user.id})`);
        });
        
        console.log('\nWould you like to fix this by adding these users to the public.users table? (y/n)');
        process.stdin.once('data', async (data) => {
          const answer = data.toString().trim().toLowerCase();
          
          if (answer === 'y' || answer === 'yes') {
            console.log('\nAdding missing users to public.users table...');
            
            for (const user of missingUsers) {
              const { error } = await supabase
                .from('users')
                .insert({
                  id: user.id,
                  email: user.email,
                });
              
              if (error) {
                console.error(`❌ Error adding user ${user.email}:`, error.message);
              } else {
                console.log(`✅ Added user ${user.email} to public.users table`);
              }
            }
            
            console.log('\nCheck the trigger to prevent this from happening in the future:');
            console.log('Run this SQL in the Supabase SQL Editor:');
            console.log(`
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- If the trigger doesn't exist or is disabled, recreate it:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            `);
          }
          
          process.exit(0);
        });
      } else {
        console.log('\n✅ All auth users exist in the public.users table. Triggers are working correctly!');
        process.exit(0);
      }
    }
  } catch (error) {
    console.error('Error checking triggers and users:', error);
    process.exit(1);
  }
}

checkTriggersAndUsers(); 