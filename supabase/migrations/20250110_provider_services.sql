-- Create provider_services table
CREATE TABLE IF NOT EXISTS provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_provider_services_provider_id ON provider_services(provider_id);

-- Enable Row Level Security
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_services
-- Allow anyone to read services (for browsing)
CREATE POLICY "Anyone can view provider services"
  ON provider_services
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow providers to insert their own services
CREATE POLICY "Providers can create their own services"
  ON provider_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Allow providers to update their own services
CREATE POLICY "Providers can update their own services"
  ON provider_services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Allow providers to delete their own services
CREATE POLICY "Providers can delete their own services"
  ON provider_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles
      WHERE provider_profiles.id = provider_id
      AND provider_profiles.user_id = auth.uid()
    )
  );

-- Make hourly_rate optional in provider_profiles (for backward compatibility)
ALTER TABLE provider_profiles ALTER COLUMN hourly_rate DROP NOT NULL;

-- Drop the hourly_rate index as it's no longer the primary pricing method
DROP INDEX IF EXISTS idx_provider_profiles_hourly_rate;
