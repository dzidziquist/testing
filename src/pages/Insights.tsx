import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Calendar, Award, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClosetItems } from '@/hooks/useClosetItems';
import { useWearHistory } from '@/hooks/useWearHistory';
import { CATEGORY_LABELS } from '@/types/closet';
import { StyleAssistant } from '@/components/style/StyleAssistant';
import { CategoryIcon } from '@/components/closet/CategoryIcon';
import { AIRecommendationCard } from '@/components/insights/AIRecommendationCard';
import { InsightStatCard } from '@/components/insights/InsightStatCard';
import { CategoryBreakdownSection } from '@/components/insights/CategoryBreakdownSection';
import { StyleSpectrumSection } from '@/components/insights/StyleSpectrumSection';
import { WearStatusBadge } from '@/components/insights/WearStatusBadge';
import { RecentlyWornSection } from '@/components/insights/RecentlyWornSection';
export default function InsightsPage() {
  const navigate = useNavigate();
  const {
    items,
    refetch: refetchItems
  } = useClosetItems();
  const {
    history,
    updateWearEntry,
    deleteWearEntry
  } = useWearHistory();
  const [isStyleAssistantOpen, setIsStyleAssistantOpen] = useState(false);
  const activeItems = items.filter(i => i.status === 'active');
  const stats = useMemo(() => {
    // Most worn items
    const sortedByWear = [...activeItems].sort((a, b) => b.wear_count - a.wear_count);
    const mostWorn = sortedByWear.slice(0, 3);
    const neverWorn = activeItems.filter(i => i.wear_count === 0);

    // Category breakdown
    const categoryBreakdown = activeItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Average wear count by category
    const wearSumByCategory: Record<string, number> = {};
    const countByCategory: Record<string, number> = {};
    activeItems.forEach(item => {
      wearSumByCategory[item.category] = (wearSumByCategory[item.category] || 0) + item.wear_count;
      countByCategory[item.category] = (countByCategory[item.category] || 0) + 1;
    });
    const avgWearByCategory: Record<string, number> = {};
    Object.keys(wearSumByCategory).forEach(cat => {
      avgWearByCategory[cat] = wearSumByCategory[cat] / countByCategory[cat];
    });

    // Color breakdown
    const colorBreakdown = activeItems.reduce((acc, item) => {
      if (item.color) {
        acc[item.color] = (acc[item.color] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    const topColors = Object.entries(colorBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5) as [string, number][];

    // Total wears this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyWears = history.filter(h => new Date(h.worn_at) >= thisMonth).length;

    // Recently worn items (from wear history) with weather context
    const recentlyWorn = history.slice(0, 5).map(entry => {
      const entryItems = entry.item_ids.map(id => activeItems.find(item => item.id === id)).filter(Boolean) as typeof activeItems;
      return {
        id: entry.id,
        worn_at: entry.worn_at,
        notes: entry.notes,
        weather_conditions: entry.weather_conditions as {
          temp?: number;
          condition?: string;
        } | null,
        items: entryItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          image_url: item.image_url
        }))
      };
    }).filter(entry => entry.items.length > 0);
    return {
      mostWorn,
      neverWorn,
      categoryBreakdown,
      avgWearByCategory,
      topColors,
      monthlyWears,
      totalItems: activeItems.length,
      totalWears: activeItems.reduce((sum, i) => sum + i.wear_count, 0),
      recentlyWorn
    };
  }, [activeItems, history]);
  const handleCreateOutfitForUnworn = () => {
    navigate('/outfits/create');
  };
  return <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <h1 className="section-header mb-2">Style Insights</h1>
        <p className="text-muted-foreground text-sm">
          Understand your wardrobe habits
        </p>
      </div>

      {/* AI Recommendation Card */}
      <section className="px-4 mb-6">
        <AIRecommendationCard unwornItems={stats.neverWorn} />
      </section>

      {/* Quick Stats - Renamed to be more human */}
      <motion.section initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} className="px-4 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <InsightStatCard label="Closet Size" value={stats.totalItems} icon={Package} index={0} />
          <InsightStatCard label="Unworn Items" value={stats.neverWorn.length} icon={AlertTriangle} index={1} highlight={stats.neverWorn.length > 0} ctaLabel="Create outfits" onCtaClick={handleCreateOutfitForUnworn} />
          <InsightStatCard label="Total Wears" value={stats.totalWears} icon={Calendar} index={2} />
          <InsightStatCard label="This Month" value={stats.monthlyWears} icon={Calendar} index={3} />
        </div>
      </motion.section>

      {/* Recently Worn - Now with contextual info */}
      <RecentlyWornSection recentlyWorn={stats.recentlyWorn} onUpdate={async (id, updates) => {
      await updateWearEntry(id, updates);
    }} onDelete={async id => {
      await deleteWearEntry(id);
      // Refetch items to update wear counts in Most Worn section
      await refetchItems();
    }} />

      {/* Most Worn with Status Badges */}
      <motion.section initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.15
    }} className="px-4 mb-8">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-muted-foreground text-sm">
          <Award className="w-5 h-5" style={{
          color: 'hsl(var(--gold))'
        }} />
          Most Worn
        </h2>
        {stats.mostWorn.length > 0 ? <div className="space-y-2">
            {stats.mostWorn.map((item, index) => <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border-2 border-strong">
                <div className="relative">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <CategoryIcon category={item.category} className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{
              background: 'hsl(var(--gold))',
              color: 'white'
            }}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate max-w-[140px]">{item.name}</p>
                    <WearStatusBadge wearCount={item.wear_count} category={item.category} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.brand || CATEGORY_LABELS[item.category]}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{item.wear_count}</p>
                  <p className="text-xs text-muted-foreground">wears</p>
                </div>
              </div>)}
          </div> : <p className="text-sm text-muted-foreground bg-card rounded-xl p-4 border-2 border-strong">
            Start wearing items to see your favorites here
          </p>}
      </motion.section>

      {/* Category Breakdown - Now tappable with labels */}
      <CategoryBreakdownSection categoryBreakdown={stats.categoryBreakdown} totalItems={stats.totalItems} avgWearByCategory={stats.avgWearByCategory} />

      {/* Style Spectrum (renamed from Your Color Palette) */}
      <StyleSpectrumSection topColors={stats.topColors} totalItems={stats.totalItems} />

      {/* Floating AI Style Assistant Button */}
      <motion.button initial={{
      scale: 0,
      opacity: 0
    }} animate={{
      scale: 1,
      opacity: 1
    }} transition={{
      delay: 0.5,
      type: 'spring',
      stiffness: 260,
      damping: 20
    }} onClick={() => setIsStyleAssistantOpen(true)} className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground border-2 border-strong shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50" aria-label="Open AI Style Assistant">
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Style Assistant Modal */}
      <StyleAssistant isOpen={isStyleAssistantOpen} onClose={() => setIsStyleAssistantOpen(false)} />
    </div>;
}