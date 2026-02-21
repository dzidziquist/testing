-- Create enums for closet items and outfits
CREATE TYPE item_status AS ENUM ('active', 'wishlist', 'archived');
CREATE TYPE archive_reason AS ENUM ('disposed', 'doesnt_fit', 'out_of_style', 'seasonal', 'replaced');
CREATE TYPE item_category AS ENUM ('tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags', 'jewelry', 'activewear', 'swimwear', 'sleepwear', 'other');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  body_type TEXT,
  skin_tone TEXT,
  height_cm INTEGER,
  preferred_colors TEXT[],
  preferred_styles TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Closet items table
CREATE TABLE public.closet_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  category item_category NOT NULL DEFAULT 'other',
  brand TEXT,
  color TEXT,
  pattern TEXT,
  season TEXT[],
  image_url TEXT,
  status item_status NOT NULL DEFAULT 'active',
  archive_reason archive_reason,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  product_url TEXT,
  wear_count INTEGER DEFAULT 0,
  last_worn_at TIMESTAMP WITH TIME ZONE,
  ai_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Outfits table
CREATE TABLE public.outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT,
  item_ids UUID[] NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  occasion TEXT,
  season TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wear history table
CREATE TABLE public.wear_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  outfit_id UUID REFERENCES public.outfits,
  item_ids UUID[] NOT NULL,
  worn_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  weather_conditions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wear_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Closet items policies
CREATE POLICY "Users can view own items" ON public.closet_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.closet_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.closet_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.closet_items FOR DELETE USING (auth.uid() = user_id);

-- Outfits policies
CREATE POLICY "Users can view own outfits" ON public.outfits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outfits" ON public.outfits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own outfits" ON public.outfits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own outfits" ON public.outfits FOR DELETE USING (auth.uid() = user_id);

-- Wear history policies
CREATE POLICY "Users can view own history" ON public.wear_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.wear_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.wear_history FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_closet_items_updated_at BEFORE UPDATE ON public.closet_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_outfits_updated_at BEFORE UPDATE ON public.outfits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for closet images
INSERT INTO storage.buckets (id, name, public) VALUES ('closet-images', 'closet-images', true);

-- Storage policies
CREATE POLICY "Users can upload closet images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view closet images" ON storage.objects FOR SELECT USING (bucket_id = 'closet-images');
CREATE POLICY "Users can update own closet images" ON storage.objects FOR UPDATE USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own closet images" ON storage.objects FOR DELETE USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);