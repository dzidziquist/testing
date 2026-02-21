import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2, Cloud, Sun, Snowflake, Droplets, Leaf, Bookmark, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CircularProgress } from '@/components/ui/circular-progress';
import { CategoryIcon } from '@/components/closet/CategoryIcon';
import { useDailyOutfit } from '@/hooks/useDailyOutfit';
import { useWeather } from '@/hooks/useWeather';
import { useOutfits } from '@/hooks/useOutfits';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface DailyOutfitCardProps {
  activeItemsCount: number;
  unwornItemIds?: string[];
}

export function DailyOutfitCard({ activeItemsCount, unwornItemIds = [] }: DailyOutfitCardProps) {
  const { suggestion, isLoading, error, generateSuggestion, refreshSuggestion } = useDailyOutfit();
  const { weather } = useWeather();
  const { createOutfit } = useOutfits();
  const { toast } = useToast();
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [useUnwornItems, setUseUnwornItems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = () => {
    const weatherContext = weather ? { temp: weather.temp, condition: weather.condition } : undefined;
    const preferUnworn = useUnwornItems && unwornItemIds.length > 0;
    generateSuggestion(weatherContext, undefined, preferUnworn ? unwornItemIds : undefined);
    setHasGenerated(true);
    setIsSaved(false);
  };

  const handleRefresh = () => {
    const weatherContext = weather ? { temp: weather.temp, condition: weather.condition } : undefined;
    const preferUnworn = useUnwornItems && unwornItemIds.length > 0;
    refreshSuggestion(weatherContext, undefined, preferUnworn ? unwornItemIds : undefined);
    setIsSaved(false);
  };

  const handleSaveOutfit = async () => {
    if (!suggestion || suggestion.items.length < 2) return;
    
    setIsSaving(true);
    try {
      await createOutfit({
        name: `Daily Look - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        item_ids: suggestion.items.map(i => i.id),
        occasion: suggestion.occasion,
        season: suggestion.season,
        is_ai_generated: true,
        score: suggestion.score,
      });
      setIsSaved(true);
      toast({
        title: 'Outfit saved!',
        description: 'Added to your outfit collection',
      });
    } catch (err) {
      toast({
        title: 'Failed to save',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (activeItemsCount < 2) {
    return (
      <div className="bg-card rounded-xl border-2 border-strong p-5 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-secondary border-2 border-strong flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-foreground" />
        </div>
        <h4 className="font-medium text-sm mb-1">Ready for outfit suggestions!</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Add at least 2 items to get AI-powered recommendations
        </p>
        <Button asChild size="sm">
          <Link to="/closet/add">Add Your First Item</Link>
        </Button>
      </div>
    );
  }

  if (!hasGenerated && !suggestion) {
    return (
      <div className="bg-card rounded-xl border-2 border-strong p-4">
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-strong flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h4 className="font-semibold text-sm mb-0.5">Today's Look</h4>
          <p className="text-xs text-muted-foreground">
            AI-curated outfit based on weather & your style
          </p>
        </div>

        {/* Unworn items toggle */}
        {unwornItemIds.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-secondary/50 rounded-lg border border-strong">
            <Switch
              id="use-unworn"
              checked={useUnwornItems}
              onCheckedChange={setUseUnwornItems}
              className="scale-90"
            />
            <Label htmlFor="use-unworn" className="text-xs cursor-pointer">
              Prioritize unworn items ({unwornItemIds.length})
            </Label>
          </div>
        )}

        <Button onClick={handleGenerate} className="w-full" size="sm">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Generate Today's Outfit
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border-2 border-strong p-5 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-secondary border-2 border-strong flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
        <h4 className="font-medium text-sm mb-1">Creating your look...</h4>
        <p className="text-xs text-muted-foreground">
          {useUnwornItems ? 'Prioritizing unworn pieces...' : 'Analyzing weather & your preferences'}
        </p>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="bg-card rounded-xl border-2 border-strong p-4 text-center">
        <p className="text-xs text-muted-foreground mb-3">Something went wrong. Try again?</p>
        <Button onClick={handleGenerate} size="sm">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl border-2 border-strong overflow-hidden"
    >
      {/* Outfit preview with score overlay */}
      <div className="aspect-[16/9] relative">
        {/* Items grid */}
        <div className="absolute inset-0 grid grid-cols-4 gap-1 p-1.5">
          <AnimatePresence mode="popLayout">
            {suggestion.items.slice(0, 4).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg overflow-hidden bg-secondary border border-strong"
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CategoryIcon category={item.category} size="lg" className="text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Score indicator - positioned top right */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="absolute top-2 right-2 bg-card/95 backdrop-blur-sm rounded-full p-0.5 border-2 border-strong shadow-lg"
        >
          <CircularProgress value={suggestion.score} size={48} strokeWidth={4} />
        </motion.div>

        {/* AI Badge */}
        <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 border-2 border-strong">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium">AI</span>
        </div>
      </div>

      {/* Info section */}
      <div className="p-3 border-t-2 border-strong">
        <div className="mb-2">
          <p className={`text-xs text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
            {suggestion.reasoning}
          </p>
          {suggestion.reasoning && suggestion.reasoning.length > 80 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] text-primary font-medium mt-0.5"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Context tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {suggestion.occasion && (
            <span className="text-[10px] bg-secondary border border-strong px-1.5 py-0.5 rounded-full">
              {suggestion.occasion}
            </span>
          )}
          {suggestion.season && (
            <span className="text-[10px] bg-secondary border border-strong px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              {suggestion.season === 'Winter' && <Snowflake className="w-2.5 h-2.5" />}
              {suggestion.season === 'Summer' && <Sun className="w-2.5 h-2.5" />}
              {suggestion.season === 'Spring' && <Leaf className="w-2.5 h-2.5" />}
              {suggestion.season === 'Fall' && <Leaf className="w-2.5 h-2.5" />}
              {suggestion.season}
            </span>
          )}
          {suggestion.weather?.temp !== undefined && (
            <span className="text-[10px] bg-secondary border border-strong px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              {suggestion.weather.condition?.toLowerCase().includes('rain') && <Droplets className="w-2.5 h-2.5" />}
              {suggestion.weather.condition?.toLowerCase().includes('cloud') && <Cloud className="w-2.5 h-2.5" />}
              {suggestion.weather.condition?.toLowerCase().includes('clear') && <Sun className="w-2.5 h-2.5" />}
              {suggestion.weather.temp}°C
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {suggestion.items.length} items
          </span>
        </div>

        {/* Unworn toggle for regeneration */}
        {unwornItemIds.length > 0 && (
          <div className="flex items-center gap-2 mb-3 p-1.5 bg-secondary/30 rounded-lg border border-strong">
            <Switch
              id="use-unworn-regen"
              checked={useUnwornItems}
              onCheckedChange={setUseUnwornItems}
              className="scale-75"
            />
            <Label htmlFor="use-unworn-regen" className="text-[10px] cursor-pointer text-muted-foreground">
              Use unworn items
            </Label>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isLoading} className="flex-1 h-8 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            New Look
          </Button>
          <Button 
            variant={isSaved ? "secondary" : "outline"} 
            size="sm" 
            onClick={handleSaveOutfit} 
            disabled={isSaving || isSaved}
            className="flex-1 h-8 text-xs"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
