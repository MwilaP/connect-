-- Add points column to referral_rewards table
-- This migration updates the existing table to support the points system

-- Add points column if it doesn't exist
ALTER TABLE referral_rewards 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 20000;

-- Update existing records to have points based on amount
-- Assuming old records had amount = 20000.00, set points = 20000
UPDATE referral_rewards 
SET points = 20000 
WHERE points IS NULL;

-- Update amount column to reflect new K20 value instead of 20000
UPDATE referral_rewards 
SET amount = 20.00 
WHERE amount > 100;

-- Add new timestamp columns
ALTER TABLE referral_rewards 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE referral_rewards 
ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

-- Update status values for existing records
-- Old 'paid' status becomes 'approved'
UPDATE referral_rewards 
SET status = 'approved' 
WHERE status = 'paid';

-- Drop old columns that are no longer used
ALTER TABLE referral_rewards 
DROP COLUMN IF EXISTS paid_at,
DROP COLUMN IF EXISTS payment_method,
DROP COLUMN IF EXISTS payment_reference;

-- Add comment to table
COMMENT ON TABLE referral_rewards IS 'Stores referral rewards with points system (20000 points = K20)';
COMMENT ON COLUMN referral_rewards.points IS 'Points earned (20000 points = K20)';
COMMENT ON COLUMN referral_rewards.amount IS 'Cash equivalent in Kwacha';
