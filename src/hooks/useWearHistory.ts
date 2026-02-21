import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { WearHistory } from '@/types/closet';
import { useToast } from '@/hooks/use-toast';

export function useWearHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<WearHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wear_history')
        .select('*')
        .eq('user_id', user.id)
        .order('worn_at', { ascending: false });

      if (error) throw error;
      
      setHistory((data || []) as WearHistory[]);
    } catch (error: any) {
      console.error('Error fetching wear history:', error);
      toast({
        title: 'Error loading history',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Helper to update item wear counts (for incrementing when logging wear)
  const updateItemWearCounts = async (itemIds: string[], increment: number) => {
    if (!user || itemIds.length === 0) return;

    // Fetch current items to get their wear counts
    const { data: currentItems, error: fetchError } = await supabase
      .from('closet_items')
      .select('id, wear_count')
      .in('id', itemIds)
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching items for wear count update:', fetchError);
      return;
    }

    // Update each item's wear count
    const updates = (currentItems || []).map(item => 
      supabase
        .from('closet_items')
        .update({ 
          wear_count: Math.max(0, (item.wear_count || 0) + increment),
          ...(increment > 0 ? { last_worn_at: new Date().toISOString() } : {})
        })
        .eq('id', item.id)
        .eq('user_id', user.id)
    );

    await Promise.all(updates);
  };

  // Helper to recalculate last_worn_at for items after a wear entry is deleted
  const recalculateLastWornAt = async (itemIds: string[], deletedEntryId: string) => {
    if (!user || itemIds.length === 0) return;

    // For each item, find the most recent wear entry (excluding the deleted one)
    for (const itemId of itemIds) {
      const { data: remainingHistory, error } = await supabase
        .from('wear_history')
        .select('worn_at')
        .eq('user_id', user.id)
        .neq('id', deletedEntryId)
        .contains('item_ids', [itemId])
        .order('worn_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching remaining history for item:', itemId, error);
        continue;
      }

      const newLastWornAt = remainingHistory && remainingHistory.length > 0 
        ? remainingHistory[0].worn_at 
        : null;

      await supabase
        .from('closet_items')
        .update({ last_worn_at: newLastWornAt })
        .eq('id', itemId)
        .eq('user_id', user.id);
    }
  };

  const logWear = async (
    itemIds: string[], 
    outfitId?: string, 
    notes?: string,
    weatherConditions?: { temp?: number; condition?: string; description?: string }
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('wear_history')
      .insert({
        user_id: user.id,
        item_ids: itemIds,
        outfit_id: outfitId,
        notes,
        weather_conditions: weatherConditions || null,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Increment wear counts for all items
    await updateItemWearCounts(itemIds, 1);
    
    setHistory(prev => [data as WearHistory, ...prev]);
    return data;
  };

  const updateWearEntry = async (
    id: string, 
    updates: { notes?: string; weather_conditions?: { temp?: number; condition?: string } | null }
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('wear_history')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    setHistory(prev => prev.map(entry => entry.id === id ? (data as WearHistory) : entry));
    return data;
  };

  const deleteWearEntry = async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    // First get the entry to know which items to update
    const entryToDelete = history.find(e => e.id === id);
    
    const { error } = await supabase
      .from('wear_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    // Decrement wear counts and recalculate last_worn_at for all items in this entry
    if (entryToDelete) {
      await updateItemWearCounts(entryToDelete.item_ids, -1);
      await recalculateLastWornAt(entryToDelete.item_ids, id);
    }
    
    setHistory(prev => prev.filter(entry => entry.id !== id));
  };

  return {
    history,
    loading,
    logWear,
    updateWearEntry,
    deleteWearEntry,
    refetch: fetchHistory,
  };
}
