-- Fix RLS policies for withdrawal_requests to avoid auth.users permission issues

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can create withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;

-- Recreate policies with proper permissions

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own withdrawal requests
CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all withdrawal requests (using auth.jwt() instead of querying users table)
CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Admins can update withdrawal requests
CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Add comment
COMMENT ON TABLE withdrawal_requests IS 'Withdrawal requests with fixed RLS policies that do not query auth.users';
