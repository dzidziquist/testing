import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Outfit } from '@/types/closet';
import { useToast } from '@/hooks/use-toast';

export function useOutfits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOutfits = useCallback(async () => {
    if (!user) {
      setOutfits([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setOutfits((data || []) as Outfit[]);
    } catch (error: any) {
      console.error('Error fetching outfits:', error);
      toast({
        title: 'Error loading outfits',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchOutfits();
  }, [fetchOutfits]);

  const createOutfit = async (outfit: {
    name?: string;
    item_ids: string[];
    is_ai_generated?: boolean;
    occasion?: string;
    season?: string;
    image_url?: string;
    score?: number;
  }) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('outfits')
      .insert({
        name: outfit.name,
        item_ids: outfit.item_ids,
        is_ai_generated: outfit.is_ai_generated || false,
        occasion: outfit.occasion,
        season: outfit.season,
        image_url: outfit.image_url,
        score: outfit.score,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    setOutfits(prev => [data as Outfit, ...prev]);
    return data;
  };

  const updateOutfit = async (id: string, updates: Partial<Outfit>) => {
    const { data, error } = await supabase
      .from('outfits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setOutfits(prev => prev.map(outfit => outfit.id === id ? data as Outfit : outfit));
    return data;
  };

  const deleteOutfit = async (id: string) => {
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setOutfits(prev => prev.filter(outfit => outfit.id !== id));
  };

  return {
    outfits,
    loading,
    createOutfit,
    updateOutfit,
    deleteOutfit,
    refetch: fetchOutfits,
  };
}
