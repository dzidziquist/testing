import { motion } from 'framer-motion';
import { Shirt, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ItemCategory, CATEGORY_LABELS } from '@/types/closet';
import { CategoryIcon } from '@/components/closet/CategoryIcon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
interface CategoryBreakdownSectionProps {
  categoryBreakdown: Record<string, number>;
  totalItems: number;
  avgWearByCategory: Record<string, number>;
}
type CategoryLabel = 'Most owned' | 'Underused' | 'Well-loved' | null;
function getCategoryLabel(category: string, count: number, maxCount: number, avgWear: number): CategoryLabel {
  if (count === maxCount) return 'Most owned';
  if (avgWear < 2 && count >= 3) return 'Underused';
  if (avgWear >= 5) return 'Well-loved';
  return null;
}
export function CategoryBreakdownSection({
  categoryBreakdown,
  totalItems,
  avgWearByCategory
}: CategoryBreakdownSectionProps) {
  const navigate = useNavigate();
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;
  const handleCategoryClick = (category: string) => {
    navigate(`/closet?category=${category}`);
  };
  return <motion.section initial={{
    opacity: 0,
    y: 10
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    delay: 0.2
  }} className="px-4 mb-8">
      <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Shirt className="w-5 h-5 text-muted-foreground" />
        Category Breakdown
      </h2>
      <div className="bg-card rounded-xl border-2 border-strong overflow-hidden">
        <div className="divide-y divide-border">
          {sortedCategories.map(([category, count]) => {
          const percentage = count / totalItems * 100;
          const avgWear = avgWearByCategory[category] || 0;
          const label = getCategoryLabel(category, count, maxCount, avgWear);
          return <button key={category} onClick={() => handleCategoryClick(category)} className="w-full p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left">
                <CategoryIcon category={category as ItemCategory} className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                    </span>
                    {label && <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-medium shrink-0", label === 'Most owned' && 'bg-primary/10 text-primary border-primary/30', label === 'Underused' && 'bg-destructive/10 text-destructive border-destructive/30', label === 'Well-loved' && 'bg-accent/50 text-accent-foreground border-accent')}>
                        {label}
                      </Badge>}
                  </div>
                  <div className="progress-bar h-1.5">
                    <motion.div initial={{
                  width: 0
                }} animate={{
                  width: `${percentage}%`
                }} transition={{
                  duration: 0.5,
                  delay: 0.3
                }} className="progress-bar-fill" />
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground shrink-0">
                  {count}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>;
        })}
        </div>
      </div>
    </motion.section>;
}