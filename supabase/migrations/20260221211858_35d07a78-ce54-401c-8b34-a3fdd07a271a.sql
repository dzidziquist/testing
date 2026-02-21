-- Add indexes on user_id for all tables that use RLS with auth.uid() = user_id
CREATE INDEX IF NOT EXISTS idx_closet_items_user_id ON public.closet_items (user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON public.outfits (user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_plans_user_id ON public.outfit_plans (user_id);
CREATE INDEX IF NOT EXISTS idx_wear_history_user_id ON public.wear_history (user_id);
