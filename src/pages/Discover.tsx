import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ShoppingBag, Lightbulb, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useClosetItems } from '@/hooks/useClosetItems';
import { useOutfits } from '@/hooks/useOutfits';
import { useDiscoverContent } from '@/hooks/useDiscoverContent';
import { useSavedDiscoverItems } from '@/hooks/useSavedDiscoverItems';
import { PinCard, PinCardData } from '@/components/discover/PinCard';
import { MasonryGrid } from '@/components/discover/MasonryGrid';

type TabType = 'foryou' | 'trends' | 'outfits' | 'shop';

export default function DiscoverPage() {
  const { items } = useClosetItems();
  const { outfits } = useOutfits();
  const { content, loading, error, hasGenerated, generateContent } = useDiscoverContent();
  const { likedIds, savedIds, toggleLike, toggleSave } = useSavedDiscoverItems();
  const [activeTab, setActiveTab] = useState<TabType>('foryou');
  const [searchQuery, setSearchQuery] = useState('');

  const activeItems = items.filter(item => item.status === 'active');
  const wishlistItems = items.filter(item => item.status === 'wishlist');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'foryou', label: 'For You', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'trends', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'outfits', label: 'Outfits', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'shop', label: 'Shop', icon: <ShoppingBag className="w-4 h-4" /> },
  ];

  const handleGenerate = () => {
    generateContent(activeItems, outfits, wishlistItems);
  };

  const handleToggleLike = (id: string, type: 'trend' | 'outfit' | 'shop', data: PinCardData) => {
    toggleLike(id, type, data);
  };

  const handleToggleSave = (id: string, type: 'trend' | 'outfit' | 'shop', data: PinCardData) => {
    toggleSave(id, type, data);
  };

  const renderContent = () => {
    if (!content) return null;

    switch (activeTab) {
      case 'foryou':
        // Mix all content types for the "For You" feed
        const mixedContent = [
          ...content.trends.map((t, i) => ({ type: 'trend' as const, data: t, index: i })),
          ...content.outfitIdeas.map((o, i) => ({ type: 'outfit' as const, data: o, index: i })),
          ...(content.shoppingPicks?.map((s, i) => ({ type: 'shop' as const, data: s, index: i })) || []),
        ].sort(() => Math.random() - 0.5);

        return (
          <MasonryGrid>
            {mixedContent.map((item, idx) => {
              if (item.type === 'trend') {
                const itemData: PinCardData = item.data;
                return (
                  <PinCard
                    key={`trend-${idx}`}
                    id={`trend-${idx}`}
                    itemType="trend"
                    title={item.data.name}
                    subtitle={item.data.whyItWorks}
                    badge={item.data.category}
                    imageQuery={item.data.imageQuery || item.data.name}
                    index={idx}
                    link={item.data.searchTerm ? `https://www.google.com/search?q=${encodeURIComponent(item.data.searchTerm + ' buy')}&tbm=shop` : undefined}
                    likedIds={likedIds}
                    savedIds={savedIds}
                    itemData={itemData}
                    onToggleLike={handleToggleLike}
                    onToggleSave={handleToggleSave}
                  />
                );
              } else if (item.type === 'outfit') {
                const itemData: PinCardData = item.data;
                return (
                  <PinCard
                    key={`outfit-${idx}`}
                    id={`outfit-${idx}`}
                    itemType="outfit"
                    title={item.data.name}
                    subtitle={item.data.description}
                    badge={item.data.occasion}
                    imageQuery={item.data.style || item.data.name}
                    index={idx}
                    likedIds={likedIds}
                    savedIds={savedIds}
                    itemData={itemData}
                    onToggleLike={handleToggleLike}
                    onToggleSave={handleToggleSave}
                  />
                );
              } else {
                const itemData: PinCardData = item.data;
                return (
                  <PinCard
                    key={`shop-${idx}`}
                    id={`shop-${idx}`}
                    itemType="shop"
                    title={item.data.name}
                    subtitle={item.data.reason}
                    badge={item.data.priceRange}
                    imageQuery={item.data.searchTerm}
                    index={idx}
                    link={`https://www.google.com/search?q=${encodeURIComponent(item.data.searchTerm)}&tbm=shop`}
                    likedIds={likedIds}
                    savedIds={savedIds}
                    itemData={itemData}
                    onToggleLike={handleToggleLike}
                    onToggleSave={handleToggleSave}
                  />
                );
              }
            })}
          </MasonryGrid>
        );

      case 'trends':
        return (
          <MasonryGrid>
            {content.trends.map((trend, idx) => {
              const itemData: PinCardData = trend;
              return (
                <PinCard
                  key={`trend-${idx}`}
                  id={`trend-${idx}`}
                  itemType="trend"
                  title={trend.name}
                  subtitle={trend.whyItWorks}
                  badge={trend.category}
                  imageQuery={trend.imageQuery || trend.name}
                  index={idx}
                  link={trend.searchTerm ? `https://www.google.com/search?q=${encodeURIComponent(trend.searchTerm + ' buy')}&tbm=shop` : undefined}
                  likedIds={likedIds}
                  savedIds={savedIds}
                  itemData={itemData}
                  onToggleLike={handleToggleLike}
                  onToggleSave={handleToggleSave}
                />
              );
            })}
          </MasonryGrid>
        );

      case 'outfits':
        return (
          <MasonryGrid>
            {content.outfitIdeas.map((outfit, idx) => {
              const itemData: PinCardData = outfit;
              return (
                <PinCard
                  key={`outfit-${idx}`}
                  id={`outfit-${idx}`}
                  itemType="outfit"
                  title={outfit.name}
                  subtitle={outfit.items.join(' • ')}
                  badge={outfit.occasion}
                  imageQuery={outfit.style || outfit.name}
                  index={idx}
                  likedIds={likedIds}
                  savedIds={savedIds}
                  itemData={itemData}
                  onToggleLike={handleToggleLike}
                  onToggleSave={handleToggleSave}
                />
              );
            })}
          </MasonryGrid>
        );

      case 'shop':
        return (
          <div className="space-y-6">
            {content.shoppingPicks && (
              <MasonryGrid>
                {content.shoppingPicks.map((pick, idx) => {
                  const itemData: PinCardData = pick;
                  return (
                    <PinCard
                      key={`shop-${idx}`}
                      id={`shop-${idx}`}
                      itemType="shop"
                      title={pick.name}
                      subtitle={pick.reason}
                      badge={pick.priceRange}
                      imageQuery={pick.searchTerm}
                      index={idx}
                      link={`https://www.google.com/search?q=${encodeURIComponent(pick.searchTerm)}&tbm=shop`}
                      likedIds={likedIds}
                      savedIds={savedIds}
                      itemData={itemData}
                      onToggleLike={handleToggleLike}
                      onToggleSave={handleToggleSave}
                    />
                  );
                })}
              </MasonryGrid>
            )}
            
            {/* Shopping Tips Section */}
            <div className="bg-card rounded-xl border-2 border-strong p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Style Tips
              </h3>
              <ul className="space-y-3">
                {content.shoppingTips.map((tip, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-secondary border border-strong flex items-center justify-center shrink-0 text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="pb-4">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2 border-strong">
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search styles, trends, ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-2 border-strong rounded-full"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'bg-background text-foreground border-strong hover:bg-secondary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            {hasGenerated && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-background text-foreground border-2 border-strong hover:bg-secondary transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Failed to generate feed</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleGenerate}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        )}

        {!hasGenerated && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-xl bg-secondary border-2 border-strong flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-foreground" />
            </div>
            <h3 className="font-semibold text-xl mb-2">
              Your Personal Style Feed
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
              Get curated trends, outfit inspo, and shopping picks tailored to your wardrobe
            </p>
            <Button onClick={handleGenerate} size="lg" className="rounded-full px-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate My Feed
            </Button>
            {activeItems.length === 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                Add items to your closet for better personalization
              </p>
            )}
          </motion.div>
        ) : loading ? (
          <div className="columns-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="break-inside-avoid mb-4">
                <Skeleton className={`rounded-2xl ${['h-48', 'h-56', 'h-64', 'h-72'][i % 4]}`} />
              </div>
            ))}
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}
