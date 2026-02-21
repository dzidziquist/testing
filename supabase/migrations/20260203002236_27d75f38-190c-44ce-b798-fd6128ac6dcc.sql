-- Fix slow outfit deletion by adding ON DELETE SET NULL to the outfit_id FK
-- This ensures wear_history records are preserved but delinked when outfit is deleted

ALTER TABLE wear_history 
DROP CONSTRAINT IF EXISTS wear_history_outfit_id_fkey;

ALTER TABLE wear_history 
ADD CONSTRAINT wear_history_outfit_id_fkey 
FOREIGN KEY (outfit_id) 
REFERENCES outfits(id) 
ON DELETE SET NULL;