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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      identifications: {
        Row: {
          created_at: string | null
          id: string
          sighting_id: string | null
          species_id: string | null
          species_name_text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          sighting_id?: string | null
          species_id?: string | null
          species_name_text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          sighting_id?: string | null
          species_id?: string | null
          species_name_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identifications_sighting_id_fkey"
            columns: ["sighting_id"]
            isOneToOne: false
            referencedRelation: "public_sightings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identifications_sighting_id_fkey"
            columns: ["sighting_id"]
            isOneToOne: false
            referencedRelation: "sightings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identifications_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          has_set_username: boolean
          id: string
          role: Database["public"]["Enums"]["profile_role"] | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          has_set_username?: boolean
          id: string
          role?: Database["public"]["Enums"]["profile_role"] | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          has_set_username?: boolean
          id?: string
          role?: Database["public"]["Enums"]["profile_role"] | null
          username?: string
        }
        Relationships: []
      }
      sightings: {
        Row: {
          country_code: string | null
          created_at: string | null
          found_date: string
          geoprivacy: string
          id: string
          id_status: string
          individual_count: number
          is_backdated: boolean
          latitude: number
          life_stage: string | null
          longitude: number
          notes: string | null
          photo_url: string | null
          rejection_reason: string | null
          species_id: string | null
          species_name_text: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          found_date: string
          geoprivacy?: string
          id?: string
          id_status?: string
          individual_count?: number
          is_backdated?: boolean
          latitude: number
          life_stage?: string | null
          longitude: number
          notes?: string | null
          photo_url?: string | null
          rejection_reason?: string | null
          species_id?: string | null
          species_name_text?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          found_date?: string
          geoprivacy?: string
          id?: string
          id_status?: string
          individual_count?: number
          is_backdated?: boolean
          latitude?: number
          life_stage?: string | null
          longitude?: number
          notes?: string | null
          photo_url?: string | null
          rejection_reason?: string | null
          species_id?: string | null
          species_name_text?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sightings_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          common_name: string | null
          family: string | null
          gbif_key: number | null
          id: string
          is_sensitive: boolean
          scientific_name: string
        }
        Insert: {
          common_name?: string | null
          family?: string | null
          gbif_key?: number | null
          id?: string
          is_sensitive?: boolean
          scientific_name: string
        }
        Update: {
          common_name?: string | null
          family?: string | null
          gbif_key?: number | null
          id?: string
          is_sensitive?: boolean
          scientific_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_sightings: {
        Row: {
          common_name: string | null
          country_code: string | null
          created_at: string | null
          family: string | null
          found_date: string | null
          geoprivacy: string | null
          id: string | null
          id_status: string | null
          individual_count: number | null
          is_backdated: boolean | null
          is_sensitive: boolean | null
          latitude: number | null
          life_stage: string | null
          location_precision: string | null
          longitude: number | null
          notes: string | null
          photo_url: string | null
          poster_username: string | null
          scientific_name: string | null
          species_id: string | null
          species_name_text: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sightings_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_moderator_or_admin: { Args: never; Returns: boolean }
      is_username_available: {
        Args: { desired_username: string }
        Returns: boolean
      }
    }
    Enums: {
      profile_role: "user" | "moderator" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      profile_role: ["user", "moderator", "admin"],
    },
  },
} as const
