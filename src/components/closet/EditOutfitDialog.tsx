import { useState, useMemo, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Outfit, ClosetItem } from '@/types/closet';
import { useOutfits } from '@/hooks/useOutfits';
import { useWearHistory } from '@/hooks/useWearHistory';
import { useClosetItems } from '@/hooks/useClosetItems';
import { useOutfitPlans } from '@/hooks/useOutfitPlans';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Check, X, Plus, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { authenticatedFetch } from '@/lib/auth-fetch';
import { format, startOfDay } from 'date-fns';

interface EditOutfitDialogProps {
  outfit: Outfit;
  items: ClosetItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function EditOutfitDialog({ outfit, items: initialItems, isOpen, onClose }: EditOutfitDialogProps) {
  const { updateOutfit, deleteOutfit, refetch: refetchOutfits } = useOutfits();
  const { logWear, refetch: refetchWearHistory } = useWearHistory();
  const { items: allClosetItems, refetch: refetchItems, loading: itemsLoading } = useClosetItems();
  const { planOutfit, getPlansForDate, refetch: refetchPlans } = useOutfitPlans();
  const { toast } = useToast();
  
  const [name, setName] = useState(outfit.name || '');
  const [occasion, setOccasion] = useState(outfit.occasion || '');
  const [season, setSeason] = useState(outfit.season || '');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(outfit.item_ids);
  const [currentScore, setCurrentScore] = useState<number | null>(outfit.score ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);

  // Refetch items when dialog opens to ensure we have latest data
  useEffect(() => {
    if (isOpen) {
      refetchItems();
    }
  }, [isOpen, refetchItems]);

  // Combine allClosetItems with initialItems to ensure we always have the outfit's items
  const activeClosetItems = useMemo(() => {
    const activeItems = allClosetItems.filter(item => item.status === 'active');
    // If closet items haven't loaded yet, use initialItems
    if (activeItems.length === 0 && initialItems.length > 0) {
      return initialItems;
    }
    // Merge initialItems that might not be in activeItems (handles edge cases)
    const itemIds = new Set(activeItems.map(i => i.id));
    const missingItems = initialItems.filter(i => !itemIds.has(i.id) && i.status === 'active');
    return [...activeItems, ...missingItems];
  }, [allClosetItems, initialItems]);

  const selectedItems = useMemo(() => {
    // First try to get from activeClosetItems
    const fromCloset = activeClosetItems.filter(item => selectedItemIds.includes(item.id));
    // If we're missing items, fill in from initialItems
    if (fromCloset.length < selectedItemIds.length) {
      const foundIds = new Set(fromCloset.map(i => i.id));
      const missingFromInitial = initialItems.filter(i => selectedItemIds.includes(i.id) && !foundIds.has(i.id));
      return [...fromCloset, ...missingFromInitial];
    }
    return fromCloset;
  }, [activeClosetItems, selectedItemIds, initialItems]);

  const availableItems = useMemo(() => 
    activeClosetItems.filter(item => !selectedItemIds.includes(item.id)),
    [activeClosetItems, selectedItemIds]
  );

  const itemsChanged = useMemo(() => 
    JSON.stringify([...selectedItemIds].sort()) !== JSON.stringify([...outfit.item_ids].sort()),
    [selectedItemIds, outfit.item_ids]
  );

  const hasChanges = useMemo(() => {
    const nameChanged = (name || null) !== (outfit.name || null);
    const occasionChanged = (occasion || null) !== (outfit.occasion || null);
    const seasonChanged = (season || null) !== (outfit.season || null);
    const scoreChanged = currentScore !== (outfit.score ?? null);
    return nameChanged || occasionChanged || seasonChanged || itemsChanged || scoreChanged;
  }, [name, occasion, season, currentScore, itemsChanged, outfit]);

  // Recalculate score when items change
  const recalculateScore = useCallback(async (itemIds: string[]) => {
    if (itemIds.length < 2) return;
    
    const itemsForAnalysis = activeClosetItems.filter(item => itemIds.includes(item.id));
    if (itemsForAnalysis.length < 2) return;

    setIsRecalculating(true);
    try {
      const response = await authenticatedFetch('analyze-outfit', {
        items: itemsForAnalysis.map(item => ({
          name: item.name,
          category: item.category,
          color: item.color,
          pattern: item.pattern,
          brand: item.brand,
        })),
      });
      const result = await response.json();
      if (result.success && result.data?.score !== undefined) {
        setCurrentScore(result.data.score);
      }
    } catch (error) {
      console.log('Could not recalculate score:', error);
    } finally {
      setIsRecalculating(false);
    }
  }, [activeClosetItems]);

  // Auto-recalculate when items change
  useEffect(() => {
    if (itemsChanged && selectedItemIds.length >= 2 && activeClosetItems.length > 0) {
      const timeout = setTimeout(() => {
        recalculateScore(selectedItemIds);
      }, 500); // Debounce
      return () => clearTimeout(timeout);
    }
  }, [selectedItemIds, itemsChanged, recalculateScore, activeClosetItems.length]);

  const handleAddItem = (itemId: string) => {
    setSelectedItemIds(prev => [...prev, itemId]);
  };

  const handleRemoveItem = (itemId: string) => {
    if (selectedItemIds.length <= 2) {
      toast({ 
        title: 'Minimum 2 items required', 
        description: 'An outfit needs at least 2 items',
        variant: 'destructive' 
      });
      return;
    }
    setSelectedItemIds(prev => prev.filter(id => id !== itemId));
  };

  const handleSave = async () => {
    if (selectedItemIds.length < 2) {
      toast({ 
        title: 'Select at least 2 items', 
        description: 'An outfit needs at least 2 items',
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateOutfit(outfit.id, {
        name: name || null,
        occasion: occasion || null,
        season: season || null,
        item_ids: selectedItemIds,
        score: currentScore,
      });
      toast({ title: 'Outfit updated' });
      onClose();
    } catch (error: any) {
      toast({ title: 'Error updating outfit', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteOutfit(outfit.id);
      toast({ title: 'Outfit deleted' });
      onClose();
    } catch (error: any) {
      toast({ title: 'Error deleting outfit', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogWear = async () => {
    setIsLoading(true);
    try {
      const tagParts: string[] = [];
      if (outfit.occasion) tagParts.push(outfit.occasion);
      if (outfit.season) tagParts.push(outfit.season);
      const notes = tagParts.length > 0 ? tagParts.join(', ') : undefined;

      await logWear(selectedItemIds, outfit.id, notes);
      
      // Also add to planner for today if not already planned
      const today = startOfDay(new Date());
      const todayPlans = getPlansForDate(today);
      const alreadyPlanned = todayPlans.some(p => p.outfit_id === outfit.id);
      
      if (!alreadyPlanned) {
        await planOutfit(outfit.id, today);
      }
      
      await Promise.all([
        refetchOutfits(),
        refetchWearHistory(),
        refetchItems(),
        refetchPlans(),
      ]);
      
      toast({ title: 'Outfit logged as worn!', description: `${selectedItems.length} items updated` });
      onClose();
    } catch (error: any) {
      toast({ title: 'Error logging wear', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--score-high))';
    if (score >= 60) return 'hsl(var(--score-medium))';
    return 'hsl(var(--score-low))';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Outfit</DialogTitle>
            {/* Score display */}
            {currentScore !== null && (
              <div className="flex items-center gap-1.5">
                {isRecalculating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                ) : (
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: getScoreColor(currentScore) }}
                  />
                )}
                <span 
                  className="text-sm font-semibold"
                  style={{ color: getScoreColor(currentScore) }}
                >
                  {currentScore}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Selected items with remove option */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Items ({selectedItems.length})
            </Label>
            <div className="flex gap-2 overflow-x-auto py-1">
              <AnimatePresence mode="popLayout">
                {selectedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative shrink-0 group"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <CategoryIcon category={item.category} className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Add item button */}
              <button
                onClick={() => setShowItemPicker(!showItemPicker)}
                className="shrink-0 w-14 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expandable item picker */}
          <AnimatePresence>
            {showItemPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Add from closet</Label>
                    <button 
                      onClick={() => setShowItemPicker(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                  {itemsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ScrollArea className="h-48">
                      <div className="grid grid-cols-2 gap-3 pr-2">
                        {availableItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleAddItem(item.id)}
                            className="aspect-square rounded-lg overflow-hidden bg-secondary hover:ring-2 hover:ring-primary transition-all"
                          >
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <CategoryIcon category={item.category} className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </button>
                        ))}
                        {availableItems.length === 0 && !itemsLoading && (
                          <p className="col-span-4 text-xs text-muted-foreground text-center py-4">
                            {activeClosetItems.length === 0 
                              ? 'No items in your closet' 
                              : 'All items are in this outfit'}
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Date Night Look"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occasion">Occasion</Label>
            <Input
              id="occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="e.g., Casual, Work, Party"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="season">Season</Label>
            <Input
              id="season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="e.g., Summer, Winter"
            />
          </div>

          {/* Log wear button */}
          <Button 
            onClick={handleLogWear} 
            disabled={isLoading}
            className="w-full"
            variant="secondary"
          >
            <Check className="w-4 h-4 mr-2" />
            Log as Worn Today
          </Button>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2 pt-4 border-t">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || isRecalculating || !hasChanges} 
            className="flex-1"
          >
            {isRecalculating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Scoring...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
