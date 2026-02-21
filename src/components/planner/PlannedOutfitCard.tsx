import { motion } from 'framer-motion';
import { Shirt, RefreshCw, Trash2, Check, Clock, Sparkles, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Outfit, ClosetItem } from '@/types/closet';
import { OutfitPlan } from '@/hooks/useOutfitPlans';
import { isBefore, startOfDay, isToday } from 'date-fns';
import { WeatherPreview } from './WeatherPreview';
import { CategoryIcon } from '@/components/closet/CategoryIcon';
import { cn } from '@/lib/utils';

interface PlannedOutfitCardProps {
  outfit: Outfit;
  plan: OutfitPlan;
  selectedDate: Date;
  items?: ClosetItem[];
  weather?: { temp: number; condition: string } | null;
  weatherLoading?: boolean;
  onSwap: () => void;
  onRemove: () => void;
  onMarkWorn: () => void;
  onUnmarkWorn?: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function PlannedOutfitCard({ 
  outfit, 
  plan, 
  selectedDate,
  items = [],
  weather,
  weatherLoading,
  onSwap, 
  onRemove, 
  onMarkWorn,
  onUnmarkWorn,
  onRegenerate,
  isRegenerating 
}: PlannedOutfitCardProps) {
  const isPast = isBefore(startOfDay(selectedDate), startOfDay(new Date())) && !isToday(selectedDate);
  const canMarkWorn = (isPast || isToday(selectedDate)) && !plan.is_worn;

  // Get outfit items for grid display
  const outfitItems = items.filter(item => outfit.item_ids.includes(item.id)).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border-2 border-strong overflow-hidden"
    >
      {/* Weather Preview */}
      {weather !== undefined && (
        <div className="px-4 pt-4">
          <WeatherPreview weather={weather} isLoading={weatherLoading || false} />
        </div>
      )}

      {/* Outfit Image */}
      <div className="relative aspect-[4/3] mt-3">
        {outfit.image_url ? (
          <img
            src={outfit.image_url}
            alt={outfit.name || 'Planned outfit'}
            className="w-full h-full object-cover"
          />
        ) : outfitItems.length > 0 ? (
          // Grid of item images as fallback
          <div className={cn(
            "w-full h-full bg-secondary/30 grid gap-0.5 p-1",
            outfitItems.length <= 1 ? "grid-cols-1" : "grid-cols-2",
            outfitItems.length > 2 && "grid-rows-2"
          )}>
            {outfitItems.map((item, index) => (
              <div 
                key={item.id} 
                className={cn(
                  "rounded-lg overflow-hidden bg-background/50",
                  outfitItems.length === 1 && "col-span-2 row-span-2",
                  outfitItems.length === 2 && "row-span-2",
                  outfitItems.length === 3 && index === 0 && "row-span-2"
                )}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CategoryIcon 
                      category={item.category} 
                      size="lg" 
                      className="text-muted-foreground/50" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <Shirt className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Status Badge */}
        {plan.is_worn ? (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Worn
          </div>
        ) : isPast ? (
          <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Not marked
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{outfit.name || 'Untitled Outfit'}</h3>
        <div className="flex gap-2 mt-2">
          {outfit.occasion && (
            <span className="px-2 py-1 bg-secondary rounded-md text-xs text-muted-foreground">
              {outfit.occasion}
            </span>
          )}
          {outfit.season && (
            <span className="px-2 py-1 bg-secondary rounded-md text-xs text-muted-foreground">
              {outfit.season}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {canMarkWorn && (
            <Button 
              onClick={onMarkWorn} 
              className="flex-1"
              variant="default"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark as Worn
            </Button>
          )}
          
          {plan.is_worn && onUnmarkWorn && (
            <Button 
              onClick={onUnmarkWorn} 
              className="flex-1"
              variant="outline"
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Unmark as Worn
            </Button>
          )}
          
          {!plan.is_worn && (
            <>
              {onRegenerate && (
                <Button 
                  onClick={onRegenerate} 
                  variant="outline"
                  size="icon"
                  className="border-2 border-strong"
                  disabled={isRegenerating}
                >
                  <Sparkles className={`w-4 h-4 ${isRegenerating ? 'animate-pulse' : ''}`} />
                </Button>
              )}
              <Button 
                onClick={onSwap} 
                variant="outline"
                size="icon"
                className="border-2 border-strong"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button 
                onClick={onRemove} 
                variant="outline"
                size="icon"
                className="border-2 border-strong text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
