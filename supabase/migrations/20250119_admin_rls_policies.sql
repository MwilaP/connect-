-- Admin RLS Policies for Admin Panel Access
-- This migration adds admin-specific policies for all tables to allow admin users full access

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROVIDER PROFILES - Admin Access
-- ============================================

CREATE POLICY "Admins can view all provider profiles"
  ON provider_profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update any provider profile"
  ON provider_profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete any provider profile"
  ON provider_profiles FOR DELETE
  USING (is_admin());

-- ============================================
-- CLIENT PROFILES - Admin Access
-- ============================================

CREATE POLICY "Admins can view all client profiles"
  ON client_profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update any client profile"
  ON client_profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete any client profile"
  ON client_profiles FOR DELETE
  USING (is_admin());

-- ============================================
-- SUBSCRIPTIONS - Admin Access
-- ============================================

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update any subscription"
  ON subscriptions FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete any subscription"
  ON subscriptions FOR DELETE
  USING (is_admin());

-- ============================================
-- PAYMENTS - Admin Access
-- ============================================

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update any payment"
  ON payments FOR UPDATE
  USING (is_admin());

-- ============================================
-- CONTACT UNLOCKS - Admin Access
-- ============================================

CREATE POLICY "Admins can view all contact unlocks"
  ON contact_unlocks FOR SELECT
  USING (is_admin());

-- ============================================
-- PROFILE VIEWS - Admin Access
-- ============================================

CREATE POLICY "Admins can view all profile views"
  ON profile_views FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all profile views tracking"
  ON profile_views_tracking FOR SELECT
  USING (is_admin());

-- ============================================
-- REFERRAL SYSTEM - Admin Access
-- ============================================

CREATE POLICY "Admins can view all referral codes"
  ON referral_codes FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all referral rewards"
  ON referral_rewards FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view all referral stats"
  ON referral_stats FOR SELECT
  USING (is_admin());

-- ============================================
-- PROVIDER SERVICES - Admin Access
-- ============================================

CREATE POLICY "Admins can view all provider services"
  ON provider_services FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update any provider service"
  ON provider_services FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete any provider service"
  ON provider_services FOR DELETE
  USING (is_admin());

-- ============================================
-- PROVIDER REFERRAL ACCESS - Admin Access
-- ============================================

-- Policies already exist in referral_system.sql, but ensuring they're present
-- These are already created in the referral system migration

-- ============================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================

-- Grant execute permission on admin helper function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Grant execute permission on withdrawal functions to admins
GRANT EXECUTE ON FUNCTION process_withdrawal(UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_withdrawal(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_withdrawal_processing(UUID) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION is_admin() IS 'Helper function to check if the current user has admin role';
COMMENT ON POLICY "Admins can view all provider profiles" ON provider_profiles IS 'Allows admin users to view all provider profiles';
COMMENT ON POLICY "Admins can view all subscriptions" ON subscriptions IS 'Allows admin users to view all subscriptions';
COMMENT ON POLICY "Admins can view all payments" ON payments IS 'Allows admin users to view all payment records';
