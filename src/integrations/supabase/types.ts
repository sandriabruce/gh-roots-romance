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
      admin_matches: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          member_a: string
          member_b: string
          reason: string | null
          score: number
          status: Database["public"]["Enums"]["match_status"]
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          member_a: string
          member_b: string
          reason?: string | null
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          member_a?: string
          member_b?: string
          reason?: string | null
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
        }
        Relationships: []
      }
      matches: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          manual: boolean
          score: number
          status: Database["public"]["Enums"]["match_status"]
          user_a: string
          user_b: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          manual?: boolean
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
          user_a: string
          user_b: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          manual?: boolean
          score?: number
          status?: Database["public"]["Enums"]["match_status"]
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          flagged: boolean
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          flagged?: boolean
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          flagged?: boolean
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string | null
          id: string
          payload: Json | null
          provider: string
          reference: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type?: string | null
          id?: string
          payload?: Json | null
          provider?: string
          reference?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string | null
          id?: string
          payload?: Json | null
          provider?: string
          reference?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          banned: boolean
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          ethnicity: string | null
          first_name: string | null
          flagged: boolean
          gender: string | null
          has_children: string | null
          id: string
          interested_in: string | null
          interests: Json | null
          is_seed: boolean
          location: string | null
          mode: Database["public"]["Enums"]["app_mode"]
          notifications_enabled: boolean | null
          onboarded: boolean
          photos: Json | null
          plan: Database["public"]["Enums"]["plan_tier"]
          privacy_strict: boolean | null
          prompts: Json | null
          relationship_type: string | null
          religion: string | null
          trial_start: string | null
          updated_at: string
          values_text: string | null
          verified: boolean
        }
        Insert: {
          age?: number | null
          banned?: boolean
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          ethnicity?: string | null
          first_name?: string | null
          flagged?: boolean
          gender?: string | null
          has_children?: string | null
          id: string
          interested_in?: string | null
          interests?: Json | null
          is_seed?: boolean
          location?: string | null
          mode?: Database["public"]["Enums"]["app_mode"]
          notifications_enabled?: boolean | null
          onboarded?: boolean
          photos?: Json | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          privacy_strict?: boolean | null
          prompts?: Json | null
          relationship_type?: string | null
          religion?: string | null
          trial_start?: string | null
          updated_at?: string
          values_text?: string | null
          verified?: boolean
        }
        Update: {
          age?: number | null
          banned?: boolean
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          ethnicity?: string | null
          first_name?: string | null
          flagged?: boolean
          gender?: string | null
          has_children?: string | null
          id?: string
          interested_in?: string | null
          interests?: Json | null
          is_seed?: boolean
          location?: string | null
          mode?: Database["public"]["Enums"]["app_mode"]
          notifications_enabled?: boolean | null
          onboarded?: boolean
          photos?: Json | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          privacy_strict?: boolean | null
          prompts?: Json | null
          relationship_type?: string | null
          religion?: string | null
          trial_start?: string | null
          updated_at?: string
          values_text?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          paystack_reference: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          provider: string
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          paystack_reference?: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          provider?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          paystack_reference?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          provider?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          age: number | null
          banned: boolean | null
          bio: string | null
          created_at: string | null
          ethnicity: string | null
          first_name: string | null
          flagged: boolean | null
          gender: string | null
          id: string | null
          interested_in: string | null
          interests: Json | null
          location: string | null
          mode: Database["public"]["Enums"]["app_mode"] | null
          onboarded: boolean | null
          photos: Json | null
          plan: Database["public"]["Enums"]["plan_tier"] | null
          privacy_strict: boolean | null
          prompts: Json | null
          religion: string | null
          updated_at: string | null
          values_text: string | null
          verified: boolean | null
        }
        Insert: {
          age?: number | null
          banned?: boolean | null
          bio?: string | null
          created_at?: string | null
          ethnicity?: string | null
          first_name?: string | null
          flagged?: boolean | null
          gender?: string | null
          id?: string | null
          interested_in?: string | null
          interests?: Json | null
          location?: string | null
          mode?: Database["public"]["Enums"]["app_mode"] | null
          onboarded?: boolean | null
          photos?: Json | null
          plan?: Database["public"]["Enums"]["plan_tier"] | null
          privacy_strict?: boolean | null
          prompts?: Json | null
          religion?: string | null
          updated_at?: string | null
          values_text?: string | null
          verified?: boolean | null
        }
        Update: {
          age?: number | null
          banned?: boolean | null
          bio?: string | null
          created_at?: string | null
          ethnicity?: string | null
          first_name?: string | null
          flagged?: boolean | null
          gender?: string | null
          id?: string | null
          interested_in?: string | null
          interests?: Json | null
          location?: string | null
          mode?: Database["public"]["Enums"]["app_mode"] | null
          onboarded?: boolean | null
          photos?: Json | null
          plan?: Database["public"]["Enums"]["plan_tier"] | null
          privacy_strict?: boolean | null
          prompts?: Json | null
          religion?: string | null
          updated_at?: string | null
          values_text?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_mode: "romance" | "spark"
      app_role: "admin" | "user"
      match_status: "pending" | "active" | "closed"
      plan_tier: "explorer" | "verified" | "premium" | "diamond"
      report_status: "open" | "reviewed" | "dismissed"
      subscription_status: "trial" | "active" | "expired" | "cancelled"
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
      app_mode: ["romance", "spark"],
      app_role: ["admin", "user"],
      match_status: ["pending", "active", "closed"],
      plan_tier: ["explorer", "verified", "premium", "diamond"],
      report_status: ["open", "reviewed", "dismissed"],
      subscription_status: ["trial", "active", "expired", "cancelled"],
    },
  },
} as const
