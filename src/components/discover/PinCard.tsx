import { motion } from 'framer-motion';
import { ExternalLink, Heart, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface PinCardData {
  name: string;
  category?: string;
  description?: string;
  whyItWorks?: string;
  searchTerm?: string;
  imageQuery?: string;
  items?: string[];
  occasion?: string;
  style?: string;
  reason?: string;
  priceRange?: string;
}

interface PinCardProps {
  id: string;
  itemType: 'trend' | 'outfit' | 'shop';
  title: string;
  subtitle: string;
  badge?: string;
  imageQuery: string;
  index: number;
  link?: string;
  showActions?: boolean;
  likedIds: Set<string>;
  savedIds: Set<string>;
  itemData: PinCardData;
  onToggleLike: (id: string, type: 'trend' | 'outfit' | 'shop', data: PinCardData) => void;
  onToggleSave: (id: string, type: 'trend' | 'outfit' | 'shop', data: PinCardData) => void;
}

// Generate placeholder with gradient backgrounds
const getPlaceholderImage = (query: string, index: number) => {
  // Use picsum for varied placeholder images
  const seed = query.length + index * 100;
  return `https://picsum.photos/seed/${seed}/400/${300 + (index % 4) * 50}`;
};

export function PinCard({ 
  id, 
  itemType,
  title, 
  subtitle, 
  badge, 
  imageQuery, 
  index,
  link,
  showActions = true,
  likedIds,
  savedIds,
  itemData,
  onToggleLike,
  onToggleSave,
}: PinCardProps) {
  const heights = ['h-48', 'h-56', 'h-64', 'h-72'];
  const height = heights[index % heights.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="break-inside-avoid mb-4"
    >
      <div className="bg-card rounded-xl overflow-hidden border-2 border-strong hover:shadow-md transition-shadow group">
        <div className={`${height} bg-secondary relative overflow-hidden`}>
          <img 
            src={getPlaceholderImage(imageQuery, index)} 
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {showActions && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onToggleSave(id, itemType, itemData)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    savedIds.has(id) ? 'bg-primary text-primary-foreground' : 'bg-card/90 text-foreground'
                  }`}
                >
                  <Bookmark className="w-4 h-4" fill={savedIds.has(id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          )}
          {badge && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-xs">
                {badge}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{subtitle}</p>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
            >
              Shop now <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {showActions && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t-2 border-strong">
              <button 
                onClick={() => onToggleLike(id, itemType, itemData)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Heart className={`w-3.5 h-3.5 ${likedIds.has(id) ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{likedIds.has(id) ? 'Liked' : 'Like'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}