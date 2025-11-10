-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create provider_profiles table
CREATE TABLE IF NOT EXISTS provider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18),
  location TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL CHECK (hourly_rate > 0),
  bio TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id ON provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_location ON provider_profiles(location);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_hourly_rate ON provider_profiles(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_age ON provider_profiles(age);

-- Enable Row Level Security
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_profiles
-- Allow anyone to read provider profiles (for browsing)
CREATE POLICY "Anyone can view provider profiles"
  ON provider_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own provider profile
CREATE POLICY "Users can create their own provider profile"
  ON provider_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own provider profile
CREATE POLICY "Users can update their own provider profile"
  ON provider_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own provider profile
CREATE POLICY "Users can delete their own provider profile"
  ON provider_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for provider images
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-images', 'provider-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for provider images
CREATE POLICY "Anyone can view provider images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'provider-images');

CREATE POLICY "Users can upload their own provider images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'provider-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own provider images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'provider-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own provider images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'provider-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
