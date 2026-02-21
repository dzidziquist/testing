import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";
import { isValidImageUrl } from "../_shared/validation.ts";
import { AnalyzeOutfitRequestSchema, validateRequest } from "../_shared/schemas.ts";
import { sanitizeForPrompt } from "../_shared/sanitize.ts";

const IMAGE_ANALYSIS_PROMPT = `You are a fashion expert analyzing an outfit photo. Provide a detailed analysis.

SCORING CRITERIA (0-100):
- Style Cohesion (30%): How well colors, patterns, and styles work together
- Proportions (25%): Balance between fitted/loose, lengths, visual weight
- Color Harmony (20%): Color coordination and contrast
- Trend Relevance (15%): Current fashion trends
- Overall Appeal (10%): General aesthetic impact

RESPONSE FORMAT (JSON):
{
  "score": <number 0-100>,
  "reasoning": "<2-3 sentences explaining the score>",
  "suggestions": ["<improvement 1>", "<improvement 2>"],
  "detectedItems": [
    {"category": "tops|bottoms|dresses|outerwear|shoes|accessories", "color": "<color>", "description": "<brief description>"}
  ],
  "shoppingLinks": [
    {"name": "<item type>", "store": "ASOS|Zara|H&M|Nordstrom|Amazon", "url": "<actual shopping URL for similar item>"}
  ]
}

IMPORTANT:
- Be encouraging but honest
- Provide actionable suggestions
- For shoppingLinks, generate real, working URLs to major retailers for similar items based on what you see
- Only include 2-3 most relevant shopping links
- Focus on the overall outfit, not individual flaws`;

const ITEMS_ANALYSIS_PROMPT = `You are a fashion expert analyzing an outfit based on its clothing items. Provide a detailed analysis.

SCORING CRITERIA (0-100):
- Style Cohesion (30%): How well the items work together stylistically
- Color Harmony (25%): How well the colors complement each other
- Versatility (20%): How well balanced and wearable the combination is
- Completeness (15%): Whether the outfit feels complete or needs additional pieces
- Trend Relevance (10%): Current fashion appeal

RESPONSE FORMAT (JSON):
{
  "score": <number 0-100>,
  "reasoning": "<2-3 sentences explaining the score and why these pieces work together>",
  "suggestions": ["<improvement 1>", "<improvement 2>"]
}

IMPORTANT:
- Be encouraging but honest
- Consider color coordination, pattern mixing, and style consistency
- Provide actionable suggestions for improvement`;

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
    const validation = validateRequest(AnalyzeOutfitRequestSchema, rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { imageUrl, items } = validation.data;

    if (!imageUrl && (!items || items.length === 0)) {
      return new Response(
        JSON.stringify({ success: false, error: "Image URL or items array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Additional validation for image URL using existing utility
    if (imageUrl && !isValidImageUrl(imageUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid image URL provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let response;

    if (imageUrl) {
      // Image-based analysis
      console.log("Analyzing outfit image...");
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: IMAGE_ANALYSIS_PROMPT },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
    } else {
      // Items-based analysis
      console.log("Analyzing outfit from items...", items.length, "items");
      const itemsDescription = items.map((item: any) => 
        `- ${sanitizeForPrompt(String(item.name || 'Unknown').slice(0, 100))}: ${sanitizeForPrompt(String(item.category || 'unknown').slice(0, 50))}, ${sanitizeForPrompt(String(item.color || 'unknown color').slice(0, 50))}${item.pattern ? `, ${sanitizeForPrompt(String(item.pattern).slice(0, 50))} pattern` : ''}${item.brand ? ` (${sanitizeForPrompt(String(item.brand).slice(0, 50))})` : ''}`
      ).join('\n');

      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `${ITEMS_ANALYSIS_PROMPT}\n\nOUTFIT ITEMS:\n${itemsDescription}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let analysisData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      analysisData = {
        score: 75,
        reasoning: "Great outfit choice! The pieces work well together.",
        suggestions: ["Consider adding an accessory for extra flair"],
        detectedItems: [],
        shoppingLinks: [],
      };
    }

    // Validate and sanitize the response
    const validatedData = {
      score: Math.min(100, Math.max(0, Number(analysisData.score) || 75)),
      reasoning: String(analysisData.reasoning || "Nice outfit!"),
      suggestions: Array.isArray(analysisData.suggestions) ? analysisData.suggestions.slice(0, 3) : [],
      detectedItems: Array.isArray(analysisData.detectedItems) ? analysisData.detectedItems.slice(0, 6) : [],
      shoppingLinks: Array.isArray(analysisData.shoppingLinks) ? analysisData.shoppingLinks.slice(0, 4) : [],
    };

    console.log("Outfit analysis complete:", validatedData.score);

    return new Response(
      JSON.stringify({ success: true, data: validatedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-outfit error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
