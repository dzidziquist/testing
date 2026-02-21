import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Common schemas
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(50000)
});

const ClosetItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(200),
  category: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  pattern: z.string().max(50).optional().nullable(),
  season: z.array(z.string().max(30)).max(10).optional().nullable(),
  status: z.enum(['active', 'wishlist', 'archived']).optional().nullable(),
  wear_count: z.number().int().min(0).max(10000).optional().nullable(),
  image_url: z.string().max(7000000).optional().nullable(), // Allow large base64 data URLs
  last_worn_at: z.string().optional().nullable(),
}).passthrough(); // Allow additional properties

const ProfileSchema = z.object({
  body_type: z.string().max(50).optional().nullable(),
  skin_tone: z.string().max(50).optional().nullable(),
  preferred_colors: z.array(z.string().max(30)).max(20).optional().nullable(),
  preferred_styles: z.array(z.string().max(50)).max(20).optional().nullable(),
  display_name: z.string().max(100).optional().nullable(),
  avatar_url: z.string().max(2048).optional().nullable(),
  height_cm: z.number().int().min(50).max(300).optional().nullable(),
}).passthrough().optional().nullable();

const OutfitSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(200).optional().nullable(),
  item_ids: z.array(z.string().uuid()).max(20),
  occasion: z.string().max(100).optional().nullable(),
  season: z.string().max(50).optional().nullable(),
  score: z.number().int().min(0).max(100).optional().nullable(),
  is_ai_generated: z.boolean().optional().nullable(),
  image_url: z.string().max(7000000).optional().nullable(), // Allow large base64 data URLs
}).passthrough();

const WearHistorySchema = z.object({
  id: z.string().uuid().optional(),
  outfit_id: z.string().uuid().optional().nullable(),
  item_ids: z.array(z.string().uuid()).max(20),
  worn_at: z.string().max(50),
  notes: z.string().max(500).optional().nullable(),
  weather_conditions: z.object({
    temp: z.number().min(-100).max(100).optional(),
    condition: z.string().max(100).optional(),
  }).optional().nullable(),
}).passthrough();

const WishlistItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().max(200),
  category: z.string().max(50).optional(),
  brand: z.string().max(100).optional().nullable(),
  status: z.enum(['active', 'wishlist', 'archived']).optional(),
}).passthrough();

const WeatherSchema = z.object({
  temp: z.number().min(-100).max(100),
  condition: z.string().max(100),
}).optional().nullable();

// Style Assistant Request Schema
export const StyleAssistantRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
  closetItems: z.array(ClosetItemSchema).max(500).optional().nullable(),
  outfits: z.array(OutfitSchema).max(100).optional().nullable(),
  wearHistory: z.array(WearHistorySchema).max(100).optional().nullable(),
  wishlist: z.array(WishlistItemSchema).max(100).optional().nullable(),
  profile: ProfileSchema,
  stream: z.boolean().optional().default(true),
});

// Daily Outfit Request Schema
export const DailyOutfitRequestSchema = z.object({
  closetItems: z.array(ClosetItemSchema).max(500).optional().nullable(),
  outfits: z.array(OutfitSchema).max(100).optional().nullable(),
  wearHistory: z.array(WearHistorySchema).max(100).optional().nullable(),
  profile: ProfileSchema,
  weather: WeatherSchema,
  occasion: z.string().max(100).optional().nullable(),
  preferUnwornIds: z.array(z.string().uuid()).max(100).optional().nullable(),
});

// Analyze Outfit Request Schema
export const AnalyzeOutfitRequestSchema = z.object({
  imageUrl: z.string().max(7000000).optional(), // Allow large base64 data URLs
  items: z.array(z.object({
    name: z.string().max(200).optional().nullable(),
    category: z.string().max(50).optional().nullable(),
    color: z.string().max(50).optional().nullable(),
    pattern: z.string().max(50).optional().nullable(),
    brand: z.string().max(100).optional().nullable(),
  }).passthrough()).max(20).optional(),
});

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.errors[0];
      const path = firstError.path.join('.');
      return { 
        success: false, 
        error: `Validation error${path ? ` at '${path}'` : ''}: ${firstError.message}` 
      };
    }
    return { success: false, error: 'Invalid request data' };
  }
}

export type StyleAssistantRequest = z.infer<typeof StyleAssistantRequestSchema>;
export type DailyOutfitRequest = z.infer<typeof DailyOutfitRequestSchema>;
export type AnalyzeOutfitRequest = z.infer<typeof AnalyzeOutfitRequestSchema>;
