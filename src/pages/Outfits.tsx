import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { OutfitCard } from '@/components/closet/OutfitCard';
import { EditOutfitDialog } from '@/components/closet/EditOutfitDialog';
import { LayoutSwitcher } from '@/components/closet/LayoutSwitcher';
import { useOutfits } from '@/hooks/useOutfits';
import { useClosetItems } from '@/hooks/useClosetItems';
import { useGridLayout } from '@/hooks/useGridLayout';
import { Outfit } from '@/types/closet';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'saved' | 'ai';

export default function OutfitsPage() {
  const { outfits, loading } = useOutfits();
  const { items } = useClosetItems();
  const { layout, setLayout } = useGridLayout();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);

  const filteredOutfits = useMemo(() => {
    return outfits.filter((outfit) => {
      if (filter === 'ai') return outfit.is_ai_generated;
      if (filter === 'saved') return !outfit.is_ai_generated;
      return true;
    });
  }, [outfits, filter]);

  const getOutfitItems = (itemIds: string[]) => {
    return items.filter(item => itemIds.includes(item.id));
  };

  const gridClasses = {
    2: 'grid-cols-2 gap-4',
    3: 'grid-cols-3 gap-3',
    4: 'grid-cols-4 gap-2',
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Outfits</h1>
          <LayoutSwitcher layout={layout} onLayoutChange={setLayout} />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all' as FilterType, label: 'All' },
            { id: 'saved' as FilterType, label: 'Saved' },
            { id: 'ai' as FilterType, label: 'Styled for You', icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                filter === tab.id 
                  ? "bg-primary text-primary-foreground border-transparent" 
                  : "bg-background text-foreground border-strong hover:bg-secondary"
              )}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Outfits Grid */}
      <div className="px-4">
        {loading ? (
          <div className={cn("grid", gridClasses[layout])}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-secondary/50 rounded-xl border-2 border-strong animate-pulse" />
            ))}
          </div>
        ) : filteredOutfits.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-secondary/50 border-2 border-strong flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {outfits.length === 0 ? 'No outfits yet' : 'No outfits found'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[240px] mx-auto">
              {outfits.length === 0 
                ? 'Create your first outfit or let AI suggest one for you'
                : 'Try adjusting your filter'}
            </p>
            {outfits.length === 0 && (
              <div className="flex gap-3 justify-center">
                <Button asChild size="lg">
                  <Link to="/outfits/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Outfit
                  </Link>
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div layout className={cn("grid", gridClasses[layout])}>
            <AnimatePresence mode="popLayout">
              {filteredOutfits.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  items={getOutfitItems(outfit.item_ids)}
                  onClick={() => setSelectedOutfit(outfit)}
                  compact={layout >= 3}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* FAB */}
      <Link 
        to="/outfits/create" 
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full border-2 border-strong flex items-center justify-center hover:scale-105 transition-transform z-50"
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* Edit Dialog */}
      {selectedOutfit && (
        <EditOutfitDialog
          outfit={selectedOutfit}
          items={getOutfitItems(selectedOutfit.item_ids)}
          isOpen={!!selectedOutfit}
          onClose={() => setSelectedOutfit(null)}
        />
      )}
    </div>
  );
}