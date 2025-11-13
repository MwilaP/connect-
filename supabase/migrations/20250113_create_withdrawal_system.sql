-- Create withdrawal system tables and functions

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
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Enable Row Level Security
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

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

-- Add comments
COMMENT ON TABLE withdrawal_requests IS 'Tracks user withdrawal requests for converting points to cash';
COMMENT ON COLUMN withdrawal_requests.points IS 'Points being withdrawn';
COMMENT ON COLUMN withdrawal_requests.amount IS 'Cash amount in Kwacha (points / 1000)';
