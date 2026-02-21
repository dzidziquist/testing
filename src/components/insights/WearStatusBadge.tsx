import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type WearStatus = 'never-worn' | 'high-potential' | 'favorite' | 'regular';

interface WearStatusBadgeProps {
  wearCount: number;
  category?: string;
  className?: string;
}

export function getWearStatus(wearCount: number, category?: string): WearStatus {
  if (wearCount === 0) return 'never-worn';
  if (wearCount >= 10) return 'favorite';
  
  // High potential for items that are typically worn less frequently
  const lowWearCategories = ['outerwear', 'shoes', 'bags', 'jewelry', 'accessories'];
  if (wearCount <= 2 && category && lowWearCategories.includes(category)) {
    return 'high-potential';
  }
  
  return 'regular';
}

const statusConfig: Record<WearStatus, { label: string; className: string }> = {
  'never-worn': {
    label: 'Never Worn',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  'high-potential': {
    label: 'High Potential',
    className: 'bg-primary/10 text-primary border-primary/30',
  },
  'favorite': {
    label: 'Favorite',
    className: 'bg-accent/50 text-accent-foreground border-accent',
  },
  'regular': {
    label: 'Regular',
    className: 'bg-secondary text-secondary-foreground border-border',
  },
};

export function WearStatusBadge({ wearCount, category, className }: WearStatusBadgeProps) {
  const status = getWearStatus(wearCount, category);
  const config = statusConfig[status];

  if (status === 'regular') return null;

  return (
    <Badge 
      variant="outline" 
      className={cn('text-[10px] font-medium px-1.5 py-0 h-4 shrink-0', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
