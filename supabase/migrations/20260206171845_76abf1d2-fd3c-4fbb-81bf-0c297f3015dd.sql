-- Create outfit_plans table for calendar planning
CREATE TABLE public.outfit_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  is_worn BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, planned_date)
);

-- Enable RLS
ALTER TABLE public.outfit_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own plans" 
ON public.outfit_plans FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" 
ON public.outfit_plans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" 
ON public.outfit_plans FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" 
ON public.outfit_plans FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_outfit_plans_updated_at
BEFORE UPDATE ON public.outfit_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();