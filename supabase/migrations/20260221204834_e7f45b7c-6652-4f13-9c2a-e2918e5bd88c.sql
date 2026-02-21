
-- Remove the overly broad "friend search" SELECT policy on profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users for friend search" ON public.profiles;
