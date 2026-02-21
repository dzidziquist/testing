import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";
import { DailyOutfitRequestSchema, validateRequest } from "../_shared/schemas.ts";
import { sanitizeForPrompt } from "../_shared/sanitize.ts";

// Get day-aware occasion options
function getOccasionPrompt(dayOfWeek: number): string {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) {
    return '"Casual" | "Weekend" | "Date Night" | "Active" | "Brunch" | "Errands"';
  }
  return '"Work" | "Casual" | "Meeting" | "Date Night" | "Active" | "Business Casual"';
}

function buildSystemPrompt(dayOfWeek: number, hasUnwornPreference: boolean, randomSeed: number): string {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayContext = isWeekend ? "It's the weekend" : "It's a weekday";
  const occasionOptions = getOccasionPrompt(dayOfWeek);
  const unwornInstruction = hasUnwornPreference 
    ? "\n- IMPORTANT: Prioritize items marked as 'UNWORN' in the closet list - the user wants to wear these!"
    : "";
  
  // Add variety instructions based on random seed
  const varietyPrompts = [
    "Try an unexpected color combination today.",
    "Mix a casual piece with something more polished.",
    "Focus on comfort while keeping it stylish.",
    "Create a bold, statement-making look.",
    "Go for a monochromatic or tonal outfit.",
    "Layer pieces in an interesting way.",
    "Prioritize the least-worn items for freshness.",
    "Build around an accessory or statement piece.",
  ];
  const varietyInstruction = varietyPrompts[randomSeed % varietyPrompts.length];
  
  return `You are a personal fashion stylist AI that suggests daily outfits.

TASK: Select 2-4 items from the user's closet to create a cohesive outfit for today.

IMPORTANT CONTEXT: ${dayContext}. Choose an occasion that matches the day of the week.

VARIETY INSTRUCTION: ${varietyInstruction}

SCORING CRITERIA (0-100):
- Style Cohesion (30%): Colors, patterns, and styles work together
- Personal Fit (25%): Matches user preferences and body type
- Variety (20%): Uses underutilized items or creates new combinations
- Context Appropriateness (15%): Season, weather, occasion suitability  
- Trend Relevance (10%): Light consideration of current trends

RESPONSE FORMAT (JSON only):
{
  "item_ids": ["uuid1", "uuid2", "uuid3"],
  "score": 82,
  "reasoning": "One sentence explaining why this outfit works well",
  "occasion": ${occasionOptions}
}

RULES:
- ONLY use item IDs from the provided closet
- Select items that work together as a complete outfit
- Consider weather if provided
- CREATE VARIETY: Do NOT repeat the same combinations - try different items each time
- Prioritize recently added items and underused pieces
- Be encouraging - minimum score is 60
- ${isWeekend ? 'Since it\'s the weekend, prefer relaxed casual options' : 'Since it\'s a weekday, prefer work-appropriate or business casual options'}${unwornInstruction}`;
}

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
    const validation = validateRequest(DailyOutfitRequestSchema, rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { closetItems, outfits, wearHistory, profile, weather, occasion, preferUnwornIds } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context
    const contextParts: string[] = [];

    // Weather context
    if (weather) {
      contextParts.push(`WEATHER TODAY: ${weather.temp}°C, ${weather.condition}`);
    }

    // Occasion if specified
    if (occasion) {
      contextParts.push(`OCCASION: ${String(occasion).slice(0, 50)}`);
    }

    // User profile
    if (profile) {
      const profileInfo: string[] = [];
      if (profile.body_type) profileInfo.push(`Body type: ${sanitizeForPrompt(String(profile.body_type).slice(0, 50))}`);
      if (profile.skin_tone) profileInfo.push(`Skin tone: ${sanitizeForPrompt(String(profile.skin_tone).slice(0, 50))}`);
      if (profile.preferred_colors?.length) profileInfo.push(`Preferred colors: ${profile.preferred_colors.slice(0, 10).map((c: string) => sanitizeForPrompt(c)).join(', ')}`);
      if (profile.preferred_styles?.length) profileInfo.push(`Preferred styles: ${profile.preferred_styles.slice(0, 10).map((s: string) => sanitizeForPrompt(s)).join(', ')}`);
      if (profileInfo.length > 0) {
        contextParts.push(`USER PROFILE:\n${profileInfo.join('\n')}`);
      }
    }

    // Closet items - format for selection
    const activeItems = closetItems?.filter((item: any) => item.status === 'active') || [];
    const unwornSet = new Set(preferUnwornIds || []);
    
    if (activeItems.length > 0) {
      const itemsList = activeItems.slice(0, 100).map((item: any) => {
        const details = [`ID: ${item.id}`];
        details.push(`Name: ${sanitizeForPrompt(String(item.name).slice(0, 100))}`);
        if (item.category) details.push(`Category: ${sanitizeForPrompt(String(item.category))}`);
        if (item.color) details.push(`Color: ${sanitizeForPrompt(String(item.color).slice(0, 50))}`);
        if (item.brand) details.push(`Brand: ${sanitizeForPrompt(String(item.brand).slice(0, 50))}`);
        if (item.season?.length) details.push(`Season: ${item.season.slice(0, 4).join(', ')}`);
        if (item.wear_count !== undefined) details.push(`Worn: ${item.wear_count}x`);
        if (unwornSet.has(item.id)) details.push('⭐ UNWORN - PRIORITIZE');
        return details.join(' | ');
      }).join('\n');
      contextParts.push(`AVAILABLE ITEMS (${activeItems.length}):\n${itemsList}`);
    }

    // Recent wear history
    if (wearHistory?.length > 0) {
      const recentWears = wearHistory.slice(0, 3).map((wear: any) => wear.item_ids.join(', ')).join('\n');
      contextParts.push(`RECENTLY WORN (avoid repeating):\n${recentWears}`);
    }

    // Add variety seed based on timestamp
    const varietySeed = Math.floor(Date.now() / 1000);
    
    const userMessage = contextParts.length > 0 
      ? `Create a UNIQUE stylish outfit for today using these items (Request #${varietySeed % 10000}):\n\n${contextParts.join('\n\n')}`
      : `Create a UNIQUE stylish outfit for today (Request #${varietySeed % 10000}).`;

    // Get day of week for context-aware suggestions
    const dayOfWeek = new Date().getDay();
    const randomSeed = Math.floor(Math.random() * 1000);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const occasionEnum = isWeekend 
      ? ["Casual", "Weekend", "Date Night", "Active", "Brunch", "Errands"]
      : ["Work", "Casual", "Meeting", "Date Night", "Active", "Business Casual"];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.9,
        messages: [
          { role: "system", content: buildSystemPrompt(dayOfWeek, (preferUnwornIds?.length || 0) > 0, randomSeed) },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_outfit",
              description: "Suggest an outfit with selected item IDs and score",
              parameters: {
                type: "object",
                properties: {
                  item_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of item IDs from the closet to include in the outfit"
                  },
                  score: {
                    type: "number",
                    description: "Outfit score from 60-100 based on scoring criteria"
                  },
                  reasoning: {
                    type: "string",
                    description: "One sentence explaining why this outfit works"
                  },
                  occasion: {
                    type: "string",
                    enum: occasionEnum,
                    description: "The occasion this outfit is best suited for - must match the day of week"
                  }
                },
                required: ["item_ids", "score", "reasoning", "occasion"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_outfit" } },
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
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    
    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback if no tool call
    return new Response(JSON.stringify({
      item_ids: [],
      score: 70,
      reasoning: "A classic combination for your day",
      occasion: "Casual"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("daily-outfit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
