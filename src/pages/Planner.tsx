import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addMonths, subMonths, addDays, format, startOfDay, startOfMonth } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useOutfits } from '@/hooks/useOutfits';
import { useOutfitPlans } from '@/hooks/useOutfitPlans';
import { useWearHistory } from '@/hooks/useWearHistory';
import { useWeather } from '@/hooks/useWeather';
import { useDailyOutfit } from '@/hooks/useDailyOutfit';
import { useClosetItems } from '@/hooks/useClosetItems';
import { useToast } from '@/hooks/use-toast';
import { CalendarView } from '@/components/planner/CalendarView';
import { ViewModeToggle } from '@/components/planner/ViewModeToggle';
import { PlannedOutfitCard } from '@/components/planner/PlannedOutfitCard';
import { EmptyDayCard } from '@/components/planner/EmptyDayCard';
import { OutfitPicker } from '@/components/planner/OutfitPicker';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function PlannerPage() {
  const { outfits, loading: outfitsLoading, createOutfit } = useOutfits();
  const { plans, loading: plansLoading, planOutfit, updatePlanOutfit, removePlan, markAsWorn, unmarkAsWorn, getPlanForDate, getPlansForDate } = useOutfitPlans();
  const { logWear } = useWearHistory();
  const { weather, isLoading: weatherLoading } = useWeather();
  const { suggestion, isLoading: aiLoading, generateSuggestion } = useDailyOutfit();
  const { items } = useClosetItems();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showPicker, setShowPicker] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Get all plans for the selected date
  const currentPlans = getPlansForDate(selectedDate);
  
  // Map plans to their outfits
  const currentOutfits = currentPlans.map(plan => ({
    plan,
    outfit: outfits.find(o => o.id === plan.outfit_id),
  })).filter(item => item.outfit);

  const hasPlannedOutfit = useCallback((date: Date) => !!getPlanForDate(date), [getPlanForDate]);
  const isWorn = useCallback((date: Date) => {
    const plansForDate = getPlansForDate(date);
    return plansForDate.length > 0 && plansForDate.every(p => p.is_worn);
  }, [getPlansForDate]);

  const handlePlanOutfit = async (outfitId: string) => {
    try {
      if (editingPlanId) {
        // Swapping an existing outfit
        await updatePlanOutfit(editingPlanId, outfitId);
        toast({
          title: 'Outfit updated',
          description: `Outfit changed for ${format(selectedDate, 'EEEE, MMM d')}`,
        });
      } else {
        // Adding a new outfit
        await planOutfit(outfitId, selectedDate);
        toast({
          title: 'Outfit planned',
          description: `Outfit added for ${format(selectedDate, 'EEEE, MMM d')}`,
        });
      }
      setShowPicker(false);
      setEditingPlanId(null);
    } catch (error: any) {
      toast({
        title: 'Failed to plan outfit',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSwapOutfit = (planId: string) => {
    setEditingPlanId(planId);
    setShowPicker(true);
  };

  const handleAddOutfit = () => {
    setEditingPlanId(null);
    setShowPicker(true);
  };

  const handleRemovePlan = async (planId: string) => {
    try {
      await removePlan(planId);
      toast({
        title: 'Plan removed',
        description: 'Outfit removed from your schedule',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to remove plan',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMarkWorn = async (planId: string, outfitItemIds: string[], outfitId: string) => {
    try {
      await markAsWorn(planId);
      await logWear(outfitItemIds, outfitId);

      toast({
        title: 'Outfit marked as worn',
        description: 'Wear counts and history updated',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to mark as worn',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUnmarkWorn = async (planId: string) => {
    try {
      await unmarkAsWorn(planId);
      toast({
        title: 'Outfit unmarked',
        description: 'Status reverted',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to unmark outfit',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRegenerate = async (planId: string) => {
    setIsRegenerating(true);
    try {
      await generateSuggestion(
        weather ? { temp: weather.temp, condition: weather.condition } : undefined
      );

      if (suggestion && suggestion.items.length > 0) {
        const newOutfit = await createOutfit({
          name: `AI Suggestion - ${format(selectedDate, 'MMM d')}`,
          item_ids: suggestion.items.map(i => i.id),
          is_ai_generated: true,
          occasion: suggestion.occasion,
          season: suggestion.season,
        });

        if (newOutfit) {
          await updatePlanOutfit(planId, newOutfit.id);
          toast({
            title: 'Outfit regenerated',
            description: 'AI created a new outfit based on weather and your style',
          });
        }
      } else {
        toast({
          title: 'Could not regenerate',
          description: 'Add more items to your closet for AI suggestions',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to regenerate',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const loading = outfitsLoading || plansLoading;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2 border-strong">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Planner</h1>
                <p className="text-sm text-muted-foreground">Plan your outfits</p>
              </div>
            </div>
            <ViewModeToggle viewMode={viewMode} onToggle={setViewMode} />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={viewMode === 'month' ? handlePrevMonth : () => setSelectedDate(prev => addDays(prev, -7))}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-sm font-semibold">
              {viewMode === 'month' 
                ? format(currentMonth, 'MMMM yyyy')
                : format(selectedDate, 'MMMM yyyy')}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={viewMode === 'month' ? handleNextMonth : () => setSelectedDate(prev => addDays(prev, 7))}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar */}
          <CalendarView
            viewMode={viewMode}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            hasPlannedOutfit={hasPlannedOutfit}
            isWorn={isWorn}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        <motion.div
          key={format(selectedDate, 'yyyy-MM-dd')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h2>
            {currentOutfits.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddOutfit}
                className="h-8 text-xs"
              >
              <Plus className="w-3.5 h-3.5 mr-1" />
                Add Outfit
              </Button>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : currentOutfits.length > 0 ? (
            <div className="space-y-4">
              {currentOutfits.map(({ plan, outfit }, index) => (
                <PlannedOutfitCard
                  key={plan.id}
                  outfit={outfit!}
                  plan={plan}
                  selectedDate={selectedDate}
                  items={items}
                  weather={index === 0 ? weather : undefined}
                  weatherLoading={index === 0 ? weatherLoading : false}
                  onSwap={() => handleSwapOutfit(plan.id)}
                  onRemove={() => handleRemovePlan(plan.id)}
                  onMarkWorn={() => handleMarkWorn(plan.id, outfit!.item_ids, outfit!.id)}
                  onUnmarkWorn={() => handleUnmarkWorn(plan.id)}
                  onRegenerate={() => handleRegenerate(plan.id)}
                  isRegenerating={isRegenerating || aiLoading}
                />
              ))}
            </div>
          ) : (
            <EmptyDayCard
              selectedDate={selectedDate}
              onPlanOutfit={handleAddOutfit}
            />
          )}
        </motion.div>

        {/* Past day reminder */}
        {plans.some(p => {
          const planDate = new Date(p.planned_date);
          return !p.is_worn && planDate < startOfDay(new Date());
        }) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-accent/50 border-2 border-accent rounded-xl"
          >
            <p className="text-sm font-medium">
              You have unmarked outfits from past days
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap on a past day to mark outfits as worn
            </p>
          </motion.div>
        )}
      </div>

      {/* Outfit Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <OutfitPicker
            outfits={outfits}
            items={items}
            onSelect={handlePlanOutfit}
            onClose={() => {
              setShowPicker(false);
              setEditingPlanId(null);
            }}
            currentOutfitId={editingPlanId ? currentPlans.find(p => p.id === editingPlanId)?.outfit_id : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
