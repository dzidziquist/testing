import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay } from 'date-fns';

export interface OutfitPlan {
  id: string;
  user_id: string;
  outfit_id: string;
  planned_date: string;
  is_worn: boolean;
  created_at: string;
  updated_at: string;
}

export function useOutfitPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<OutfitPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('outfit_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('planned_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPlans((data || []) as OutfitPlan[]);
    } catch (error: any) {
      console.error('Error fetching outfit plans:', error);
      toast({
        title: 'Error loading plans',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const planOutfit = async (outfitId: string, date: Date) => {
    if (!user) throw new Error('Not authenticated');

    const plannedDate = format(startOfDay(date), 'yyyy-MM-dd');

    // Always create a new plan (allow multiple per day)
    const { data, error } = await supabase
      .from('outfit_plans')
      .insert({
        user_id: user.id,
        outfit_id: outfitId,
        planned_date: plannedDate,
      })
      .select()
      .single();

    if (error) throw error;
    setPlans(prev => [...prev, data as OutfitPlan]);
    return data;
  };

  const updatePlanOutfit = async (planId: string, outfitId: string) => {
    const { data, error } = await supabase
      .from('outfit_plans')
      .update({ outfit_id: outfitId })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    setPlans(prev => prev.map(p => p.id === planId ? data as OutfitPlan : p));
    return data;
  };

  const removePlan = async (planId: string) => {
    const { error } = await supabase
      .from('outfit_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
    setPlans(prev => prev.filter(p => p.id !== planId));
  };

  const markAsWorn = async (planId: string) => {
    const { data, error } = await supabase
      .from('outfit_plans')
      .update({ is_worn: true })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    setPlans(prev => prev.map(p => p.id === planId ? data as OutfitPlan : p));
    return data;
  };

  const unmarkAsWorn = async (planId: string) => {
    const { data, error } = await supabase
      .from('outfit_plans')
      .update({ is_worn: false })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    setPlans(prev => prev.map(p => p.id === planId ? data as OutfitPlan : p));
    return data;
  };

  // Get all plans for a specific date (supports multiple)
  const getPlansForDate = (date: Date): OutfitPlan[] => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return plans.filter(p => p.planned_date === dateStr);
  };

  // Legacy: get first plan for date (for backward compatibility with calendar indicators)
  const getPlanForDate = (date: Date): OutfitPlan | undefined => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return plans.find(p => p.planned_date === dateStr);
  };

  return {
    plans,
    loading,
    planOutfit,
    updatePlanOutfit,
    removePlan,
    markAsWorn,
    unmarkAsWorn,
    getPlanForDate,
    getPlansForDate,
    refetch: fetchPlans,
  };
}
