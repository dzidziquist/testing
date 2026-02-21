import { forwardRef, useState, useRef, useCallback } from 'react';
import { Outfit, ClosetItem } from '@/types/closet';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const getScoreTooltip = (score: number): string => {
  if (score >= 90) return "Perfect match! Exceptional style cohesion";
  if (score >= 80) return "Great outfit! Colors and styles work beautifully";
  if (score >= 70) return "Well put together with good harmony";
  if (score >= 60) return "Solid choice, works nicely";
  if (score >= 50) return "Decent combo, could use refinement";
  return "Consider mixing different pieces";
};

const getScoreLabel = (score: number): string => {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Great";
  if (score >= 70) return "Good";
  if (score >= 60) return "Solid";
  if (score >= 50) return "Decent";
  return "Needs work";
};

const generateOutfitDescription = (items: ClosetItem[], score: number | null | undefined): string => {
  if (items.length === 0) return "No items in this outfit";
  
  const piecesList = items.map(item => {
    const color = item.color ? `${item.color} ` : '';
    return `• ${color}${item.name}`;
  }).join('\n');
  
  const scoreText = score !== null && score !== undefined 
    ? `\n\nStyle Score: ${score}/100\n${getScoreTooltip(score)}`
    : '';
  
  return `${piecesList}${scoreText}`;
};

interface OutfitCardProps {
  outfit: Outfit;
  items: ClosetItem[];
  onClick?: () => void;
  compact?: boolean;
}

export const OutfitCard = forwardRef<HTMLDivElement, OutfitCardProps>(
  function OutfitCard({ outfit, items, onClick, compact = false }, ref) {
    const displayItems = items.slice(0, 4);
    const hasOutfitImage = !!outfit.image_url;
    
    // Long press state
    const [showPreview, setShowPreview] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);

    const handlePressStart = useCallback(() => {
      isLongPress.current = false;
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        setShowPreview(true);
      }, 500); // 500ms long press threshold
    }, []);

    const handlePressEnd = useCallback(() => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }, []);

    const handleClick = useCallback(() => {
      if (!isLongPress.current && onClick) {
        onClick();
      }
    }, [onClick]);

    return (
      <>
        <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          whileTap={{ scale: 0.98 }}
          className="bg-card rounded-xl overflow-hidden border-2 border-strong cursor-pointer group"
          onClick={handleClick}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Image area */}
          <div className={cn(
            "relative bg-secondary/30",
            compact ? "aspect-square" : "aspect-[4/5]"
          )}>
            {hasOutfitImage ? (
              <>
                <img
                  src={outfit.image_url!}
                  alt={outfit.name || 'Outfit'}
                  className="w-full h-full object-cover"
                />
                {!compact && (
                  <div className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm rounded-full p-1">
                    <ImageIcon className="w-2.5 h-2.5 text-foreground" />
                  </div>
                )}
              </>
            ) : (
              <div className={cn(
                "grid h-full gap-0.5",
                compact ? "p-1" : "p-1.5",
                displayItems.length <= 1 ? "grid-cols-1" : "grid-cols-2",
                displayItems.length > 2 && "grid-rows-2"
              )}>
                {displayItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "rounded-lg overflow-hidden bg-background/50",
                      displayItems.length === 1 && "col-span-2 row-span-2",
                      displayItems.length === 2 && "row-span-2",
                      displayItems.length === 3 && index === 0 && "row-span-2"
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
                          size={compact ? "sm" : "md"} 
                          className="text-muted-foreground/50" 
                        />
                      </div>
                    )}
                  </div>
                ))}
                {displayItems.length === 0 && (
                  <div className="col-span-2 row-span-2 flex items-center justify-center text-muted-foreground/50">
                    <span className="text-xs">No items</span>
                  </div>
                )}
              </div>
            )}

            {/* Score badge with tooltip */}
            {outfit.score !== undefined && outfit.score !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "absolute bottom-1.5 right-1.5 bg-background/90 backdrop-blur-sm rounded-full flex items-center gap-1 cursor-help",
                    compact ? "px-1.5 py-0.5" : "px-2 py-1"
                  )}>
                    <div 
                      className={cn("rounded-full", compact ? "w-1.5 h-1.5" : "w-2 h-2")} 
                      style={{ 
                        backgroundColor: outfit.score >= 80 
                          ? 'hsl(var(--score-high))' 
                          : outfit.score >= 60 
                            ? 'hsl(var(--score-medium))' 
                            : 'hsl(var(--score-low))' 
                      }}
                    />
                    <span 
                      className={cn("font-semibold", compact ? "text-[10px]" : "text-xs")}
                      style={{ 
                        color: outfit.score >= 80 
                          ? 'hsl(var(--score-high))' 
                          : outfit.score >= 60 
                            ? 'hsl(var(--score-medium))' 
                            : 'hsl(var(--score-low))' 
                      }}
                    >
                      {outfit.score}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[200px]">
                  {getScoreTooltip(outfit.score)}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Info section - hidden in compact mode */}
          {!compact && (
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-medium text-sm truncate flex-1">
                  {outfit.name || 'Untitled'}
                </h3>
                {outfit.is_ai_generated && (
                  <Sparkles className="shrink-0 w-3 h-3 text-primary" />
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{items.length} items</span>
                {outfit.occasion && (
                  <>
                    <span>•</span>
                    <span className="truncate">{outfit.occasion}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Long press preview overlay */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-xl border-2 border-strong shadow-xl max-w-sm w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-strong">
                  <h3 className="font-semibold">{outfit.name || 'Outfit Details'}</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-1 rounded-full hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Score display */}
                  {outfit.score !== undefined && outfit.score !== null && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-strong bg-secondary/30">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ 
                          backgroundColor: `${outfit.score >= 80 
                            ? 'hsl(var(--score-high) / 0.15)' 
                            : outfit.score >= 60 
                              ? 'hsl(var(--score-medium) / 0.15)' 
                              : 'hsl(var(--score-low) / 0.15)'}`,
                          color: outfit.score >= 80 
                            ? 'hsl(var(--score-high))' 
                            : outfit.score >= 60 
                              ? 'hsl(var(--score-medium))' 
                              : 'hsl(var(--score-low))'
                        }}
                      >
                        {outfit.score}
                      </div>
                      <div>
                        <p className="font-medium">{getScoreLabel(outfit.score)}</p>
                        <p className="text-xs text-muted-foreground">{getScoreTooltip(outfit.score)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Items list */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Pieces ({items.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary border border-strong shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <CategoryIcon category={item.category} size="sm" className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {[item.color, item.category].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Occasion/Season tags */}
                  {(outfit.occasion || outfit.season) && (
                    <div className="flex flex-wrap gap-2">
                      {outfit.occasion && (
                        <span className="px-2 py-1 rounded-full border border-strong bg-background text-xs">
                          {outfit.occasion}
                        </span>
                      )}
                      {outfit.season && (
                        <span className="px-2 py-1 rounded-full border border-strong bg-background text-xs">
                          {outfit.season}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
);
OutfitCard.displayName = 'OutfitCard';
