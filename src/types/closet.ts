export type ItemStatus = 'active' | 'wishlist' | 'archived';
export type ArchiveReason = 'disposed' | 'doesnt_fit' | 'out_of_style' | 'seasonal' | 'replaced';
export type ItemCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories' | 'bags' | 'jewelry' | 'activewear' | 'swimwear' | 'sleepwear' | 'other';

export interface ClosetItem {
  id: string;
  user_id: string;
  name: string;
  category: ItemCategory;
  brand?: string;
  color?: string;
  pattern?: string;
  season?: string[];
  image_url?: string;
  status: ItemStatus;
  archive_reason?: ArchiveReason;
  purchase_date?: string;
  purchase_price?: number;
  product_url?: string;
  wear_count: number;
  last_worn_at?: string;
  ai_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  name?: string;
  item_ids: string[];
  is_ai_generated: boolean;
  occasion?: string;
  season?: string;
  image_url?: string;
  score?: number;
  created_at: string;
  updated_at: string;
}

export interface WearHistory {
  id: string;
  user_id: string;
  outfit_id?: string;
  item_ids: string[];
  worn_at: string;
  notes?: string;
  weather_conditions?: {
    temp?: number;
    condition?: string;
  };
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  body_type?: string;
  skin_tone?: string;
  height_cm?: number;
  preferred_colors?: string[];
  preferred_styles?: string[];
  accent_color?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  dresses: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessories: 'Accessories',
  bags: 'Bags',
  jewelry: 'Jewelry',
  activewear: 'Activewear',
  swimwear: 'Swimwear',
  sleepwear: 'Sleepwear',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  tops: '👕',
  bottoms: '👖',
  dresses: '👗',
  outerwear: '🧥',
  shoes: '👟',
  accessories: '🧣',
  bags: '👜',
  jewelry: '💍',
  activewear: '🏃',
  swimwear: '🩱',
  sleepwear: '🛏️',
  other: '📦',
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
  active: 'In Closet',
  wishlist: 'Wishlist',
  archived: 'Archived',
};

export const ARCHIVE_REASON_LABELS: Record<ArchiveReason, string> = {
  disposed: 'Disposed',
  doesnt_fit: "Doesn't Fit",
  out_of_style: 'Out of Style',
  seasonal: 'Seasonal Storage',
  replaced: 'Replaced',
};
