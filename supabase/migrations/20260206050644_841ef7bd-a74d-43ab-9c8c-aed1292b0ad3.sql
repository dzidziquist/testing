-- Add UPDATE policy for wear_history table
CREATE POLICY "Users can update own history"
ON public.wear_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);