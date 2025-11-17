-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT false,
  plan VARCHAR(50) DEFAULT 'monthly',
  amount DECIMAL(10, 2) DEFAULT 100.00,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create contact_unlocks table
CREATE TABLE IF NOT EXISTS contact_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) DEFAULT 30.00,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, provider_id)
);

-- Create profile_views_tracking table
CREATE TABLE IF NOT EXISTS profile_views_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  view_date DATE DEFAULT CURRENT_DATE
);

-- Create payments table for tracking all transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_type VARCHAR(50) NOT NULL, -- 'subscription' or 'contact_unlock'
  payment_method VARCHAR(50), -- 'mobile_money' or 'card'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE SET NULL,
  transaction_reference VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_client_id ON contact_unlocks(client_id);
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_provider_id ON contact_unlocks(provider_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_tracking_client_date ON profile_views_tracking(client_id, view_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for contact_unlocks
CREATE POLICY "Users can view their own contact unlocks"
  ON contact_unlocks FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Users can insert their own contact unlocks"
  ON contact_unlocks FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- RLS Policies for profile_views_tracking
CREATE POLICY "Users can view their own profile views"
  ON profile_views_tracking FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Users can insert their own profile views"
  ON profile_views_tracking FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- RLS Policies for payments 
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get daily profile views count
CREATE OR REPLACE FUNCTION get_daily_profile_views_count(p_client_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT provider_id)
    FROM profile_views_tracking
    WHERE client_id = p_client_id
    AND view_date = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = p_user_id
    AND active = true
    AND end_date > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if contact is unlocked
CREATE OR REPLACE FUNCTION is_contact_unlocked(p_client_id UUID, p_provider_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM contact_unlocks
    WHERE client_id = p_client_id
    AND provider_id = p_provider_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
