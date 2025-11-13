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
-- Note: amount is stored as points (20000 points = K20)
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 20000, -- Points earned (20000 points = K20)
  amount DECIMAL(10, 2) DEFAULT 20.00, -- Cash equivalent in Kwacha
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'withdrawn', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
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

-- Create withdrawal_requests table for tracking withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- Points being withdrawn
  amount DECIMAL(10, 2) NOT NULL, -- Cash amount (points / 1000)
  payment_method VARCHAR(50) NOT NULL, -- 'airtel_money', 'mtn_money', 'zamtel_money'
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  transaction_reference VARCHAR(255),
  admin_notes TEXT,
  rejection_reason TEXT
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
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Enable Row Level Security
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

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
  
  -- Create reward record (20000 points = K20)
  INSERT INTO referral_rewards (referrer_id, referral_id, points, amount, status)
  VALUES (v_referral_record.referrer_id, v_referral_record.id, 20000, 20.00, 'approved')
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

-- ============================================
-- REFERRAL ACCESS CONTROL
-- ============================================

-- Table to track provider referral access payments
CREATE TABLE IF NOT EXISTS provider_referral_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) DEFAULT 30.00,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'refunded'
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL means lifetime access
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE provider_referral_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own referral access"
  ON provider_referral_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all referral access"
  ON provider_referral_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can insert referral access"
  ON provider_referral_access FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to check if user has referral access
CREATE OR REPLACE FUNCTION check_referral_access(p_user_id UUID)
RETURNS TABLE(
  has_access BOOLEAN,
  access_type VARCHAR(50), -- 'subscription', 'payment', 'none'
  message TEXT
) AS $$
DECLARE
  v_user_role VARCHAR(50);
  v_has_subscription BOOLEAN;
  v_has_payment BOOLEAN;
BEGIN
  -- Get user role
  SELECT raw_user_meta_data->>'role' INTO v_user_role
  FROM auth.users
  WHERE id = p_user_id;

  -- Check if client with active subscription
  IF v_user_role = 'client' THEN
    SELECT EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = p_user_id
      AND active = true
      AND end_date > NOW()
    ) INTO v_has_subscription;

    IF v_has_subscription THEN
      RETURN QUERY SELECT TRUE, 'subscription'::VARCHAR(50), 'Access granted via active subscription'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE, 'none'::VARCHAR(50), 'You need an active subscription to access the referral program'::TEXT;
    END IF;

  -- Check if provider with payment
  ELSIF v_user_role = 'provider' THEN
    SELECT EXISTS (
      SELECT 1 FROM provider_referral_access
      WHERE user_id = p_user_id
      AND status = 'paid'
      AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO v_has_payment;

    IF v_has_payment THEN
      RETURN QUERY SELECT TRUE, 'payment'::VARCHAR(50), 'Access granted via referral program payment'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE, 'none'::VARCHAR(50), 'You need to pay K30 to access the referral program'::TEXT;
    END IF;

  ELSE
    RETURN QUERY SELECT FALSE, 'none'::VARCHAR(50), 'Invalid user role'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant provider referral access (called after payment)
CREATE OR REPLACE FUNCTION grant_provider_referral_access(
  p_user_id UUID,
  p_payment_method VARCHAR(50),
  p_payment_reference VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
  v_access_id UUID;
BEGIN
  -- Insert or update access record
  INSERT INTO provider_referral_access (
    user_id,
    amount,
    payment_method,
    payment_reference,
    status,
    paid_at
  ) VALUES (
    p_user_id,
    30.00,
    p_payment_method,
    p_payment_reference,
    'paid',
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    payment_method = EXCLUDED.payment_method,
    payment_reference = EXCLUDED.payment_reference,
    status = 'paid',
    paid_at = NOW()
  RETURNING id INTO v_access_id;

  -- Create referral code if it doesn't exist
  PERFORM create_referral_code_for_user(p_user_id);

  RETURN v_access_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WITHDRAWAL SYSTEM
-- ============================================

-- Function to calculate available balance for withdrawal
CREATE OR REPLACE FUNCTION get_withdrawal_balance(p_user_id UUID)
RETURNS TABLE(
  total_points INTEGER,
  total_amount DECIMAL(10, 2),
  withdrawn_points INTEGER,
  withdrawn_amount DECIMAL(10, 2),
  pending_points INTEGER,
  pending_amount DECIMAL(10, 2),
  available_points INTEGER,
  available_amount DECIMAL(10, 2)
) AS $$
DECLARE
  v_total_points INTEGER;
  v_withdrawn_points INTEGER;
  v_pending_points INTEGER;
BEGIN
  -- Get total approved points from rewards
  SELECT COALESCE(SUM(points), 0) INTO v_total_points
  FROM referral_rewards
  WHERE referrer_id = p_user_id
  AND status IN ('approved', 'withdrawn');

  -- Get already withdrawn points
  SELECT COALESCE(SUM(points), 0) INTO v_withdrawn_points
  FROM withdrawal_requests
  WHERE user_id = p_user_id
  AND status = 'completed';

  -- Get pending withdrawal points
  SELECT COALESCE(SUM(points), 0) INTO v_pending_points
  FROM withdrawal_requests
  WHERE user_id = p_user_id
  AND status IN ('pending', 'processing');

  RETURN QUERY SELECT
    v_total_points,
    (v_total_points / 1000.0)::DECIMAL(10, 2),
    v_withdrawn_points,
    (v_withdrawn_points / 1000.0)::DECIMAL(10, 2),
    v_pending_points,
    (v_pending_points / 1000.0)::DECIMAL(10, 2),
    (v_total_points - v_withdrawn_points - v_pending_points),
    ((v_total_points - v_withdrawn_points - v_pending_points) / 1000.0)::DECIMAL(10, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create withdrawal request
CREATE OR REPLACE FUNCTION create_withdrawal_request(
  p_user_id UUID,
  p_points INTEGER,
  p_payment_method VARCHAR(50),
  p_phone_number VARCHAR(20)
)
RETURNS UUID AS $$
DECLARE
  v_available_points INTEGER;
  v_amount DECIMAL(10, 2);
  v_request_id UUID;
BEGIN
  -- Check available balance
  SELECT available_points INTO v_available_points
  FROM get_withdrawal_balance(p_user_id);

  -- Validate sufficient balance
  IF p_points > v_available_points THEN
    RAISE EXCEPTION 'Insufficient balance. Available: % points, Requested: % points', 
      v_available_points, p_points;
  END IF;

  -- Minimum withdrawal: 10000 points (K10)
  IF p_points < 10000 THEN
    RAISE EXCEPTION 'Minimum withdrawal is 10000 points (K10)';
  END IF;

  -- Calculate amount (points / 1000)
  v_amount := (p_points / 1000.0)::DECIMAL(10, 2);

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (
    user_id,
    points,
    amount,
    payment_method,
    phone_number,
    status
  ) VALUES (
    p_user_id,
    p_points,
    v_amount,
    p_payment_method,
    p_phone_number,
    'pending'
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process withdrawal (admin only)
CREATE OR REPLACE FUNCTION process_withdrawal(
  p_request_id UUID,
  p_transaction_reference VARCHAR(255),
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE withdrawal_requests
  SET 
    status = 'completed',
    processed_at = NOW(),
    completed_at = NOW(),
    transaction_reference = p_transaction_reference,
    admin_notes = p_admin_notes
  WHERE id = p_request_id
  AND status IN ('pending', 'processing');

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject withdrawal (admin only)
CREATE OR REPLACE FUNCTION reject_withdrawal(
  p_request_id UUID,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE withdrawal_requests
  SET 
    status = 'rejected',
    processed_at = NOW(),
    rejection_reason = p_rejection_reason
  WHERE id = p_request_id
  AND status IN ('pending', 'processing');

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark withdrawal as processing (admin only)
CREATE OR REPLACE FUNCTION mark_withdrawal_processing(p_request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE withdrawal_requests
  SET 
    status = 'processing',
    processed_at = NOW()
  WHERE id = p_request_id
  AND status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
