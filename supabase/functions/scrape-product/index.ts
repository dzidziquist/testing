import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";
import { isValidScrapingUrl, formatUrl, isDnsResolutionSafe, safeFetch } from "../_shared/validation.ts";

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

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL to prevent SSRF
    if (!isValidScrapingUrl(url)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid URL provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format URL
    const formattedUrl = formatUrl(url);

    // DNS resolution check to prevent DNS rebinding
    try {
      const urlObj = new URL(formattedUrl);
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

    console.log("Scraping product URL:", formattedUrl);

    // Step 1: Scrape the page with Firecrawl
    const scrapeResponse = await safeFetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "screenshot"],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl API error:", scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || "Failed to scrape page" }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const screenshot = scrapeData.data?.screenshot || scrapeData.screenshot;
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    console.log("Scrape successful, extracting product details with AI...");

    // Step 2: Use AI to extract structured product data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a product data extractor for a fashion/clothing app. Extract clothing product details from the provided page content.

Return a JSON object with these fields:
- name: Product name (string, required)
- brand: Brand name (string or null)
- color: Main color(s) (string or null)
- category: One of: tops, bottoms, dresses, outerwear, shoes, accessories, bags, jewelry, activewear, swimwear, sleepwear, other
- pattern: Pattern if applicable (e.g., striped, floral, solid) or null
- price: Price as a number or null
- description: Brief description (string or null)
- imageUrl: Main product image URL if found in the content (string or null)

Be concise and accurate. Only return valid JSON, no other text.`
          },
          {
            role: "user",
            content: `Extract product details from this page:\n\nURL: ${formattedUrl}\nTitle: ${metadata.title || "Unknown"}\n\nContent:\n${markdown.slice(0, 8000)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI extraction failed, returning basic data");
      // Return basic data without AI extraction
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            name: metadata.title || "Unknown Product",
            brand: null,
            color: null,
            category: "other",
            imageUrl: screenshot ? `data:image/png;base64,${screenshot}` : null,
            productUrl: formattedUrl,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let productData: any = {};

    try {
      const content = aiData.choices?.[0]?.message?.content || "{}";
      productData = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      productData = { name: metadata.title || "Unknown Product" };
    }

    // Determine best image: product image from content, or screenshot
    let finalImageUrl = productData.imageUrl || null;
    if (!finalImageUrl && screenshot) {
      finalImageUrl = `data:image/png;base64,${screenshot}`;
    }

    console.log("Product extraction complete:", productData.name);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: productData.name || metadata.title || "Unknown Product",
          brand: productData.brand || null,
          color: productData.color || null,
          category: productData.category || "other",
          pattern: productData.pattern || null,
          price: productData.price || null,
          description: productData.description || null,
          imageUrl: finalImageUrl,
          productUrl: formattedUrl,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error scraping product:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Failed to scrape product" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
