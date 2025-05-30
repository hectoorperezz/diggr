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