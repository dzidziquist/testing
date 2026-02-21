-- Remove the unique constraint that prevents multiple outfits per day
ALTER TABLE public.outfit_plans 
DROP CONSTRAINT IF EXISTS outfit_plans_user_id_planned_date_key;