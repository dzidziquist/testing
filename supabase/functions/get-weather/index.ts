import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

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

    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Open-Meteo API (free, no API key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    
    const response = await fetch(url);
    
    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const textResponse = await response.text();
      console.error("Expected JSON but got:", contentType);
      console.error("Response preview:", textResponse.substring(0, 200));
      throw new Error("Weather API returned non-JSON response");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.reason || "Failed to fetch weather");
    }

    // Map weather codes to conditions
    const weatherCodeMap: Record<number, { condition: string; icon: string }> = {
      0: { condition: "Clear", icon: "sun" },
      1: { condition: "Mostly Clear", icon: "sun" },
      2: { condition: "Partly Cloudy", icon: "cloud-sun" },
      3: { condition: "Overcast", icon: "cloud" },
      45: { condition: "Foggy", icon: "cloud-fog" },
      48: { condition: "Foggy", icon: "cloud-fog" },
      51: { condition: "Light Drizzle", icon: "cloud-drizzle" },
      53: { condition: "Drizzle", icon: "cloud-drizzle" },
      55: { condition: "Heavy Drizzle", icon: "cloud-drizzle" },
      61: { condition: "Light Rain", icon: "cloud-rain" },
      63: { condition: "Rain", icon: "cloud-rain" },
      65: { condition: "Heavy Rain", icon: "cloud-rain" },
      66: { condition: "Freezing Rain", icon: "cloud-rain" },
      67: { condition: "Freezing Rain", icon: "cloud-rain" },
      71: { condition: "Light Snow", icon: "cloud-snow" },
      73: { condition: "Snow", icon: "cloud-snow" },
      75: { condition: "Heavy Snow", icon: "cloud-snow" },
      77: { condition: "Snow Grains", icon: "cloud-snow" },
      80: { condition: "Light Showers", icon: "cloud-rain" },
      81: { condition: "Showers", icon: "cloud-rain" },
      82: { condition: "Heavy Showers", icon: "cloud-rain" },
      85: { condition: "Snow Showers", icon: "cloud-snow" },
      86: { condition: "Heavy Snow Showers", icon: "cloud-snow" },
      95: { condition: "Thunderstorm", icon: "cloud-lightning" },
      96: { condition: "Thunderstorm", icon: "cloud-lightning" },
      99: { condition: "Severe Thunderstorm", icon: "cloud-lightning" },
    };

    const weatherCode = data.current?.weather_code ?? 0;
    const weatherInfo = weatherCodeMap[weatherCode] || { condition: "Unknown", icon: "cloud" };

    return new Response(
      JSON.stringify({
        temp: Math.round(data.current?.temperature_2m ?? 0),
        condition: weatherInfo.condition,
        icon: weatherInfo.icon,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch weather";
    console.error("Weather fetch error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
