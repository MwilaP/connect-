-- Migration: Enable recurring referral rewards for each subscription payment
-- Date: 2025-02-04
-- Description: Referrers earn K20 every time their referred user subscribes (not just first time)

-- ============================================
-- DROP OLD TRIGGER (only fires on INSERT)
-- ============================================

DROP TRIGGER IF EXISTS trigger_auto_process_referral_subscription ON subscriptions;

-- ============================================
-- UPDATE REFERRAL_REWARDS TABLE
-- ============================================

-- Add subscription_id to track which subscription payment this reward is for
ALTER TABLE referral_rewards 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_referral_rewards_subscription_id ON referral_rewards(subscription_id);

-- Add comment
COMMENT ON COLUMN referral_rewards.subscription_id IS 'Links reward to specific subscription payment (for recurring rewards)';

-- ============================================
-- UPDATE PROCESS_REFERRAL_SUBSCRIPTION FUNCTION
-- ============================================

-- Modified function to create reward for EACH subscription (not just first)
CREATE OR REPLACE FUNCTION process_referral_subscription(p_referred_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referral_record RECORD;
  v_reward_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Get the referral record for this user
  SELECT * INTO v_referral_record
  FROM referrals
  WHERE referred_user_id = p_referred_user_id
  LIMIT 1;
  
  IF v_referral_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the latest subscription for this user
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE user_id = p_referred_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if we already rewarded for this specific subscription
  IF EXISTS (
    SELECT 1 FROM referral_rewards
    WHERE referral_id = v_referral_record.id
    AND subscription_id = v_subscription_id
  ) THEN
    -- Already rewarded for this subscription, skip
    RETURN false;
  END IF;
  
  -- Update referral status to subscribed (if first time)
  IF v_referral_record.status = 'pending' THEN
    UPDATE referrals
    SET status = 'subscribed',
        subscribed_at = NOW()
    WHERE id = v_referral_record.id;
  END IF;
  
  -- Create reward record (20000 points = K20) for THIS subscription
  INSERT INTO referral_rewards (
    referrer_id, 
    referral_id, 
    subscription_id,
    points, 
    amount, 
    status,
    approved_at
  )
  VALUES (
    v_referral_record.referrer_id, 
    v_referral_record.id, 
    v_subscription_id,
    20000, 
    20.00, 
    'approved',
    NOW()
  )
  RETURNING id INTO v_reward_id;
  
  -- Update referrer stats
  UPDATE referral_stats
  SET successful_referrals = CASE 
        WHEN v_referral_record.status = 'pending' THEN successful_referrals + 1 
        ELSE successful_referrals 
      END,
      pending_referrals = CASE 
        WHEN v_referral_record.status = 'pending' THEN pending_referrals - 1 
        ELSE pending_referrals 
      END,
      total_earnings = total_earnings + 20000,
      pending_earnings = pending_earnings + 20000,
      updated_at = NOW()
  WHERE user_id = v_referral_record.referrer_id;
  
  -- Update referral status to rewarded (if first time)
  IF v_referral_record.status = 'subscribed' THEN
    UPDATE referrals
    SET status = 'rewarded',
        rewarded_at = NOW()
    WHERE id = v_referral_record.id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE NEW TRIGGER FOR RECURRING REWARDS
-- ============================================

-- New trigger function that fires on both INSERT and UPDATE
CREATE OR REPLACE FUNCTION auto_process_referral_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Process on INSERT (new subscription) or UPDATE (renewal/reactivation)
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR 
     (TG_OP = 'UPDATE' AND NEW.active = true AND OLD.active = false) THEN
    PERFORM process_referral_subscription(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER trigger_auto_process_referral_subscription
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_referral_subscription();

-- ============================================
-- HELPER FUNCTION: Get Recurring Rewards Count
-- ============================================

-- Function to get how many times a referrer has been rewarded for a specific referral
CREATE OR REPLACE FUNCTION get_referral_reward_count(
  p_referrer_id UUID,
  p_referred_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM referral_rewards rr
  JOIN referrals r ON r.id = rr.referral_id
  WHERE rr.referrer_id = p_referrer_id
  AND r.referred_user_id = p_referred_user_id
  AND rr.status IN ('approved', 'withdrawn');
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION process_referral_subscription(UUID) IS 'Creates a reward for EACH subscription payment (recurring rewards)';
COMMENT ON FUNCTION get_referral_reward_count(UUID, UUID) IS 'Returns how many times a referrer has been rewarded for a specific referral';
COMMENT ON TRIGGER trigger_auto_process_referral_subscription ON subscriptions IS 'Triggers reward creation on new subscriptions and renewals';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- This migration enables:
-- 1. Recurring rewards: Referrer earns K20 EVERY time their referral subscribes
-- 2. Tracks which subscription each reward is for (prevents duplicates)
-- 3. Works for both new subscriptions and renewals
-- 4. Updates stats correctly for recurring rewards
