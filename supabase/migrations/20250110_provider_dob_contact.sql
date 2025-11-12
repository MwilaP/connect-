-- Add date_of_birth and contact_number fields to provider_profiles
ALTER TABLE provider_profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);

-- Make age optional since we'll compute it from date_of_birth
ALTER TABLE provider_profiles ALTER COLUMN age DROP NOT NULL;

-- Add check constraint to ensure date_of_birth is at least 18 years ago
ALTER TABLE provider_profiles 
ADD CONSTRAINT check_provider_age 
CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '18 years');

-- Create index for date_of_birth for better query performance
CREATE INDEX IF NOT EXISTS idx_provider_profiles_date_of_birth ON provider_profiles(date_of_birth);

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a view that includes computed age
CREATE OR REPLACE VIEW provider_profiles_with_age AS
SELECT 
  *,
  CASE 
    WHEN date_of_birth IS NOT NULL THEN calculate_age(date_of_birth)
    ELSE age
  END AS computed_age
FROM provider_profiles;

-- Grant access to the view
GRANT SELECT ON provider_profiles_with_age TO authenticated;
