-- Update existing rewards to approved status so they can be withdrawn
-- This migration ensures all existing rewards are available for withdrawal

-- Update all pending rewards to approved
UPDATE referral_rewards 
SET 
  status = 'approved',
  approved_at = COALESCE(approved_at, created_at)
WHERE status = 'pending';

-- Update the process_referral_subscription function to auto-approve rewards
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
  
  -- Create reward record (20000 points = K20) - AUTO APPROVED
  INSERT INTO referral_rewards (referrer_id, referral_id, points, amount, status, approved_at)
  VALUES (v_referral_record.referrer_id, v_referral_record.id, 20000, 20.00, 'approved', NOW())
  RETURNING id INTO v_reward_id;
  
  -- Update referrer stats
  UPDATE referral_stats
  SET successful_referrals = successful_referrals + 1,
      pending_referrals = pending_referrals - 1,
      total_earnings = total_earnings + 20000,
      pending_earnings = pending_earnings + 20000,
      updated_at = NOW()
  WHERE user_id = v_referral_record.referrer_id;
  
  -- Mark referral as rewarded
  UPDATE referrals
  SET status = 'rewarded',
      rewarded_at = NOW()
  WHERE id = v_referral_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION process_referral_subscription IS 'Processes referral subscription and auto-approves rewards for immediate withdrawal';
