-- Add unique constraint to profile_views_tracking table
-- This ensures a user can only have one view record per provider per day
-- Prevents duplicate tracking of the same provider on the same day

-- First, remove any duplicate entries that might exist
DELETE FROM profile_views_tracking a
USING profile_views_tracking b
WHERE a.id > b.id
  AND a.client_id = b.client_id
  AND a.provider_id = b.provider_id
  AND a.view_date = b.view_date;

-- Add the unique constraint
ALTER TABLE profile_views_tracking
ADD CONSTRAINT profile_views_tracking_unique_view
UNIQUE (client_id, provider_id, view_date);
