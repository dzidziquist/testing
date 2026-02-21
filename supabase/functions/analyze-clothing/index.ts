import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";
import { isValidImageUrl, isDnsResolutionSafe } from "../_shared/validation.ts";

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

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL to prevent SSRF
    if (!isValidImageUrl(imageUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid image URL provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DNS rebinding check for non-data URLs
    if (!imageUrl.startsWith('data:')) {
      try {
        const urlObj = new URL(imageUrl);
        const dnsSafe = await isDnsResolutionSafe(urlObj.hostname);
        if (!dnsSafe) {
          return new Response(
            JSON.stringify({ success: false, error: "URL resolves to a private address" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Continue if DNS check fails
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this clothing item image and extract the following details. Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "name": "descriptive name for the item (e.g., 'Slim Fit Oxford Shirt')",
  "category": "one of: tops, bottoms, dresses, outerwear, shoes, accessories, bags, jewelry, activewear, swimwear, sleepwear, other",
  "color": "primary color(s) of the item",
  "pattern": "pattern if any (solid, striped, plaid, floral, etc.)",
  "brand": "brand if visible, otherwise null",
  "season": ["array of seasons: spring, summer, fall, winter"],
  "style": "style description (casual, formal, sporty, etc.)",
  "material": "material if identifiable (cotton, denim, leather, etc.)"
}

Be specific and accurate. If you cannot determine something, use null.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const clothingData = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ success: true, data: clothingData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-clothing error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to analyze image" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
