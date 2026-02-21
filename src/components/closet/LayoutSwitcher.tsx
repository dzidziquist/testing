import { Grid2X2, Grid3X3, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type GridLayout = 2 | 3 | 4;

interface LayoutSwitcherProps {
  layout: GridLayout;
  onLayoutChange: (layout: GridLayout) => void;
}

const layouts: { value: GridLayout; icon: typeof Grid2X2; label: string }[] = [
  { value: 2, icon: Grid2X2, label: '2 columns' },
  { value: 3, icon: Grid3X3, label: '3 columns' },
  { value: 4, icon: LayoutGrid, label: '4 columns' },
];

export function LayoutSwitcher({ layout, onLayoutChange }: LayoutSwitcherProps) {
  return (
    <div className="flex items-center bg-secondary rounded-lg p-1 gap-0.5">
      {layouts.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onLayoutChange(value)}
          className={cn(
            "relative p-2 rounded-md transition-colors",
            layout === value 
              ? "text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={label}
        >
          {layout === value && (
            <motion.div
              layoutId="layout-indicator"
              className="absolute inset-0 bg-primary rounded-md"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <Icon className="w-4 h-4 relative z-10" />
        </button>
      ))}
    </div>
  );
}
