# Supabase Database Setup Instructions

To set up the database for Diggr, you need to execute the following SQL scripts in the Supabase SQL Editor in the exact order listed below.

## Step 1: Access the SQL Editor

1. Go to https://app.supabase.com/project/llkaervhlvqygjhqbvec/sql/new
2. You'll see the SQL Editor where you can paste and execute SQL commands

## Step 2: Run Migration Scripts in Order

Execute each script in the order shown below. Copy the entire SQL content and paste it into the SQL Editor, then click "Run".

### 1. Create exec_sql Function (00000_create_exec_sql_function.sql)

```sql
-- Create a SQL function to execute dynamic SQL for migrations
-- This function should only be callable by the service role
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Revoke all permissions from public
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;

-- Grant execute to service_role only
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
```

### 2. Create Users Table (00001_create_users_table.sql)

```sql
-- Create the users table that extends the Supabase auth.users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  spotify_connected BOOLEAN DEFAULT FALSE,
  spotify_refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Create Playlists Table (00002_create_playlists_table.sql)

```sql
-- Create the playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  spotify_playlist_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Stores genres, moods, regions, eras, etc.
  track_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own playlists
CREATE POLICY "Users can read own playlists" ON public.playlists
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own playlists
CREATE POLICY "Users can insert own playlists" ON public.playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own playlists
CREATE POLICY "Users can update own playlists" ON public.playlists
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete own playlists" ON public.playlists
  FOR DELETE USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS playlists_user_id_idx ON public.playlists (user_id);
```

### 4. Create Subscriptions Table (00003_create_subscriptions_table.sql)

```sql
-- Create enum for plan types
CREATE TYPE public.plan_type AS ENUM ('free', 'premium');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due');

-- Create the subscriptions table
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

-- Set up Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own subscription
CREATE POLICY "Users can read own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for Stripe webhook processing)
CREATE POLICY "Service role can manage all subscriptions" ON public.subscriptions
  USING (auth.role() = 'service_role');

-- Create function to handle new user creation (create free subscription)
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user subscription
DROP TRIGGER IF EXISTS on_user_created_create_subscription ON public.users;
CREATE TRIGGER on_user_created_create_subscription
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
```

### 5. Create Usage Stats Table (00004_create_usage_stats_table.sql)

```sql
-- Create the usage_stats table
CREATE TABLE IF NOT EXISTS public.usage_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  playlists_created_count INTEGER DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', now()) + interval '1 month', -- First day of next month
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_user_usage UNIQUE (user_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own usage stats
CREATE POLICY "Users can read own usage stats" ON public.usage_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all usage stats
CREATE POLICY "Service role can manage all usage stats" ON public.usage_stats
  USING (auth.role() = 'service_role');

-- Create function to handle new user creation (initialize usage stats)
CREATE OR REPLACE FUNCTION public.handle_new_user_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usage_stats (user_id, playlists_created_count, reset_date)
  VALUES (NEW.id, 0, date_trunc('month', now()) + interval '1 month');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user usage stats
DROP TRIGGER IF EXISTS on_user_created_create_usage_stats ON public.users;
CREATE TRIGGER on_user_created_create_usage_stats
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_usage_stats();

-- Create function to reset usage stats monthly
CREATE OR REPLACE FUNCTION public.reset_monthly_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- If current date is past the reset date, reset the counter and update the reset date
  IF now() >= OLD.reset_date THEN
    NEW.playlists_created_count := 0;
    NEW.reset_date := date_trunc('month', now()) + interval '1 month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to reset usage stats on update
DROP TRIGGER IF EXISTS on_usage_stats_update ON public.usage_stats;
CREATE TRIGGER on_usage_stats_update
  BEFORE UPDATE ON public.usage_stats
  FOR EACH ROW EXECUTE FUNCTION public.reset_monthly_usage_stats();
```

## Step 3: Verify the Database Setup

After running all the scripts, you should verify that the tables and relationships have been created correctly:

1. Go to https://app.supabase.com/project/llkaervhlvqygjhqbvec/database/tables
2. You should see the following tables:
   - users
   - playlists
   - subscriptions
   - usage_stats

3. Check that the RLS policies are correctly applied for each table.

## Step 4: Run the Application

After setting up the database, you can run the application:

```bash
npm run dev
```

The authentication system should now work correctly with the database setup. 