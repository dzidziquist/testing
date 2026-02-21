import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ItemCard } from '@/components/closet/ItemCard';
import { ClosetFilters } from '@/components/closet/ClosetFilters';
import { EditItemDialog } from '@/components/closet/EditItemDialog';
import { LayoutSwitcher } from '@/components/closet/LayoutSwitcher';
import { RadialActionMenu } from '@/components/home/RadialActionMenu';
import { useClosetItems } from '@/hooks/useClosetItems';
import { useGridLayout } from '@/hooks/useGridLayout';
import { ItemCategory, ItemStatus, ClosetItem } from '@/types/closet';

export default function ClosetPage() {
  const { items, loading } = useClosetItems();
  const { layout, setLayout } = useGridLayout();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  
  // Initialize filters from URL params
  const initialStatus = (searchParams.get('status') as ItemStatus) || 'active';
  const initialCategory = searchParams.get('category') as ItemCategory | null;
  
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>(initialStatus);
  const [selectedCategories, setSelectedCategories] = useState<ItemCategory[]>(
    initialCategory ? [initialCategory] : []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<ClosetItem | null>(null);

  // Get unique colors from items
  const uniqueColors = useMemo(() => {
    const colors = new Set<string>();
    items.forEach(item => {
      if (item.color) {
        colors.add(item.color.toLowerCase().trim());
      }
    });
    return Array.from(colors).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = search === '' || 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
      const matchesColor = selectedColors.length === 0 || 
        (item.color && selectedColors.includes(item.color.toLowerCase().trim()));
      return matchesSearch && matchesStatus && matchesCategory && matchesColor;
    });
  }, [items, search, selectedStatus, selectedCategories, selectedColors]);

  const statusCounts = useMemo(() => ({
    all: items.length,
    active: items.filter(i => i.status === 'active').length,
    wishlist: items.filter(i => i.status === 'wishlist').length,
    archived: items.filter(i => i.status === 'archived').length,
  }), [items]);

  return (
    <div className="pb-4">
      {/* Header with Layout Switcher */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="section-header">My Closet</h1>
          <LayoutSwitcher layout={layout} onLayoutChange={setLayout} />
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <ClosetFilters
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        selectedColors={selectedColors}
        onColorsChange={setSelectedColors}
        availableColors={uniqueColors}
        statusCounts={statusCounts}
      />

      {/* Items Grid */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className={`grid gap-3 ${
            layout === 2 ? 'grid-cols-2' : layout === 3 ? 'grid-cols-3' : 'grid-cols-4'
          }`}>
            {[...Array(layout * 2)].map((_, i) => (
              <div key={i} className="item-card bg-secondary animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-secondary border-2 border-strong flex items-center justify-center">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">
              {items.length === 0 ? 'Your closet is empty' : 'No items found'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {items.length === 0 
                ? 'Start by adding your first clothing item'
                : 'Try adjusting your filters'}
            </p>
            {items.length === 0 && (
              <Button asChild>
                <Link to="/closet/add">Add Item</Link>
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            layout
            className={`grid gap-3 ${
              layout === 2 ? 'grid-cols-2' : layout === 3 ? 'grid-cols-3' : 'grid-cols-4'
            }`}
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  showStatus={selectedStatus === 'all'}
                  compact={layout >= 3}
                  onClick={() => setEditingItem(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditItemDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      />

      {/* Radial Action Menu */}
      <RadialActionMenu />
    </div>
  );
}
