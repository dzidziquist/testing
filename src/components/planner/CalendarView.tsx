import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isBefore, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addDays, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CalendarViewProps {
  viewMode: 'week' | 'month';
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  hasPlannedOutfit: (date: Date) => boolean;
  isWorn: (date: Date) => boolean;
}

export function CalendarView({ 
  viewMode,
  currentMonth,
  selectedDate, 
  onSelectDate, 
  hasPlannedOutfit,
  isWorn 
}: CalendarViewProps) {
  const days = useMemo(() => {
    if (viewMode === 'week') {
      // Show 7 days starting from the Monday of the selected week
      const dayOfWeek = getDay(selectedDate);
      const startOfWeek = addDays(selectedDate, -dayOfWeek);
      return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
    } else {
      // Month view
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const monthDays = eachDayOfInterval({ start, end });
      
      // Add padding days for proper grid alignment
      const startDayOfWeek = getDay(start);
      const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => 
        addDays(start, -(startDayOfWeek - i))
      );
      
      return [...paddingDays, ...monthDays];
    }
  }, [viewMode, currentMonth, selectedDate]);

  if (viewMode === 'week') {
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {days.map((day, index) => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const hasOutfit = hasPlannedOutfit(day);
          const worn = isWorn(day);
          const isPast = isBefore(startOfDay(day), startOfDay(new Date())) && !isToday(day);

          return (
            <motion.button
              key={day.toISOString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex flex-col items-center min-w-[4.5rem] py-3 px-2 rounded-xl border-2 transition-all relative",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-strong hover:bg-secondary",
                isPast && !isSelected && "opacity-60"
              )}
            >
              <span className="text-[10px] uppercase tracking-wide font-medium opacity-70">
                {isToday(day) ? 'Today' : format(day, 'EEE')}
              </span>
              <span className="text-lg font-bold mt-0.5">
                {format(day, 'd')}
              </span>
              <span className="text-[10px] opacity-70">
                {format(day, 'MMM')}
              </span>
              
              {hasOutfit && (
                <div className={cn(
                  "absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center",
                  worn 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-accent border-2 border-strong"
                )}>
                  {worn && <Check className="w-3 h-3" />}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Month view
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="space-y-2">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const hasOutfit = hasPlannedOutfit(day);
          const worn = isWorn(day);
          const isPast = isBefore(startOfDay(day), startOfDay(new Date())) && !isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <motion.button
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-lg border transition-all text-sm",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-transparent hover:bg-secondary",
                !isCurrentMonth && "opacity-30",
                isPast && isCurrentMonth && !isSelected && "opacity-50",
                isToday(day) && !isSelected && "border-primary/50 border-2"
              )}
            >
              <span className={cn(
                "font-medium",
                isToday(day) && !isSelected && "text-primary"
              )}>
                {format(day, 'd')}
              </span>
              
              {hasOutfit && isCurrentMonth && (
                <div className={cn(
                  "absolute bottom-0.5 w-4 h-1 rounded-full",
                  worn 
                    ? "bg-primary" 
                    : isSelected ? "bg-primary-foreground/70" : "bg-muted-foreground"
                )} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
