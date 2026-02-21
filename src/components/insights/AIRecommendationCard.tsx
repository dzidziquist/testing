import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/closet/CategoryIcon';
import { ClosetItem } from '@/types/closet';
interface AIRecommendationCardProps {
  unwornItems: ClosetItem[];
}
export function AIRecommendationCard({
  unwornItems
}: AIRecommendationCardProps) {
  const navigate = useNavigate();
  const featuredItems = unwornItems.slice(0, 3);
  const hasUnworn = unwornItems.length > 0;
  const handleCreateOutfit = () => {
    navigate('/outfits/create');
  };
  if (!hasUnworn) {
    return <motion.div initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-5 border-2 border-strong">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-primary">Great Job!</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          You've worn everything in your closet. Keep styling!
        </p>
      </motion.div>;
  }
  return <motion.div initial={{
    opacity: 0,
    y: 10
  }} animate={{
    opacity: 1,
    y: 0
  }} className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-5 border-2 border-strong">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Recommendation</h3>
        </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        You have <span className="font-semibold text-foreground">{unwornItems.length} unworn items</span> waiting to shine. Let's put them to use!
      </p>

      {/* Featured unworn items */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-2">
          {featuredItems.map((item, idx) => <div key={item.id} className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex items-center justify-center border-2 border-strong" style={{
          zIndex: 3 - idx
        }}>
              {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <CategoryIcon category={item.category} className="w-5 h-5 text-muted-foreground" />}
            </div>)}
          {unwornItems.length > 3 && <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center border-2 border-strong text-xs font-medium text-muted-foreground">
              +{unwornItems.length - 3}
            </div>}
        </div>
        <span className="text-xs text-muted-foreground">
          {featuredItems.map(i => i.name).slice(0, 2).join(', ')}
          {featuredItems.length > 2 && '...'}
        </span>
      </div>

      <Button onClick={handleCreateOutfit} className="w-full" size="sm">
        Generate Outfit
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>;
}