import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClosetItems } from '@/hooks/useClosetItems';
import { useOutfits } from '@/hooks/useOutfits';
import { useToast } from '@/hooks/use-toast';
import { CategoryIcon } from '@/components/closet/CategoryIcon';
import { cn } from '@/lib/utils';
import { ClosetItem } from '@/types/closet';
import { useAuth } from '@/hooks/useAuth';
import { authenticatedFetch } from '@/lib/auth-fetch';

export default function CreateOutfitPage() {
  const navigate = useNavigate();
  const { items, loading: itemsLoading } = useClosetItems();
  const { createOutfit } = useOutfits();
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [outfitName, setOutfitName] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [wasAiGenerated, setWasAiGenerated] = useState(false);

  const activeItems = items.filter(item => item.status === 'active');

  const generateAIOutfit = useCallback(async () => {
    if (activeItems.length < 2) {
      toast({
        title: 'Not enough items',
        description: 'Add at least 2 items to your closet for AI suggestions',
        variant: 'destructive',
      });
      return;
    }

    setAiGenerating(true);
    try {
      const response = await authenticatedFetch('style-assistant', {
        messages: [{
          role: 'user',
          content: `Based on my closet items, suggest ONE complete outfit. Pick items that work well together. 
          
IMPORTANT: In your response, list the EXACT item names you're recommending in a clear format like:
"Selected items: [Item Name 1], [Item Name 2], [Item Name 3]"

Only use items from my closet, don't suggest buying new things.`
        }],
        closetItems: activeItems,
        outfits: [],
        wearHistory: [],
        wishlist: [],
        profile,
      });

      if (!response.ok) {
        throw new Error('Failed to get AI suggestion');
      }

      // Parse the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          // Parse SSE data
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const jsonStr = line.slice(6);
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) fullResponse += content;
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // Find matching items from the AI response
      const matchedItems: string[] = [];
      const lowerResponse = fullResponse.toLowerCase();
      
      for (const item of activeItems) {
        const itemNameLower = item.name.toLowerCase();
        // Check if item name appears in the response
        if (lowerResponse.includes(itemNameLower)) {
          matchedItems.push(item.id);
        }
      }

      // If we found matches, select them
      if (matchedItems.length >= 2) {
        setSelectedItems(matchedItems);
        setWasAiGenerated(true);
        toast({
          title: 'AI suggestion ready!',
          description: `Selected ${matchedItems.length} items for your outfit`,
        });
      } else {
        // Fallback: try to match by category keywords
        const topItem = activeItems.find(i => ['tops', 'dresses', 'outerwear'].includes(i.category));
        const bottomItem = activeItems.find(i => i.category === 'bottoms');
        const shoeItem = activeItems.find(i => i.category === 'shoes');
        
        const fallbackItems = [topItem, bottomItem, shoeItem].filter(Boolean).map(i => i!.id);
        
        if (fallbackItems.length >= 2) {
          setSelectedItems(fallbackItems);
          setWasAiGenerated(true);
          toast({
            title: 'AI suggestion ready!',
            description: `Selected ${fallbackItems.length} complementary items`,
          });
        } else {
          toast({
            title: 'Could not generate outfit',
            description: 'Try adding more items to your closet',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI generation failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setAiGenerating(false);
    }
  }, [activeItems, profile, toast]);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSave = async () => {
    if (selectedItems.length < 2) {
      toast({
        title: 'Select at least 2 items',
        description: 'An outfit needs at least 2 clothing items',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Get AI score for the outfit
      let score: number | undefined;
      try {
        const selectedItemsData = activeItems.filter(item => selectedItems.includes(item.id));
        const response = await authenticatedFetch('analyze-outfit', {
          items: selectedItemsData.map(item => ({
            name: item.name,
            category: item.category,
            color: item.color,
            pattern: item.pattern,
            brand: item.brand,
          })),
        });
        const result = await response.json();
        if (result.success && result.data?.score) {
          score = result.data.score;
        }
      } catch (analyzeError) {
        console.log('Could not get AI score, saving without score:', analyzeError);
      }

      await createOutfit({
        name: outfitName.trim() || undefined,
        item_ids: selectedItems,
        is_ai_generated: wasAiGenerated,
        score,
      });
      toast({
        title: 'Outfit created!',
        description: score ? `Score: ${score}/100` : 'Your new outfit has been saved',
      });
      navigate('/outfits');
    } catch (error: any) {
      toast({
        title: 'Failed to create outfit',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedItemsData = activeItems.filter(item => selectedItems.includes(item.id));

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Create Outfit</h1>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={selectedItems.length < 2 || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* AI Generate Button */}
      <div className="px-4 pb-2">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={generateAIOutfit}
          disabled={aiGenerating || activeItems.length < 2}
        >
          {aiGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </>
          )}
        </Button>
      </div>

      {/* Outfit Name */}
      <div className="px-4 py-4">
        <Input
          placeholder="Outfit name (optional)"
          value={outfitName}
          onChange={(e) => setOutfitName(e.target.value)}
          className="text-center"
        />
      </div>

      {/* Selected Items Preview */}
      {selectedItems.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-2">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {selectedItemsData.map((item) => (
                <div 
                  key={item.id}
                  className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-secondary"
                >
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CategoryIcon category={item.category} className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="px-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Select items from your closet
        </h2>
        
        {itemsLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No items in your closet yet</p>
            <Button onClick={() => navigate('/closet/add')}>
              <Plus className="w-4 h-4 mr-1" />
              Add Items
            </Button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-3">
            {activeItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              return (
                <motion.button
                  key={item.id}
                  layout
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden bg-secondary transition-all",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CategoryIcon category={item.category} className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Item name overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white truncate">{item.name}</p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
