-- =============================================
-- SUPABASE STORAGE BUCKET POLICIES
-- =============================================
-- Run this in your Supabase SQL Editor to fix storage upload issues.
-- This creates the 'media' bucket if it doesn't exist and sets up policies.

-- Step 1: Create the 'media' bucket if it doesn't exist
-- Note: You may need to create the bucket manually in the Supabase Dashboard
-- under Storage > New Bucket, named "media", and set it to PUBLIC.

-- Step 2: Storage Policies
-- These go under Storage > Policies in the Supabase Dashboard,
-- OR you can run them here if using the storage schema.

-- Allow public read access to all files in the media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Allow anyone to view/download files (SELECT)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Policy: Allow authenticated admin to upload files (INSERT)
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' 
  AND (SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid
);

-- Policy: Allow authenticated admin to update files (UPDATE)
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' 
  AND (SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid
);

-- Policy: Allow authenticated admin to delete files (DELETE)
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' 
  AND (SELECT auth.uid()) = 'df74d913-f481-48d9-b23d-d9469fb346e2'::uuid
);
