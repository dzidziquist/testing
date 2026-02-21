import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ClosetItem } from '@/types/closet';

interface AIStyleTipCardProps {
  unwornItems: ClosetItem[];
  weather?: {
    temp?: number;
    condition?: string;
  } | null;
  activeItems: ClosetItem[];
}

export function AIStyleTipCard({ unwornItems, weather, activeItems }: AIStyleTipCardProps) {
  const navigate = useNavigate();

  // Determine which tip to show
  const getTip = () => {
    // Priority 1: Weather-appropriate suggestion
    if (weather) {
      const isRainy = weather.condition?.toLowerCase().includes('rain');
      const isCold = weather.temp !== undefined && weather.temp < 15;
      const isHot = weather.temp !== undefined && weather.temp > 28;

      if (isRainy) {
        const hasRainwear = activeItems.some(i => 
          i.category === 'outerwear' && 
          (i.name.toLowerCase().includes('rain') || i.name.toLowerCase().includes('jacket'))
        );
        if (hasRainwear) {
          return {
            message: "Rain expected today—grab a water-resistant layer!",
            cta: "View Outerwear",
            action: () => navigate('/closet?category=outerwear'),
          };
        }
      }

      if (isCold) {
        const hasWarmLayers = activeItems.some(i => 
          i.category === 'outerwear' || 
          (i.season && i.season.includes('Winter'))
        );
        if (hasWarmLayers) {
          return {
            message: `It's ${weather.temp}°C—layer up with something cozy.`,
            cta: "View Layers",
            action: () => navigate('/closet?category=outerwear'),
          };
        }
      }

      if (isHot) {
        return {
          message: `It's ${weather.temp}°C—keep it light and breezy today.`,
          cta: "View Light Tops",
          action: () => navigate('/closet?category=tops'),
        };
      }
    }

    // Priority 2: Unworn items nudge
    if (unwornItems.length > 0) {
      const randomUnworn = unwornItems[Math.floor(Math.random() * Math.min(3, unwornItems.length))];
      return {
        message: `Your ${randomUnworn.name} hasn't been worn yet—today's the day!`,
        cta: "Create Outfit",
        action: () => navigate('/outfits/create'),
      };
    }

    // Priority 3: General tip
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 1) {
      return {
        message: "Start the week strong with a polished look.",
        cta: "Generate Outfit",
        action: () => navigate('/outfits/create'),
      };
    }

    if (dayOfWeek === 5) {
      return {
        message: "Friday vibes—dress for after-work plans!",
        cta: "Get Ideas",
        action: () => navigate('/outfits/create'),
      };
    }

    return null;
  };

  const tip = getTip();

  if (!tip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[hsl(var(--tip-bg))] rounded-xl p-4 border-2 border-[hsl(var(--tip-border))]"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[hsl(var(--tip-icon-bg))] flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-[hsl(var(--tip-text))]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[hsl(var(--tip-text))] mb-2">
            {tip.message}
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs text-[hsl(var(--tip-text-muted))] hover:bg-[hsl(var(--tip-icon-bg))]/50 -ml-2"
            onClick={tip.action}
          >
            {tip.cta}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
