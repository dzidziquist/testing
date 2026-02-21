import { motion } from 'framer-motion';
import { CalendarPlus, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isToday, isBefore, startOfDay } from 'date-fns';

interface EmptyDayCardProps {
  selectedDate: Date;
  onPlanOutfit: () => void;
}

export function EmptyDayCard({ selectedDate, onPlanOutfit }: EmptyDayCardProps) {
  const isPast = isBefore(startOfDay(selectedDate), startOfDay(new Date())) && !isToday(selectedDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border-2 border-strong p-8 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-secondary border-2 border-strong flex items-center justify-center">
        <Shirt className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="font-semibold text-lg mb-1">
        {isPast ? 'No outfit recorded' : 'No outfit planned'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {isPast 
          ? `You didn't plan an outfit for ${format(selectedDate, 'EEEE, MMM d')}`
          : isToday(selectedDate)
            ? "Plan what you'll wear today"
            : `Plan your outfit for ${format(selectedDate, 'EEEE, MMM d')}`
        }
      </p>

      {!isPast && (
        <Button onClick={onPlanOutfit} className="rounded-full px-6">
          <CalendarPlus className="w-4 h-4 mr-2" />
          Plan Outfit
        </Button>
      )}
    </motion.div>
  );
}
