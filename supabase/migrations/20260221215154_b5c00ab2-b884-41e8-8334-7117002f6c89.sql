-- Add indexes to fix statement timeout on closet_items queries
CREATE INDEX IF NOT EXISTS idx_closet_items_user_id_created_at ON public.closet_items (user_id, created_at DESC);

-- Also add indexes on other frequently queried tables
CREATE INDEX IF NOT EXISTS idx_outfits_user_id_created_at ON public.outfits (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wear_history_user_id ON public.wear_history (user_id, worn_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_plans_user_id ON public.outfit_plans (user_id, planned_date);
