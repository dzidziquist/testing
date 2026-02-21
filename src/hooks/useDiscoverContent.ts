import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClosetItem } from '@/types/closet';

interface TrendItem {
  name: string;
  category: string;
  description: string;
  whyItWorks: string;
  searchTerm?: string;
  imageQuery?: string;
}

interface OutfitIdea {
  name: string;
  description: string;
  items: string[];
  occasion: string;
  style?: string;
}

interface ShoppingPick {
  name: string;
  reason: string;
  priceRange: string;
  searchTerm: string;
}

export interface DiscoverContent {
  trends: TrendItem[];
  outfitIdeas: OutfitIdea[];
  shoppingPicks: ShoppingPick[];
  shoppingTips: string[];
}

interface Outfit {
  id: string;
  name?: string | null;
  occasion?: string | null;
  season?: string | null;
  item_ids: string[];
  is_ai_generated?: boolean | null;
}

export function useDiscoverContent() {
  const { toast } = useToast();
  const [content, setContent] = useState<DiscoverContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateContent = useCallback(async (
    activeItems: ClosetItem[],
    outfits: Outfit[],
    wishlistItems: ClosetItem[]
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await supabase.functions.invoke('style-assistant', {
        body: {
          messages: [{
            role: 'user',
            content: `You are a FASHION STYLIST. Generate ONLY fashion and clothing content.

IMPORTANT: Everything you generate MUST be about clothes, outfits, fashion trends, and style. No other topics.

Return ONLY valid JSON with this structure:
{
  "trends": [
    {"name": "Fashion trend name", "category": "clothing category like tops/bottoms/dresses/outerwear/accessories", "description": "What this fashion trend is", "whyItWorks": "Why this style works", "searchTerm": "clothing search term", "imageQuery": "fashion photography search term"}
  ],
  "outfitIdeas": [
    {"name": "Outfit name", "description": "Outfit description", "items": ["clothing item 1", "clothing item 2", "shoes"], "occasion": "when to wear", "style": "style aesthetic like minimalist, streetwear, boho, etc"}
  ],
  "shoppingPicks": [
    {"name": "Clothing item to buy", "reason": "Why add this to wardrobe", "priceRange": "$XX-XX", "searchTerm": "exact product search term"}
  ],
  "shoppingTips": ["Fashion tip 1", "Style tip 2", "Wardrobe tip 3"]
}

Generate:
- 4 current FASHION trends (clothing styles, colors, silhouettes)
- 3 wearable OUTFIT ideas using real clothing items
- 3 CLOTHING items worth buying
- 3 practical STYLE tips

Base recommendations on my wardrobe items if provided. Keep everything fashion-focused.`
          }],
          closetItems: activeItems.slice(0, 20), // Limit items to reduce token usage
          outfits: outfits.slice(0, 5),
          wearHistory: [],
          wishlist: wishlistItems.slice(0, 5),
          profile: null,
          stream: false // Use non-streaming for JSON parsing
        }
      });

      if (response.error) {
        const errorMsg = response.error.message || 'Failed to generate content';
        if (errorMsg.includes('FunctionsFetchError') || errorMsg.includes('Failed to send')) {
          throw new Error('Could not connect to AI service. Please check your connection and try again.');
        }
        throw new Error(errorMsg);
      }

      // Handle non-streaming response
      const data = response.data;
      if (!data) {
        throw new Error('No response data received');
      }

      // Check for error in response
      if (data.error) {
        throw new Error(data.error);
      }

      const fullContent = data.content;
      if (!fullContent || fullContent.trim().length === 0) {
        throw new Error('AI returned an empty response. Please try again.');
      }
      // Clean up markdown code blocks if present
      let cleaned = fullContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*json\s*/i, '') // Remove leading "json" text
        .trim();

      // Find JSON boundaries properly by counting braces
      const jsonStart = cleaned.indexOf('{');
      if (jsonStart === -1) {
        console.error('No JSON found in response:', cleaned.substring(0, 500));
        throw new Error('AI response was not in the expected format. Please try again.');
      }

      // Use balanced brace counting to find the end
      let braceCount = 0;
      let jsonEnd = -1;
      let inString = false;
      let escapeNext = false;
      
      for (let i = jsonStart; i < cleaned.length; i++) {
        const char = cleaned[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\' && inString) {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEnd = i;
              break;
            }
          }
        }
      }

      if (jsonEnd === -1) {
        // If we couldn't find balanced braces, try using lastIndexOf as fallback
        jsonEnd = cleaned.lastIndexOf('}');
        if (jsonEnd === -1 || jsonEnd <= jsonStart) {
          console.error('Incomplete JSON in response:', cleaned.substring(0, 500));
          throw new Error('AI response was incomplete. Please try again.');
        }
      }

      let jsonString = cleaned.substring(jsonStart, jsonEnd + 1);
      
      // Try to parse, with fallback for common issues
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Initial parse failed, attempting fixes...', parseError);
        // Try fixing common issues
        const fixed = jsonString
          .replace(/,\s*}/g, '}')      // Remove trailing commas in objects
          .replace(/,\s*]/g, ']')       // Remove trailing commas in arrays
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
          .replace(/\n/g, ' ')          // Replace newlines with spaces
          .replace(/\r/g, '')           // Remove carriage returns
          .replace(/\t/g, ' ');         // Replace tabs with spaces
        
        try {
          parsed = JSON.parse(fixed);
        } catch (fixedParseError) {
          console.error('Fixed parse also failed:', fixedParseError);
          console.error('JSON string (first 1000 chars):', jsonString.substring(0, 1000));
          throw new Error('Could not parse AI response. Please try again.');
        }
      }
      
      // Validate the structure with fallbacks for missing fields
      if (!parsed.trends) parsed.trends = [];
      if (!parsed.outfitIdeas) parsed.outfitIdeas = [];
      if (!parsed.shoppingPicks) parsed.shoppingPicks = [];
      if (!parsed.shoppingTips) parsed.shoppingTips = [];
      
      // Ensure we have at least some content
      if (parsed.trends.length === 0 && parsed.outfitIdeas.length === 0 && parsed.shoppingPicks.length === 0) {
        console.error('All arrays empty in response:', parsed);
        throw new Error('AI returned empty content. Please try again.');
      }
      
      setContent(parsed);
      setHasGenerated(true);
    } catch (err) {
      console.error('Error generating discover content:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate content';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    content,
    loading,
    error,
    hasGenerated,
    generateContent,
  };
}
