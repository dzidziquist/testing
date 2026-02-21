-- Add score column to outfits table for storing AI-generated outfit scores
ALTER TABLE public.outfits ADD COLUMN score integer DEFAULT NULL;

-- Add a check constraint to ensure score is between 0 and 100
ALTER TABLE public.outfits ADD CONSTRAINT outfits_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100));