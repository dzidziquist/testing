import { motion } from 'framer-motion';
import { Grid2X2, LayoutGrid, Heart, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useClosetItems } from '@/hooks/useClosetItems';
import { useOutfits } from '@/hooks/useOutfits';
import { useWeather } from '@/hooks/useWeather';
import { ItemCard } from '@/components/closet/ItemCard';
import { Link, useNavigate } from 'react-router-dom';
import { RadialActionMenu } from '@/components/home/RadialActionMenu';
import { WeatherWidget } from '@/components/home/WeatherWidget';
import { DailyOutfitCard } from '@/components/home/DailyOutfitCard';
import { AIStyleTipCard } from '@/components/home/AIStyleTipCard';

export default function HomePage() {
  const { user, profile } = useAuth();
  const { items } = useClosetItems();
  const { outfits } = useOutfits();
  const { weather } = useWeather();
  const navigate = useNavigate();

  // Compute stats
  const activeItems = items.filter(i => i.status === 'active');
  const unwornItems = activeItems.filter(i => i.wear_count === 0);
  const unwornItemIds = unwornItems.map(i => i.id);
  const recentItems = activeItems.slice(0, 4);
  const wishlistCount = items.filter(i => i.status === 'wishlist').length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = profile?.display_name?.split(' ')[0] || 'there';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const getSubGreeting = () => {
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
      return "Ready to style your weekend?";
    }
    
    if (dayOfWeek === 1) {
      return "Let's start the week looking great!";
    }
    
    if (dayOfWeek === 5) {
      return "TGIF! What's the vibe today?";
    }
    
    return "What will you wear today?";
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-foreground flex items-center justify-center">
            <Shirt className="w-10 h-10 text-background" />
          </div>
          <h1 className="text-3xl font-bold mb-3">
            Welcome to Inukki
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Your intelligent wardrobe assistant. Sign in to organize your closet and get personalized outfit recommendations.
          </p>
          <Button asChild size="lg">
            <Link to="/auth">Get Started</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header Section - Personalized */}
      <motion.section 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-6"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-semibold">
              {getGreeting()}
            </h2>
            <p className="text-muted-foreground text-sm">
              {getSubGreeting()}
            </p>
          </div>
          <WeatherWidget />
        </div>
      </motion.section>

      {/* AI Style Tip - Conditional */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="px-4 mb-4"
      >
        <AIStyleTipCard 
          unwornItems={unwornItems}
          weather={weather}
          activeItems={activeItems}
        />
      </motion.section>

      {/* Today's AI Outfit - Primary CTA */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-header text-xl">Today's Look</h3>
        </div>
        <DailyOutfitCard 
          activeItemsCount={activeItems.length} 
          unwornItemIds={unwornItemIds}
        />
      </motion.section>

      {/* Quick Stats - Tappable Cards */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 mb-8"
      >
        <div className="grid grid-cols-3 gap-3">
          <motion.div 
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/closet')}
            className="bg-card rounded-xl p-4 border-2 border-strong text-center cursor-pointer hover:bg-secondary/50 transition-colors"
          >
            <Grid2X2 className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-semibold">{activeItems.length}</p>
            <p className="text-xs text-muted-foreground">Items</p>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/outfits')}
            className="bg-card rounded-xl p-4 border-2 border-strong text-center cursor-pointer hover:bg-secondary/50 transition-colors"
          >
            <LayoutGrid className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-semibold">{outfits.length}</p>
            <p className="text-xs text-muted-foreground">Outfits</p>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/closet?status=wishlist')}
            className="bg-card rounded-xl p-4 border-2 border-strong text-center cursor-pointer hover:bg-secondary/50 transition-colors"
          >
            <Heart className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-semibold">{wishlistCount}</p>
            <p className="text-xs text-muted-foreground">Wishlist</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-header text-xl">Recent Additions</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/closet">View All</Link>
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {recentItems.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item}
                onClick={() => navigate('/closet')}
                compact
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Radial Action Menu */}
      <RadialActionMenu />
    </div>
  );
}
