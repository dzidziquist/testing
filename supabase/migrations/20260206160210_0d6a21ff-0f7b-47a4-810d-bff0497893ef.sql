-- Secure the closet-images storage bucket by making it private
-- and updating RLS policies to require authentication

-- Make the bucket private (no public access)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'closet-images';

-- Drop existing overly permissive SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view closet images" ON storage.objects;

-- Create secure RLS policies that restrict access to owners only

-- Users can only view their own images (folder-based ownership)
CREATE POLICY "Users can view own closet images" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'closet-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload to their own folder only
DROP POLICY IF EXISTS "Users can upload closet images" ON storage.objects;
CREATE POLICY "Users can upload closet images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'closet-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own images only
DROP POLICY IF EXISTS "Users can update own closet images" ON storage.objects;
CREATE POLICY "Users can update own closet images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'closet-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own images only
DROP POLICY IF EXISTS "Users can delete own closet images" ON storage.objects;
CREATE POLICY "Users can delete own closet images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'closet-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Harden handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  full_name_val TEXT;
BEGIN
  -- Extract and sanitize full_name from metadata
  full_name_val := TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Enforce length limit to prevent abuse
  IF LENGTH(full_name_val) > 100 THEN
    full_name_val := LEFT(full_name_val, 100);
  END IF;
  
  -- Handle empty names
  IF full_name_val = '' THEN
    full_name_val := NULL;
  END IF;
  
  -- Insert profile with validated data
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, full_name_val);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;