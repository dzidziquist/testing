import { motion } from 'framer-motion';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { ClosetItem } from '@/types/closet';
import { Button } from '@/components/ui/button';

interface OutfitImageGridProps {
  items: ClosetItem[];
  shoppingLinks?: { name: string; url: string; store: string }[];
}

export function OutfitImageGrid({ items, shoppingLinks }: OutfitImageGridProps) {
  if (items.length === 0 && (!shoppingLinks || shoppingLinks.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      {/* Outfit Items Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {items.slice(0, 6).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative aspect-square rounded-lg overflow-hidden bg-secondary"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  {getCategoryEmoji(item.category)}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <p className="text-[10px] text-white font-medium truncate">
                  {item.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Shopping Suggestions */}
      {shoppingLinks && shoppingLinks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />
            Where to buy
          </p>
          <div className="flex flex-wrap gap-2">
            {shoppingLinks.map((link, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => window.open(link.url, '_blank')}
              >
                {link.store}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    tops: '👕',
    bottoms: '👖',
    dresses: '👗',
    outerwear: '🧥',
    shoes: '👟',
    accessories: '🧣',
    bags: '👜',
    jewelry: '💍',
    activewear: '🏃',
    swimwear: '🩱',
    sleepwear: '🛏️',
    other: '📦',
  };
  return emojiMap[category] || '👔';
}
