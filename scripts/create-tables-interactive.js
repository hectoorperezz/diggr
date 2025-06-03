#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Function to execute SQL
async function executeSql(sql, description) {
  try {
    console.log(`Executing SQL: ${description}`);
    
    // Use the REST API to execute the SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SQL execution failed: ${error}`);
    }

    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Function to check if a table exists
async function tableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('count(*)', { count: 'exact', head: true });
    
    return !error;
  } catch (error) {
    return false;
  }
}

// The SQL scripts
const SQL_SCRIPTS = {
  createUsersTable: `
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      spotify_connected BOOLEAN DEFAULT FALSE,
      spotify_refresh_token TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can read own data" ON public.users
      FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can update own data" ON public.users
      FOR UPDATE USING (auth.uid() = id);
    
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
  `,
  
  createPlaylistsTable: `
    CREATE TABLE IF NOT EXISTS public.playlists (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
      spotify_playlist_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      criteria JSONB NOT NULL,
      track_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can read own playlists" ON public.playlists
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own playlists" ON public.playlists
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own playlists" ON public.playlists
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own playlists" ON public.playlists
      FOR DELETE USING (auth.uid() = user_id);
    
    CREATE INDEX IF NOT EXISTS playlists_user_id_idx ON public.playlists (user_id);
  `,
  
  createSubscriptionsTable: `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE public.plan_type AS ENUM ('free', 'premium');
      END IF;
    END$$;
    
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due');
      END IF;
    END$$;
    
    CREATE TABLE IF NOT EXISTS public.subscriptions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      plan_type plan_type DEFAULT 'free',
      status subscription_status DEFAULT 'active',
      current_period_start TIMESTAMP WITH TIME ZONE,
      current_period_end TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      CONSTRAINT unique_user_subscription UNIQUE (user_id)
    );
    
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can read own subscription" ON public.subscriptions
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Service role can manage all subscriptions" ON public.subscriptions
      USING (auth.role() = 'service_role');
    
    CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.subscriptions (user_id, plan_type, status)
      VALUES (NEW.id, 'free', 'active');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    DROP TRIGGER IF EXISTS on_user_created_create_subscription ON public.users;
    CREATE TRIGGER on_user_created_create_subscription
      AFTER INSERT ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
  `,
  
  createUsageStatsTable: `
    CREATE TABLE IF NOT EXISTS public.usage_stats (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
      playlists_created_count INTEGER DEFAULT 0,
      reset_date TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', now()) + interval '1 month',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      CONSTRAINT unique_user_usage UNIQUE (user_id)
    );
    
    ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can read own usage stats" ON public.usage_stats
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Service role can manage all usage stats" ON public.usage_stats
      USING (auth.role() = 'service_role');
    
    CREATE OR REPLACE FUNCTION public.handle_new_user_usage_stats()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.usage_stats (user_id, playlists_created_count, reset_date)
      VALUES (NEW.id, 0, date_trunc('month', now()) + interval '1 month');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    DROP TRIGGER IF EXISTS on_user_created_create_usage_stats ON public.users;
    CREATE TRIGGER on_user_created_create_usage_stats
      AFTER INSERT ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_usage_stats();
    
    CREATE OR REPLACE FUNCTION public.reset_monthly_usage_stats()
    RETURNS TRIGGER AS $$
    BEGIN
      IF now() >= OLD.reset_date THEN
        NEW.playlists_created_count := 0;
        NEW.reset_date := date_trunc('month', now()) + interval '1 month';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    DROP TRIGGER IF EXISTS on_usage_stats_update ON public.usage_stats;
    CREATE TRIGGER on_usage_stats_update
      BEFORE UPDATE ON public.usage_stats
      FOR EACH ROW EXECUTE FUNCTION public.reset_monthly_usage_stats();
  `,
};

async function checkAndCreateTables() {
  try {
    console.log('Checking if tables exist...');
    
    const usersExists = await tableExists('users');
    const playlistsExists = await tableExists('playlists');
    const subscriptionsExists = await tableExists('subscriptions');
    const usageStatsExists = await tableExists('usage_stats');
    
    console.log(`
Tables Status:
- Users: ${usersExists ? '✅ Exists' : '❌ Missing'}
- Playlists: ${playlistsExists ? '✅ Exists' : '❌ Missing'}
- Subscriptions: ${subscriptionsExists ? '✅ Exists' : '❌ Missing'}
- Usage Stats: ${usageStatsExists ? '✅ Exists' : '❌ Missing'}
    `);
    
    if (usersExists && playlistsExists && subscriptionsExists && usageStatsExists) {
      console.log('All tables already exist in your Supabase database.');
      rl.close();
      return;
    }

    rl.question('Would you like to create the missing tables? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\nCreating tables...');
        console.log('\nNOTE: Due to API limitations, you may need to run this script multiple times or create the tables manually in the Supabase SQL Editor:');
        console.log('https://app.supabase.com/project/llkaervhlvqygjhqbvec/sql/new\n');
        
        // Create tables in sequence
        if (!usersExists) {
          await executeSql(SQL_SCRIPTS.createUsersTable, 'Create Users Table');
        }
        
        if (!playlistsExists && usersExists) {
          await executeSql(SQL_SCRIPTS.createPlaylistsTable, 'Create Playlists Table');
        } else if (!usersExists && !playlistsExists) {
          console.log('⚠️ Users table must be created first before Playlists table');
        }
        
        if (!subscriptionsExists && usersExists) {
          await executeSql(SQL_SCRIPTS.createSubscriptionsTable, 'Create Subscriptions Table');
        } else if (!usersExists && !subscriptionsExists) {
          console.log('⚠️ Users table must be created first before Subscriptions table');
        }
        
        if (!usageStatsExists && usersExists) {
          await executeSql(SQL_SCRIPTS.createUsageStatsTable, 'Create Usage Stats Table');
        } else if (!usersExists && !usageStatsExists) {
          console.log('⚠️ Users table must be created first before Usage Stats table');
        }
        
        console.log('\nTable creation attempted. Please run the application with:');
        console.log('npm run dev');
        console.log('\nIf you encounter issues, please create the tables manually using the SQL Editor:');
        console.log('https://app.supabase.com/project/llkaervhlvqygjhqbvec/sql/new');
        console.log('The SQL scripts are in the supabase-setup-instructions.md file.');
      } else {
        console.log('\nPlease create the tables manually using the SQL Editor:');
        console.log('https://app.supabase.com/project/llkaervhlvqygjhqbvec/sql/new');
        console.log('The SQL scripts are in the supabase-setup-instructions.md file.');
      }
      
      rl.close();
    });
  } catch (error) {
    console.error('Error checking and creating tables:', error);
    rl.close();
  }
}

checkAndCreateTables(); 