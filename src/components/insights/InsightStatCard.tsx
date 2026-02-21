import { motion } from 'framer-motion';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InsightStatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  index: number;
  ctaLabel?: string;
  onCtaClick?: () => void;
  highlight?: boolean;
}

export function InsightStatCard({ 
  label, 
  value, 
  icon: Icon, 
  index,
  ctaLabel,
  onCtaClick,
  highlight,
}: InsightStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-card rounded-xl p-4 border-2 border-strong",
        highlight && "ring-1 ring-primary/20"
      )}
    >
      <Icon className="w-5 h-5 text-foreground mb-2" />
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      {ctaLabel && onCtaClick && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-primary hover:text-primary"
          onClick={onCtaClick}
        >
          {ctaLabel}
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </motion.div>
  );
}
