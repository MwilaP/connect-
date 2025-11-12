-- Add hierarchical location columns to provider_profiles
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS area TEXT;

-- Create indexes for the new location columns
CREATE INDEX IF NOT EXISTS idx_provider_profiles_country ON provider_profiles(country);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_city ON provider_profiles(city);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_area ON provider_profiles(area);

-- Migrate existing location data to country field (temporary)
-- This assumes existing locations are general enough to be treated as country-level
UPDATE provider_profiles
SET country = location
WHERE country IS NULL AND location IS NOT NULL;

-- Make the new columns required for future inserts (but allow existing nulls)
-- Note: We keep the old location column for backward compatibility during transition
