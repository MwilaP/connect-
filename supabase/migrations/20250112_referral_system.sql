-- Create referral_codes table to store unique referral codes for each user
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create referrals table to track who referred whom
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'subscribed', 'rewarded'
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  subscribed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  UNIQUE(referred_user_id)
);

-- Create referral_rewards table to track rewards earned
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) DEFAULT 20000.00,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50), -- 'mobile_money', 'bank_transfer', etc.
  payment_reference VARCHAR(255),
  UNIQUE(referral_id)
);

-- Create referral_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS referral_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  pending_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  paid_earnings DECIMAL(10, 2) DEFAULT 0.00,
  pending_earnings DECIMAL(10, 2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_stats_user_id ON referral_stats(user_id);

-- Enable Row Level Security
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view referral codes for validation"
  ON referral_codes FOR SELECT
  USING (true);

-- RLS Policies for referrals
CREATE POLICY "Referrers can view their referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update referrals"
  ON referrals FOR UPDATE
  USING (true);

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view their own rewards"
  ON referral_rewards FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert rewards"
  ON referral_rewards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update rewards"
  ON referral_rewards FOR UPDATE
  USING (true);

-- RLS Policies for referral_stats
CREATE POLICY "Users can view their own stats"
  ON referral_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert stats"
  ON referral_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update stats"
  ON referral_stats FOR UPDATE
  USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for a user
CREATE OR REPLACE FUNCTION create_referral_code_for_user(p_user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_code VARCHAR(20);
BEGIN
  -- Check if user already has a referral code
  SELECT referral_code INTO v_code FROM referral_codes WHERE user_id = p_user_id;
  
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  -- Generate new code
  v_code := generate_referral_code();
  
  -- Insert new referral code
  INSERT INTO referral_codes (user_id, referral_code)
  VALUES (p_user_id, v_code);
  
  -- Initialize stats for user
  INSERT INTO referral_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track a referral
CREATE OR REPLACE FUNCTION track_referral(p_referred_user_id UUID, p_referral_code VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
BEGIN
  -- Get referrer ID from referral code
  SELECT user_id INTO v_referrer_id FROM referral_codes WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Don't allow self-referrals
  IF v_referrer_id = p_referred_user_id THEN
    RETURN false;
  END IF;
  
  -- Check if user was already referred
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_user_id = p_referred_user_id) THEN
    RETURN false;
  END IF;
  
  -- Insert referral record
  INSERT INTO referrals (referrer_id, referred_user_id, referral_code)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code)
  RETURNING id INTO v_referral_id;
  
  -- Update referrer stats
  UPDATE referral_stats
  SET total_referrals = total_referrals + 1,
      pending_referrals = pending_referrals + 1,
      updated_at = NOW()
  WHERE user_id = v_referrer_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral reward when referred user subscribes
CREATE OR REPLACE FUNCTION process_referral_subscription(p_referred_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referral_record RECORD;
  v_reward_id UUID;
BEGIN
  -- Get referral record
  SELECT * INTO v_referral_record FROM referrals 
  WHERE referred_user_id = p_referred_user_id 
  AND status = 'pending';
  
  IF v_referral_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update referral status
  UPDATE referrals
  SET status = 'subscribed',
      subscribed_at = NOW()
  WHERE id = v_referral_record.id;
  
  -- Create reward record
  INSERT INTO referral_rewards (referrer_id, referral_id, amount)
  VALUES (v_referral_record.referrer_id, v_referral_record.id, 20000.00)
  RETURNING id INTO v_reward_id;
  
  -- Update referrer stats
  UPDATE referral_stats
  SET successful_referrals = successful_referrals + 1,
      pending_referrals = pending_referrals - 1,
      total_earnings = total_earnings + 20000.00,
      pending_earnings = pending_earnings + 20000.00,
      updated_at = NOW()
  WHERE user_id = v_referral_record.referrer_id;
  
  -- Update referral status to rewarded
  UPDATE referrals
  SET status = 'rewarded',
      rewarded_at = NOW()
  WHERE id = v_referral_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark reward as paid
CREATE OR REPLACE FUNCTION mark_reward_as_paid(
  p_reward_id UUID,
  p_payment_method VARCHAR(50),
  p_payment_reference VARCHAR(255)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_reward_record RECORD;
BEGIN
  -- Get reward record
  SELECT * INTO v_reward_record FROM referral_rewards WHERE id = p_reward_id;
  
  IF v_reward_record IS NULL OR v_reward_record.status != 'pending' THEN
    RETURN false;
  END IF;
  
  -- Update reward status
  UPDATE referral_rewards
  SET status = 'paid',
      paid_at = NOW(),
      payment_method = p_payment_method,
      payment_reference = p_payment_reference
  WHERE id = p_reward_id;
  
  -- Update referrer stats
  UPDATE referral_stats
  SET paid_earnings = paid_earnings + v_reward_record.amount,
      pending_earnings = pending_earnings - v_reward_record.amount,
      updated_at = NOW()
  WHERE user_id = v_reward_record.referrer_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get referral stats for a user
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS TABLE (
  total_referrals INTEGER,
  successful_referrals INTEGER,
  pending_referrals INTEGER,
  total_earnings DECIMAL(10, 2),
  paid_earnings DECIMAL(10, 2),
  pending_earnings DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.total_referrals,
    rs.successful_referrals,
    rs.pending_referrals,
    rs.total_earnings,
    rs.paid_earnings,
    rs.pending_earnings
  FROM referral_stats rs
  WHERE rs.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user signup (call this from your application after signup)
CREATE OR REPLACE FUNCTION handle_new_user_signup(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create referral code for the new user
  PERFORM create_referral_code_for_user(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to process referral reward when subscription is created
CREATE OR REPLACE FUNCTION auto_process_referral_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if subscription is active
  IF NEW.active = true THEN
    PERFORM process_referral_subscription(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_process_referral_subscription
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_referral_subscription();
