import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ClosetItem, ItemCategory, ItemStatus, ArchiveReason } from '@/types/closet';
import { useToast } from '@/hooks/use-toast';

// Recommended indexes for production performance:
// CREATE INDEX idx_closet_items_user_id ON public.closet_items (user_id);
// CREATE INDEX idx_closet_items_created_at ON public.closet_items (created_at DESC);
// CREATE INDEX idx_closet_items_user_created ON public.closet_items (user_id, created_at DESC);

const PAGE_SIZE = 30;
const IMAGE_BATCH_SIZE = 10;

// Columns to fetch in the initial metadata query (excludes image_url to avoid timeouts from large base64 data)
const METADATA_COLUMNS = 'id, user_id, name, brand, color, pattern, category, status, archive_reason, season, wear_count, last_worn_at, purchase_date, purchase_price, product_url, ai_metadata, created_at, updated_at';

export function useClosetItems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchImages = useCallback(async (itemIds: string[]) => {
    // Batch image fetches to avoid N+1 while staying under timeout limits
    const imageMap = new Map<string, string>();

    for (let i = 0; i < itemIds.length; i += IMAGE_BATCH_SIZE) {
      const batch = itemIds.slice(i, i + IMAGE_BATCH_SIZE);
      try {
        const { data } = await supabase
          .from('closet_items')
          .select('id, image_url')
          .in('id', batch)
          .not('image_url', 'is', null);

        if (data) {
          data.forEach(row => {
            if (row.image_url) imageMap.set(row.id, row.image_url);
          });
        }
      } catch {
        // Skip batches that timeout — UI still works without images
      }
    }

    return imageMap;
  }, []);

  const fetchItems = useCallback(async (offset = 0, append = false) => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      // Step 1: Fetch metadata (fast, no large blobs)
      const { data, error } = await supabase
        .from('closet_items')
        .select(METADATA_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const fetched = (data || []).map(item => ({ ...item, image_url: null })) as ClosetItem[];
      setHasMore(fetched.length === PAGE_SIZE);

      if (append) {
        setItems(prev => [...prev, ...fetched]);
      } else {
        setItems(fetched);
      }

      // Step 2: Batch-fetch images (non-blocking, updates UI progressively)
      const itemIds = fetched.map(i => i.id);
      if (itemIds.length > 0) {
        const imageMap = await fetchImages(itemIds);
        if (imageMap.size > 0) {
          setItems(prev => prev.map(item => ({
            ...item,
            image_url: imageMap.get(item.id) || item.image_url || null,
          })));
        }
      }
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error loading items',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchImages]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchItems(items.length, true);
    }
  }, [fetchItems, hasMore, loading, items.length]);

  const addItem = async (item: {
    name: string;
    category: ItemCategory;
    brand?: string;
    color?: string;
    pattern?: string;
    season?: string[];
    image_url?: string;
    status?: ItemStatus;
    product_url?: string;
  }) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('closet_items')
      .insert({
        name: item.name,
        category: item.category,
        brand: item.brand,
        color: item.color,
        pattern: item.pattern,
        season: item.season,
        image_url: item.image_url,
        status: item.status || 'active',
        product_url: item.product_url,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    setItems(prev => [data as ClosetItem, ...prev]);
    return data;
  };

  const updateItem = async (id: string, updates: {
    name?: string;
    category?: ItemCategory;
    brand?: string;
    color?: string;
    status?: ItemStatus;
    archive_reason?: ArchiveReason;
    wear_count?: number;
    last_worn_at?: string;
    image_url?: string;
    product_url?: string;
  }) => {
    const { data, error } = await supabase
      .from('closet_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setItems(prev => prev.map(item => item.id === id ? data as ClosetItem : item));
    return data;
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('closet_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const archiveItem = async (id: string, reason: ArchiveReason) => {
    return updateItem(id, { status: 'archived', archive_reason: reason });
  };

  const incrementWearCount = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    return updateItem(id, { 
      wear_count: item.wear_count + 1,
      last_worn_at: new Date().toISOString(),
    });
  };

  return {
    items,
    loading,
    hasMore,
    loadMore,
    addItem,
    updateItem,
    deleteItem,
    archiveItem,
    incrementWearCount,
    refetch: fetchItems,
  };
}
