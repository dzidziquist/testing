import { useState, useCallback } from 'react';
import { useClosetItems } from './useClosetItems';
import { useOutfits } from './useOutfits';
import { useWearHistory } from './useWearHistory';
import { useAuth } from './useAuth';
import { ClosetItem, Outfit } from '@/types/closet';
import { authenticatedFetch } from '@/lib/auth-fetch';

export interface DailyOutfitSuggestion {
  outfit: Outfit | null;
  items: ClosetItem[];
  score: number;
  reasoning: string;
  occasion: string;
  weather?: {
    temp?: number;
    condition?: string;
  };
  season?: string;
}

interface WeatherContext {
  temp?: number;
  condition?: string;
}

export function useDailyOutfit() {
  const { items } = useClosetItems();
  const { outfits } = useOutfits();
  const { history } = useWearHistory();
  const { profile } = useAuth();

  const [suggestion, setSuggestion] = useState<DailyOutfitSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestion = useCallback(async (weather?: WeatherContext, occasion?: string, preferUnwornIds?: string[]) => {
    const activeItems = items.filter(i => i.status === 'active');
    
    if (activeItems.length < 2) {
      setError('Add more items to get outfit suggestions');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resp = await authenticatedFetch('daily-outfit', {
        closetItems: activeItems,
        outfits,
        wearHistory: history,
        profile,
        weather,
        occasion,
        preferUnwornIds,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${resp.status}`);
      }

      const data = await resp.json();
      
      // Map suggested item IDs to actual items
      const suggestedItems = (data.item_ids || [])
        .map((id: string) => activeItems.find(item => item.id === id))
        .filter(Boolean) as ClosetItem[];

      // Determine season from current date
      const month = new Date().getMonth();
      const currentSeason = month >= 2 && month <= 4 ? 'Spring' 
        : month >= 5 && month <= 7 ? 'Summer'
        : month >= 8 && month <= 10 ? 'Fall' : 'Winter';

      setSuggestion({
        outfit: null,
        items: suggestedItems,
        score: data.score || 75,
        reasoning: data.reasoning || 'A stylish combination for your day',
        occasion: data.occasion || occasion || 'Everyday',
        weather: weather,
        season: currentSeason,
      });
    } catch (err) {
      console.error('Daily outfit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate outfit');
      
      // Fallback: create a simple suggestion from existing items
      const activeItems = items.filter(i => i.status === 'active');
      const tops = activeItems.filter(i => i.category === 'tops');
      const bottoms = activeItems.filter(i => i.category === 'bottoms');
      const shoes = activeItems.filter(i => i.category === 'shoes');
      
      const fallbackItems = [
        tops[Math.floor(Math.random() * tops.length)],
        bottoms[Math.floor(Math.random() * bottoms.length)],
        shoes[Math.floor(Math.random() * shoes.length)],
      ].filter(Boolean);

      if (fallbackItems.length > 0) {
        const month = new Date().getMonth();
        const currentSeason = month >= 2 && month <= 4 ? 'Spring' 
          : month >= 5 && month <= 7 ? 'Summer'
          : month >= 8 && month <= 10 ? 'Fall' : 'Winter';

        setSuggestion({
          outfit: null,
          items: fallbackItems,
          score: 65,
          reasoning: 'A classic combination from your closet',
          occasion: 'Everyday',
          weather: weather,
          season: currentSeason,
        });
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [items, outfits, history, profile]);

  const refreshSuggestion = useCallback((weather?: WeatherContext, occasion?: string, preferUnwornIds?: string[]) => {
    generateSuggestion(weather, occasion, preferUnwornIds);
  }, [generateSuggestion]);

  return {
    suggestion,
    isLoading,
    error,
    generateSuggestion,
    refreshSuggestion,
  };
}
