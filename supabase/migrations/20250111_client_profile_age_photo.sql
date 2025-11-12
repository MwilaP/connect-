-- Add age and photo_url columns to client_profiles table
ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 18),
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for client photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client photos
CREATE POLICY "Anyone can view client photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'client-photos');

CREATE POLICY "Users can upload their own client photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own client photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'client-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own client photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
