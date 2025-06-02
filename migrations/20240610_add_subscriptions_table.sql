-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Add subscription plan column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Ensure all users have a subscription record
INSERT INTO subscriptions (user_id, plan_type, status, created_at, updated_at)
SELECT id, 'free', 'inactive', now(), now()
FROM users
WHERE id NOT IN (SELECT user_id FROM subscriptions);

-- Create usage_stats table to track playlist creation limits
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  playlists_created_count INTEGER DEFAULT 0,
  reset_date TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);

-- Ensure all users have a usage_stats record
INSERT INTO usage_stats (user_id, playlists_created_count, reset_date, created_at, updated_at)
SELECT id, 0, (date_trunc('month', now()) + interval '1 month'), now(), now()
FROM users
WHERE id NOT IN (SELECT user_id FROM usage_stats);

-- Create function to reset usage stats monthly
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reset_date to next month
  NEW.reset_date := date_trunc('month', now()) + interval '1 month';
  -- Reset the counter
  NEW.playlists_created_count := 0;
  -- Update updated_at timestamp
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to reset usage stats when reset_date is reached
CREATE OR REPLACE TRIGGER trigger_reset_monthly_usage
BEFORE UPDATE ON usage_stats
FOR EACH ROW
WHEN (now() >= OLD.reset_date)
EXECUTE FUNCTION reset_monthly_usage();

-- Create function to increment playlist count on playlist creation
CREATE OR REPLACE FUNCTION increment_playlist_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the playlist count for the user
  UPDATE usage_stats
  SET playlists_created_count = playlists_created_count + 1,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment playlist count when a new playlist is created
CREATE OR REPLACE TRIGGER trigger_increment_playlist_count
AFTER INSERT ON playlists
FOR EACH ROW
EXECUTE FUNCTION increment_playlist_count(); 