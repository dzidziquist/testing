import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";
import { StyleAssistantRequestSchema, validateRequest } from "../_shared/schemas.ts";
import { sanitizeForPrompt } from "../_shared/sanitize.ts";

const SYSTEM_PROMPT = `You are **Inukki** — a warm, witty, and opinionated personal style companion. Think of yourself as a best friend who happens to have impeccable taste. You're playful but never superficial, confident but never condescending.

PERSONALITY TRAITS:
- You speak in a casual, encouraging tone — like texting a stylish friend. Short sentences, natural rhythm.
- You use nicknames occasionally ("babe", "love", "bestie") but never excessively.
- You have genuine enthusiasm — you get EXCITED about great combos and aren't afraid to show it.
- You're honest. If something doesn't work, you say so gently with a better alternative. ("Hmm, that combo is fighting itself a bit — swap the top for your [item] and it'll sing ✨")
- You sprinkle in emojis naturally but don't overdo it (1-3 per message max).
- You reference fashion in relatable ways — "giving main character energy", "very cool-girl-off-duty", "that's a power move".
- You remember context within the conversation and build on it.

CORE RESPONSIBILITIES:
1. Recommend outfits using items from the user's closet
2. Score outfits (0-100) based on style cohesion, personal fit, variety, and context
3. Suggest new items to buy that would complement their wardrobe
4. Hype up great choices and gently redirect questionable ones

OUTFIT SCORING CRITERIA:
- Style Cohesion (30%): How well colors, patterns, and styles work together
- Personal Fit (25%): How well it matches user preferences and body type
- Variety (20%): Whether it uses underutilized items or creates new combinations
- Context Appropriateness (15%): Season, weather, occasion suitability
- Trend Relevance (10%): Light consideration of current trends

RESPONSE FORMAT:
When recommending outfits, ALWAYS:
1. Name the EXACT items from their closet (use the exact names provided in context)
2. Include a Score (0-100) with a fun, on-brand label (e.g., "✨ 85/100 — obsessed with this combo")
3. Brief explanation of *why* it works — be specific, not generic
4. Optional improvements, framed positively ("to take it up a notch...")

When suggesting items to buy:
- Clearly label as "💡 Wardrobe Gap Alert"
- Explain the value conversationally ("You've got three killer tops but nothing structured to layer over them — a blazer would unlock like five new looks")
- ALWAYS include real shopping links in markdown format like [Store Name](https://store.com/search?q=item)
- Use these stores: ASOS, Zara, H&M, Nordstrom, Uniqlo, Mango
- Example: "Check out [ASOS](https://www.asos.com/search/?q=navy+blazer) or [Zara](https://www.zara.com/us/en/search?searchTerm=navy+blazer)"

IMPORTANT GUIDELINES:
- When suggesting outfit combinations, ALWAYS mention the exact item names so images can be shown
- Prioritize the user's preferences and wear history over trends
- Be specific about which items to combine
- Keep responses punchy — aim for 3-5 short paragraphs max, not essays
- Sign off responses with a little encouragement or a fun closing line
- For shopping suggestions, format links as markdown: [Store](url)`;


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    const rawBody = await req.json();
    
    // Validate request with zod schema
    const validation = validateRequest(StyleAssistantRequestSchema, rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { messages, closetItems, outfits, wearHistory, wishlist, profile, stream } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context about the user's wardrobe
    const contextMessage = buildWardrobeContext(closetItems, outfits, wearHistory, wishlist, profile);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextMessage },
          ...messages,
        ],
        stream: stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error: " + errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For non-streaming requests, return the JSON directly
    if (!stream) {
      const data = await response.json();
      console.log("AI response received, finish_reason:", data.choices?.[0]?.finish_reason);
      
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.error("Empty content from AI, full response:", JSON.stringify(data));
        return new Response(JSON.stringify({ error: "AI returned an empty response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For streaming requests, pass through the stream
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("style-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
function buildWardrobeContext(
  closetItems: any[],
  outfits: any[],
  wearHistory: any[],
  wishlist: any[],
  profile: any
): string {
  const sections: string[] = [];

  // User profile
  if (profile) {
    const profileInfo = [];
    if (profile.body_type) profileInfo.push(`Body type: ${sanitizeForPrompt(String(profile.body_type).slice(0, 50))}`);
    if (profile.skin_tone) profileInfo.push(`Skin tone: ${sanitizeForPrompt(String(profile.skin_tone).slice(0, 50))}`);
    if (profile.preferred_colors?.length) profileInfo.push(`Preferred colors: ${profile.preferred_colors.slice(0, 10).map((c: string) => sanitizeForPrompt(c)).join(', ')}`);
    if (profile.preferred_styles?.length) profileInfo.push(`Preferred styles: ${profile.preferred_styles.slice(0, 10).map((s: string) => sanitizeForPrompt(s)).join(', ')}`);
    
    if (profileInfo.length > 0) {
      sections.push(`USER PROFILE:\n${profileInfo.join('\n')}`);
    }
  }

  // Active closet items - include more details for better matching
  const activeItems = closetItems?.filter((item: any) => item.status === 'active')?.slice(0, 100) || [];
  if (activeItems.length > 0) {
    const itemsList = activeItems.map((item: any) => {
      const details = [`"${sanitizeForPrompt(String(item.name).slice(0, 100))}"`];
      if (item.category) details.push(`(${sanitizeForPrompt(String(item.category))})`);
      if (item.color) details.push(`- ${sanitizeForPrompt(String(item.color).slice(0, 50))}`);
      if (item.brand) details.push(`by ${sanitizeForPrompt(String(item.brand).slice(0, 50))}`);
      if (item.wear_count > 0) details.push(`[worn ${item.wear_count}x]`);
      if (item.image_url) details.push(`[has image]`);
      return `• ${details.join(' ')}`;
    }).join('\n');
    sections.push(`CLOSET ITEMS (${activeItems.length} items) - Use these EXACT item names when suggesting outfits:\n${itemsList}`);
  }

  // Existing outfits
  if (outfits?.length > 0) {
    const outfitsList = outfits.slice(0, 10).map((outfit: any) => {
      const name = sanitizeForPrompt(String(outfit.name || 'Unnamed outfit').slice(0, 100));
      const info = [];
      if (outfit.occasion) info.push(sanitizeForPrompt(String(outfit.occasion).slice(0, 50)));
      if (outfit.season) info.push(sanitizeForPrompt(String(outfit.season).slice(0, 50)));
      if (outfit.is_ai_generated) info.push('AI-generated');
      return `• ${name}${info.length ? ` (${info.join(', ')})` : ''} - ${outfit.item_ids?.length || 0} items`;
    }).join('\n');
    sections.push(`SAVED OUTFITS (${outfits.length} total):\n${outfitsList}`);
  }

  // Recent wear history
  if (wearHistory?.length > 0) {
    const recentWears = wearHistory.slice(0, 5).map((wear: any) => {
      return `• ${wear.worn_at}: ${wear.item_ids?.length || 0} items`;
    }).join('\n');
    sections.push(`RECENT WEAR HISTORY:\n${recentWears}`);
  }

  // Wishlist
  const wishlistItems = wishlist?.filter((item: any) => item.status === 'wishlist')?.slice(0, 20) || [];
  if (wishlistItems.length > 0) {
    const wishlistList = wishlistItems.map((item: any) => {
      return `• ${sanitizeForPrompt(String(item.name).slice(0, 100))} (${sanitizeForPrompt(String(item.category))})${item.brand ? ` by ${sanitizeForPrompt(String(item.brand).slice(0, 50))}` : ''}`;
    }).join('\n');
    sections.push(`WISHLIST (${wishlistItems.length} items):\n${wishlistList}`);
  }

  return sections.length > 0 
    ? `CURRENT WARDROBE CONTEXT:\n\n${sections.join('\n\n')}`
    : 'The user has not added any items to their closet yet.';
}
