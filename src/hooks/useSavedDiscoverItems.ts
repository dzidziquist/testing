import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

interface SavedItem {
  id: string;
  item_id: string;
  item_type: 'trend' | 'outfit' | 'shop';
  is_liked: boolean;
  is_saved: boolean;
  item_data: Json;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemData = Record<string, any>;

export function useSavedDiscoverItems() {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const likedIds = new Set(savedItems.filter(i => i.is_liked).map(i => i.item_id));
  const savedIds = new Set(savedItems.filter(i => i.is_saved).map(i => i.item_id));

  const fetchSavedItems = useCallback(async () => {
    if (!user) {
      setSavedItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_discover_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setSavedItems((data || []) as SavedItem[]);
    } catch (error) {
      console.error('Error fetching saved items:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  const toggleLike = useCallback(async (
    itemId: string, 
    itemType: 'trend' | 'outfit' | 'shop',
    itemData: ItemData
  ) => {
    if (!user) return;

    const existing = savedItems.find(i => i.item_id === itemId);
    
    if (existing) {
      // Update existing
      const newLiked = !existing.is_liked;
      
      // If both are false after toggle, delete the record
      if (!newLiked && !existing.is_saved) {
        const { error } = await supabase
          .from('saved_discover_items')
          .delete()
          .eq('id', existing.id);
        
        if (!error) {
          setSavedItems(prev => prev.filter(i => i.id !== existing.id));
        }
      } else {
        const { error } = await supabase
          .from('saved_discover_items')
          .update({ is_liked: newLiked })
          .eq('id', existing.id);
        
        if (!error) {
          setSavedItems(prev => prev.map(i => 
            i.id === existing.id ? { ...i, is_liked: newLiked } : i
          ));
        }
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('saved_discover_items')
        .insert([{
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
          is_liked: true,
          is_saved: false,
          item_data: itemData,
        }])
        .select()
        .single();
      
      if (!error && data) {
        setSavedItems(prev => [...prev, data as SavedItem]);
      }
    }
  }, [user, savedItems]);

  const toggleSave = useCallback(async (
    itemId: string, 
    itemType: 'trend' | 'outfit' | 'shop',
    itemData: ItemData
  ) => {
    if (!user) return;

    const existing = savedItems.find(i => i.item_id === itemId);
    
    if (existing) {
      // Update existing
      const newSaved = !existing.is_saved;
      
      // If both are false after toggle, delete the record
      if (!newSaved && !existing.is_liked) {
        const { error } = await supabase
          .from('saved_discover_items')
          .delete()
          .eq('id', existing.id);
        
        if (!error) {
          setSavedItems(prev => prev.filter(i => i.id !== existing.id));
        }
      } else {
        const { error } = await supabase
          .from('saved_discover_items')
          .update({ is_saved: newSaved })
          .eq('id', existing.id);
        
        if (!error) {
          setSavedItems(prev => prev.map(i => 
            i.id === existing.id ? { ...i, is_saved: newSaved } : i
          ));
        }
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('saved_discover_items')
        .insert([{
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
          is_liked: false,
          is_saved: true,
          item_data: itemData,
        }])
        .select()
        .single();
      
      if (!error && data) {
        setSavedItems(prev => [...prev, data as SavedItem]);
      }
    }
  }, [user, savedItems]);

  return {
    savedItems,
    likedIds,
    savedIds,
    loading,
    toggleLike,
    toggleSave,
    refetch: fetchSavedItems,
  };
}
