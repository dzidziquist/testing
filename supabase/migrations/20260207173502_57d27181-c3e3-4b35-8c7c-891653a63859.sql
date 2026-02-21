-- Add accent_color and location columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT 'black',
ADD COLUMN IF NOT EXISTS location text;