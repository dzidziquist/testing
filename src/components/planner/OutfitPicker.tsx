import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Outfit, ClosetItem } from '@/types/closet';
import { CategoryIcon } from '@/components/closet/CategoryIcon';
import { cn } from '@/lib/utils';

interface OutfitPickerProps {
  outfits: Outfit[];
  items: ClosetItem[];
  onSelect: (outfitId: string) => void;
  onClose: () => void;
  currentOutfitId?: string;
}

export function OutfitPicker({ outfits, items, onSelect, onClose, currentOutfitId }: OutfitPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentOutfitId || null);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  // Get items for an outfit
  const getOutfitItems = (outfit: Outfit): ClosetItem[] => {
    return outfit.item_ids
      .map(id => items.find(item => item.id === id))
      .filter((item): item is ClosetItem => !!item)
      .slice(0, 4);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-card border-t-2 border-strong rounded-t-3xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-strong">
          <h2 className="text-lg font-semibold">Choose an Outfit</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Outfit Grid */}
        <ScrollArea className="flex-1 min-h-0 overflow-auto">
          <div className="p-4">
            {outfits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No outfits yet.</p>
                <p className="text-sm mt-1">Create outfits first to plan them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {outfits.map((outfit) => {
                  const outfitItems = getOutfitItems(outfit);
                  const hasOutfitImage = !!outfit.image_url;
                  
                  return (
                    <motion.button
                      key={outfit.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedId(outfit.id)}
                      className={cn(
                        "relative rounded-xl border-2 overflow-hidden transition-all",
                        selectedId === outfit.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-strong hover:border-muted-foreground"
                      )}
                    >
                      {hasOutfitImage ? (
                        <img
                          src={outfit.image_url!}
                          alt={outfit.name || 'Outfit'}
                          loading="lazy"
                          decoding="async"
                          className="w-full aspect-square object-cover bg-secondary"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-secondary/30">
                          <div className={cn(
                            "grid h-full gap-0.5 p-1.5",
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
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <CategoryIcon 
                                      category={item.category} 
                                      size="md" 
                                      className="text-muted-foreground/50" 
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                            {outfitItems.length === 0 && (
                              <div className="col-span-2 row-span-2 flex items-center justify-center text-muted-foreground/50">
                                <span className="text-xs">No items</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                        <p className="text-white text-sm font-medium truncate">
                          {outfit.name || 'Untitled'}
                        </p>
                        {outfit.occasion && (
                          <p className="text-white/70 text-xs truncate">{outfit.occasion}</p>
                        )}
                      </div>

                      {/* Selected indicator */}
                      {selectedId === outfit.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-strong">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Confirm Button */}
        {outfits.length > 0 && (
          <div className="p-4 border-t-2 border-strong">
            <Button 
              className="w-full" 
              size="lg"
              disabled={!selectedId}
              onClick={handleConfirm}
            >
              Confirm Selection
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
