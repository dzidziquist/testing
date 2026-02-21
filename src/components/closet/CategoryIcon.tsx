import { 
  Shirt, 
  SwatchBook, 
  Sparkles as DressIcon, 
  Cloudy, 
  Footprints, 
  Watch, 
  ShoppingBag, 
  Gem, 
  Dumbbell, 
  Waves, 
  Moon, 
  Box,
  LucideIcon
} from 'lucide-react';
import { ItemCategory } from '@/types/closet';
import { cn } from '@/lib/utils';

const CATEGORY_ICON_MAP: Record<ItemCategory, LucideIcon> = {
  tops: Shirt,
  bottoms: SwatchBook,
  dresses: DressIcon,
  outerwear: Cloudy,
  shoes: Footprints,
  accessories: Watch,
  bags: ShoppingBag,
  jewelry: Gem,
  activewear: Dumbbell,
  swimwear: Waves,
  sleepwear: Moon,
  other: Box,
};

interface CategoryIconProps {
  category: ItemCategory;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function CategoryIcon({ category, className, size = 'md' }: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[category];
  return <Icon className={cn(sizeClasses[size], className)} />;
}

export { CATEGORY_ICON_MAP };
