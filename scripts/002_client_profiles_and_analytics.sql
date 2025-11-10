-- Create client_profiles table
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  bio TEXT,
  preferences TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create profile_views table for tracking provider profile views
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_provider_id ON profile_views(provider_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);

-- Enable Row Level Security
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_profiles
-- Allow users to view their own client profile
CREATE POLICY "Users can view their own client profile"
  ON client_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create their own client profile
CREATE POLICY "Users can create their own client profile"
  ON client_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own client profile
CREATE POLICY "Users can update their own client profile"
  ON client_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own client profile
CREATE POLICY "Users can delete their own client profile"
  ON client_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for profile_views
-- Allow anyone to insert profile views (for tracking)
CREATE POLICY "Anyone can record profile views"
  ON profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow providers to view their own profile views
CREATE POLICY "Providers can view their profile views"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM provider_profiles WHERE user_id = auth.uid()
    )
  );
