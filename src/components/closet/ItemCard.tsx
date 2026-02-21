import { forwardRef } from 'react';
import { ClosetItem, STATUS_LABELS } from '@/types/closet';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CategoryIcon } from './CategoryIcon';
import { formatDistanceToNow } from 'date-fns';

interface ItemCardProps {
  item: ClosetItem;
  onClick?: () => void;
  selected?: boolean;
  showStatus?: boolean;
  compact?: boolean;
}

export const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(
  ({ item, onClick, selected, showStatus = false, compact = false }, ref) => {
    const lastWornText = item.last_worn_at 
      ? formatDistanceToNow(new Date(item.last_worn_at), { addSuffix: true })
      : null;

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "item-card card-interactive cursor-pointer",
          "border-2 transition-colors",
          selected ? "border-primary" : "border-strong",
          compact && "aspect-square"
        )}
        onClick={onClick}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-warm flex items-center justify-center">
            <CategoryIcon category={item.category} size="xl" className="text-muted-foreground" />
          </div>
        )}
        
        {/* Overlay with info */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent",
          compact ? "p-2" : "p-3"
        )}>
          <p className={cn("text-white font-medium truncate", compact ? "text-xs" : "text-sm")}>{item.name}</p>
          {!compact && (
            <p className="text-white/70 text-xs truncate">
              {lastWornText ? `Worn ${lastWornText}` : (item.brand || 'Never worn')}
            </p>
          )}
        </div>

        {/* Status indicator */}
        {showStatus && item.status !== 'active' && (
          <div className="absolute top-2 left-2">
            <span className="badge-subtle text-[10px]">
              {STATUS_LABELS[item.status]}
            </span>
          </div>
        )}

        {/* Wear count */}
        {item.wear_count > 0 && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span className="text-white text-[10px] font-medium">
              {item.wear_count}× worn
            </span>
          </div>
        )}

        {/* Selected indicator */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </motion.div>
    );
  }
);

ItemCard.displayName = 'ItemCard';

