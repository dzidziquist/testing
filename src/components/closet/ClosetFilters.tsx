import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Check } from 'lucide-react';
import { ItemCategory, ItemStatus, CATEGORY_LABELS, STATUS_LABELS } from '@/types/closet';
import { CategoryIcon } from './CategoryIcon';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

// Comprehensive color map with hex values for accurate display
const colorMap: Record<string, string> = {
  // Neutrals
  black: '#1a1a1a',
  white: '#f5f5f5',
  ivory: '#fffff0',
  cream: '#fffdd0',
  offwhite: '#faf9f6',
  'off-white': '#faf9f6',
  
  // Grays
  grey: '#6b7280',
  gray: '#6b7280',
  'light grey': '#d1d5db',
  'light gray': '#d1d5db',
  'dark grey': '#374151',
  'dark gray': '#374151',
  charcoal: '#36454f',
  silver: '#c0c0c0',
  slate: '#708090',
  ash: '#b2beb5',
  
  // Blues
  navy: '#1e3a5f',
  blue: '#3b82f6',
  'light blue': '#93c5fd',
  'dark blue': '#1e40af',
  cobalt: '#0047ab',
  royal: '#4169e1',
  sky: '#87ceeb',
  teal: '#14b8a6',
  turquoise: '#40e0d0',
  aqua: '#00ffff',
  cyan: '#00bcd4',
  denim: '#1560bd',
  indigo: '#4b0082',
  
  // Reds
  red: '#ef4444',
  'dark red': '#991b1b',
  burgundy: '#800020',
  maroon: '#800000',
  wine: '#722f37',
  crimson: '#dc143c',
  scarlet: '#ff2400',
  ruby: '#e0115f',
  cherry: '#de3163',
  
  // Pinks
  pink: '#ec4899',
  'light pink': '#fbcfe8',
  'hot pink': '#ff69b4',
  blush: '#de5d83',
  rose: '#ff007f',
  salmon: '#fa8072',
  coral: '#ff7f50',
  peach: '#ffcba4',
  magenta: '#ff00ff',
  fuchsia: '#ff00ff',
  
  // Greens
  green: '#22c55e',
  'dark green': '#166534',
  'light green': '#90ee90',
  'olive green': '#808000',
  olive: '#808000',
  forest: '#228b22',
  emerald: '#50c878',
  jade: '#00a86b',
  mint: '#98fb98',
  sage: '#9dc183',
  lime: '#32cd32',
  hunter: '#355e3b',
  army: '#4b5320',
  
  // Yellows
  yellow: '#eab308',
  mustard: '#d4a017',
  gold: '#ffd700',
  lemon: '#fff44f',
  canary: '#ffef00',
  
  // Oranges
  orange: '#f97316',
  tangerine: '#ff9966',
  rust: '#b7410e',
  terracotta: '#e2725b',
  copper: '#b87333',
  bronze: '#cd7f32',
  apricot: '#fbceb1',
  
  // Purples
  purple: '#a855f7',
  lavender: '#e6e6fa',
  violet: '#8b5cf6',
  plum: '#dda0dd',
  mauve: '#e0b0ff',
  lilac: '#c8a2c8',
  grape: '#6f2da8',
  amethyst: '#9966cc',
  eggplant: '#614051',
  
  // Browns
  brown: '#92400e',
  chestnut: '#954535',
  chocolate: '#7b3f00',
  espresso: '#3c2415',
  coffee: '#6f4e37',
  mocha: '#967969',
  tan: '#d2b48c',
  camel: '#c19a6b',
  khaki: '#c3b091',
  beige: '#f5f5dc',
  nude: '#e3bc9a',
  mahogany: '#c04000',
  auburn: '#a52a2a',
  cinnamon: '#d2691e',
  sienna: '#a0522d',
  umber: '#635147',
  taupe: '#483c32',
  sand: '#c2b280',
  caramel: '#ffd59a',
  cognac: '#9a463d',
  walnut: '#773f1a',
};

function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  
  if (colorMap[normalized]) return colorMap[normalized];
  
  // Try partial matching
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  
  return '#9ca3af'; // Default gray
}

// Check if a color needs a border (light colors that blend with backgrounds)
function needsBorder(colorName: string): boolean {
  const lightColors = ['white', 'cream', 'ivory', 'offwhite', 'off-white', 'beige', 'light pink', 'light blue', 'light green', 'light grey', 'light gray', 'lavender', 'mint', 'peach', 'lemon', 'canary', 'apricot', 'nude', 'sand', 'caramel'];
  const normalized = colorName.toLowerCase().trim();
  return lightColors.some(c => normalized.includes(c) || c.includes(normalized));
}

const categories: ItemCategory[] = [
  'tops', 'bottoms', 'dresses', 'outerwear', 'shoes',
  'accessories', 'bags', 'jewelry', 'activewear', 'swimwear', 'sleepwear', 'other',
];

interface ClosetFiltersProps {
  selectedStatus: ItemStatus | 'all';
  onStatusChange: (status: ItemStatus | 'all') => void;
  selectedCategories: ItemCategory[];
  onCategoriesChange: (categories: ItemCategory[]) => void;
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  availableColors: string[];
  statusCounts: Record<string, number>;
}

export function ClosetFilters({
  selectedStatus,
  onStatusChange,
  selectedCategories,
  onCategoriesChange,
  selectedColors,
  onColorsChange,
  availableColors,
  statusCounts,
}: ClosetFiltersProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

  const toggleCategory = (category: ItemCategory) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      onColorsChange(selectedColors.filter(c => c !== color));
    } else {
      onColorsChange([...selectedColors, color]);
    }
  };

  const clearAllFilters = () => {
    onCategoriesChange([]);
    onColorsChange([]);
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedColors.length > 0;

  return (
    <div className="space-y-2">
      {/* Status Tabs - Minimal pill style */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
        {(['all', 'active', 'wishlist', 'archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              selectedStatus === status 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {status === 'all' ? 'All' : STATUS_LABELS[status]}
            <span className="text-xs opacity-60">
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Dropdowns - Compact inline style */}
      <div className="flex items-center gap-1.5 px-4">
        {/* Category Dropdown */}
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1 px-2.5 rounded-lg text-xs font-medium",
                selectedCategories.length > 0 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Category
              {selectedCategories.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {selectedCategories.length}
                </span>
              )}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1.5" align="start">
            <div className="grid grid-cols-2 gap-0.5">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <CategoryIcon category={category} size="sm" />
                    <span className="flex-1 truncate">{CATEGORY_LABELS[category]}</span>
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {selectedCategories.length > 0 && (
              <button
                className="w-full mt-1 py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onCategoriesChange([])}
              >
                Clear
              </button>
            )}
          </PopoverContent>
        </Popover>

        {/* Color Dropdown */}
        {availableColors.length > 0 && (
          <Popover open={colorOpen} onOpenChange={setColorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1 px-2.5 rounded-lg text-xs font-medium",
                  selectedColors.length > 0 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Color
                {selectedColors.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {selectedColors.length}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1.5" align="start">
              <div className="grid grid-cols-2 gap-0.5 max-h-48 overflow-y-auto">
                {availableColors.map((color) => {
                  const isSelected = selectedColors.includes(color);
                  return (
                    <button
                      key={color}
                      onClick={() => toggleColor(color)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <span 
                        className={cn("w-3.5 h-3.5 rounded-full shrink-0", needsBorder(color) && "border border-border")} 
                        style={{ backgroundColor: getColorHex(color) }}
                      />
                      <span className="flex-1 capitalize text-[11px] leading-tight">{color}</span>
                      {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {selectedColors.length > 0 && (
                <button
                  className="w-full mt-1 py-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onColorsChange([])}
                >
                  Clear
                </button>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Clear All - Only show when filters active */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              onClick={clearAllFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filter Tags - Compact chips */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className="flex flex-wrap gap-1">
              {selectedCategories.map((category) => (
                <motion.button
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => toggleCategory(category)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
                >
                  <CategoryIcon category={category} size="sm" />
                  {CATEGORY_LABELS[category]}
                  <X className="w-2.5 h-2.5 opacity-50" />
                </motion.button>
              ))}
              {selectedColors.map((color) => (
                <motion.button
                  key={color}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => toggleColor(color)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
                >
                  <span 
                    className={cn("w-2.5 h-2.5 rounded-full", needsBorder(color) && "border border-border")} 
                    style={{ backgroundColor: getColorHex(color) }}
                  />
                  <span className="capitalize">{color}</span>
                  <X className="w-2.5 h-2.5 opacity-50" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
