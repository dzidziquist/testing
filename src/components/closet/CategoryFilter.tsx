import { ItemCategory, CATEGORY_LABELS } from '@/types/closet';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CategoryIcon } from './CategoryIcon';

interface CategoryFilterProps {
  selected: ItemCategory | 'all';
  onSelect: (category: ItemCategory | 'all') => void;
}

const categories: (ItemCategory | 'all')[] = [
  'all',
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'bags',
  'jewelry',
  'activewear',
  'swimwear',
  'sleepwear',
  'other',
];

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="pill-nav px-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            "pill-nav-item relative",
            selected === category && "active"
          )}
        >
          {selected === category && (
            <motion.div
              layoutId="category-pill"
              className="absolute inset-0 bg-primary rounded-full"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {category !== 'all' && (
              <CategoryIcon category={category as ItemCategory} size="sm" />
            )}
            {category === 'all' ? 'All' : CATEGORY_LABELS[category as ItemCategory]}
          </span>
        </button>
      ))}
    </div>
  );
}
