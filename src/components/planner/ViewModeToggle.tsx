import { cn } from '@/lib/utils';
import { Calendar, CalendarDays } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'week' | 'month';
  onToggle: (mode: 'week' | 'month') => void;
}

export function ViewModeToggle({ viewMode, onToggle }: ViewModeToggleProps) {
  return (
    <div className="flex bg-secondary rounded-lg p-1 border-2 border-strong">
      <button
        onClick={() => onToggle('week')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
          viewMode === 'week'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        Week
      </button>
      <button
        onClick={() => onToggle('month')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
          viewMode === 'month'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Calendar className="w-3.5 h-3.5" />
        Month
      </button>
    </div>
  );
}
