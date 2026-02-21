export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      closet_items: {
        Row: {
          ai_metadata: Json | null
          archive_reason: Database["public"]["Enums"]["archive_reason"] | null
          brand: string | null
          category: Database["public"]["Enums"]["item_category"]
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          last_worn_at: string | null
          name: string
          pattern: string | null
          product_url: string | null
          purchase_date: string | null
          purchase_price: number | null
          season: string[] | null
          status: Database["public"]["Enums"]["item_status"]
          updated_at: string
          user_id: string
          wear_count: number | null
        }
        Insert: {
          ai_metadata?: Json | null
          archive_reason?: Database["public"]["Enums"]["archive_reason"] | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          last_worn_at?: string | null
          name: string
          pattern?: string | null
          product_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          season?: string[] | null
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
          user_id: string
          wear_count?: number | null
        }
        Update: {
          ai_metadata?: Json | null
          archive_reason?: Database["public"]["Enums"]["archive_reason"] | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          last_worn_at?: string | null
          name?: string
          pattern?: string | null
          product_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          season?: string[] | null
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
          user_id?: string
          wear_count?: number | null
        }
        Relationships: []
      }
      outfit_plans: {
        Row: {
          created_at: string
          id: string
          is_worn: boolean | null
          outfit_id: string
          planned_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_worn?: boolean | null
          outfit_id: string
          planned_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_worn?: boolean | null
          outfit_id?: string
          planned_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_plans_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_ai_generated: boolean | null
          item_ids: string[]
          name: string | null
          occasion: string | null
          score: number | null
          season: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          item_ids: string[]
          name?: string | null
          occasion?: string | null
          score?: number | null
          season?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          item_ids?: string[]
          name?: string | null
          occasion?: string | null
          score?: number | null
          season?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accent_color: string | null
          avatar_url: string | null
          body_type: string | null
          created_at: string
          display_name: string | null
          height_cm: number | null
          id: string
          location: string | null
          preferred_colors: string[] | null
          preferred_styles: string[] | null
          skin_tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          avatar_url?: string | null
          body_type?: string | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id?: string
          location?: string | null
          preferred_colors?: string[] | null
          preferred_styles?: string[] | null
          skin_tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          avatar_url?: string | null
          body_type?: string | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id?: string
          location?: string | null
          preferred_colors?: string[] | null
          preferred_styles?: string[] | null
          skin_tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_discover_items: {
        Row: {
          created_at: string
          id: string
          is_liked: boolean | null
          is_saved: boolean | null
          item_data: Json
          item_id: string
          item_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_liked?: boolean | null
          is_saved?: boolean | null
          item_data: Json
          item_id: string
          item_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_liked?: boolean | null
          is_saved?: boolean | null
          item_data?: Json
          item_id?: string
          item_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wear_history: {
        Row: {
          created_at: string
          id: string
          item_ids: string[]
          notes: string | null
          outfit_id: string | null
          user_id: string
          weather_conditions: Json | null
          worn_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_ids: string[]
          notes?: string | null
          outfit_id?: string | null
          user_id: string
          weather_conditions?: Json | null
          worn_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_ids?: string[]
          notes?: string | null
          outfit_id?: string | null
          user_id?: string
          weather_conditions?: Json | null
          worn_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wear_history_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      archive_reason:
        | "disposed"
        | "doesnt_fit"
        | "out_of_style"
        | "seasonal"
        | "replaced"
      item_category:
        | "tops"
        | "bottoms"
        | "dresses"
        | "outerwear"
        | "shoes"
        | "accessories"
        | "bags"
        | "jewelry"
        | "activewear"
        | "swimwear"
        | "sleepwear"
        | "other"
      item_status: "active" | "wishlist" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      archive_reason: [
        "disposed",
        "doesnt_fit",
        "out_of_style",
        "seasonal",
        "replaced",
      ],
      item_category: [
        "tops",
        "bottoms",
        "dresses",
        "outerwear",
        "shoes",
        "accessories",
        "bags",
        "jewelry",
        "activewear",
        "swimwear",
        "sleepwear",
        "other",
      ],
      item_status: ["active", "wishlist", "archived"],
    },
  },
} as const
