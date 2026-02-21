
-- Drop outfit_feedback first (has FK to shared_outfits)
DROP TABLE IF EXISTS public.outfit_feedback;

-- Drop shared_outfits (has FK to outfits)
DROP TABLE IF EXISTS public.shared_outfits;

-- Drop friendships
DROP TABLE IF EXISTS public.friendships;
