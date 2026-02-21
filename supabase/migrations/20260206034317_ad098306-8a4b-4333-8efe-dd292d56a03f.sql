-- Create table for saved discover items
CREATE TABLE public.saved_discover_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('trend', 'outfit', 'shop')),
  is_liked BOOLEAN DEFAULT false,
  is_saved BOOLEAN DEFAULT false,
  item_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.saved_discover_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own saved items"
ON public.saved_discover_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved items"
ON public.saved_discover_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved items"
ON public.saved_discover_items
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved items"
ON public.saved_discover_items
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_discover_items_updated_at
BEFORE UPDATE ON public.saved_discover_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();