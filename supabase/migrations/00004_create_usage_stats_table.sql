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