export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      game_locations: {
        Row: {
          address: string
          created_at: string
          google_link: string
          id: string
          name: string
        }
        Insert: {
          address: string
          created_at?: string
          google_link: string
          id?: string
          name: string
        }
        Update: {
          address?: string
          created_at?: string
          google_link?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      game_schedules: {
        Row: {
          created_at: string
          day_of_week: string
          duration_minutes: number
          id: string
          location: string
          players_count: number
          state: string
          time: string
          voting_in_advance_days: number
          voting_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: string
          duration_minutes: number
          id?: string
          location?: string
          players_count: number
          state: string
          time: string
          voting_in_advance_days: number
          voting_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          duration_minutes?: number
          id?: string
          location?: string
          players_count?: number
          state?: string
          time?: string
          voting_in_advance_days?: number
          voting_time?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string
          creator: number
          finisher: number | null
          id: string
          state: string
          team_a: string[]
          team_a_score: number | null
          team_b: string[]
          team_b_score: number | null
        }
        Insert: {
          created_at?: string
          creator: number
          finisher?: number | null
          id?: string
          state: string
          team_a: string[]
          team_a_score?: number | null
          team_b: string[]
          team_b_score?: number | null
        }
        Update: {
          created_at?: string
          creator?: number
          finisher?: number | null
          id?: string
          state?: string
          team_a?: string[]
          team_a_score?: number | null
          team_b?: string[]
          team_b_score?: number | null
        }
        Relationships: []
      }
      points: {
        Row: {
          created_at: string
          id: string
          player_id: number | null
          type: Database["public"]["Enums"]["point_type"]
          winner: Database["public"]["Enums"]["point_winner"]
        }
        Insert: {
          created_at?: string
          id?: string
          player_id?: number | null
          type?: Database["public"]["Enums"]["point_type"]
          winner: Database["public"]["Enums"]["point_winner"]
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: number | null
          type?: Database["public"]["Enums"]["point_type"]
          winner?: Database["public"]["Enums"]["point_winner"]
        }
        Relationships: [
          {
            foreignKeyName: "points_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admin: boolean | null
          allows_write_to_pm: boolean | null
          another_name: string | null
          created_at: string | null
          first_name: string
          id: number
          is_bot: boolean | null
          is_female: boolean
          is_premium: boolean | null
          language_code: string | null
          last_auth: string | null
          last_name: string | null
          photo_url: string | null
          pickup_height: number | null
          power_group: number
          share_stats: boolean
          updated_at: string | null
          username: string | null
        }
        Insert: {
          admin?: boolean | null
          allows_write_to_pm?: boolean | null
          another_name?: string | null
          created_at?: string | null
          first_name: string
          id: number
          is_bot?: boolean | null
          is_female?: boolean
          is_premium?: boolean | null
          language_code?: string | null
          last_auth?: string | null
          last_name?: string | null
          photo_url?: string | null
          pickup_height?: number | null
          power_group?: number
          share_stats?: boolean
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          admin?: boolean | null
          allows_write_to_pm?: boolean | null
          another_name?: string | null
          created_at?: string | null
          first_name?: string
          id?: number
          is_bot?: boolean | null
          is_female?: boolean
          is_premium?: boolean | null
          language_code?: string | null
          last_auth?: string | null
          last_name?: string | null
          photo_url?: string | null
          pickup_height?: number | null
          power_group?: number
          share_stats?: boolean
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          player_a: number | null
          player_b: number | null
          voter_id: number | null
          winner_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          player_a?: number | null
          player_b?: number | null
          voter_id?: number | null
          winner_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          player_a?: number | null
          player_b?: number | null
          voter_id?: number | null
          winner_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_player_a_fkey"
            columns: ["player_a"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_player_b_fkey"
            columns: ["player_b"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_players: {
        Row: {
          created_at: string
          id: string
          player_id: number
          voting_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: number
          voting_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: number
          voting_id?: string
        }
        Relationships: []
      }
      votings: {
        Row: {
          chat_id: number
          created_at: string
          game_schedule_id: string
          game_time: string | null
          id: string
          poll_id: string
          state: string
        }
        Insert: {
          chat_id: number
          created_at?: string
          game_schedule_id: string
          game_time?: string | null
          id?: string
          poll_id: string
          state: string
        }
        Update: {
          chat_id?: number
          created_at?: string
          game_schedule_id?: string
          game_time?: string | null
          id?: string
          poll_id?: string
          state?: string
        }
        Relationships: []
      }
    }
    Views: {
      daily_point_summaries: {
        Row: {
          ace_points: number | null
          attack_points: number | null
          block_points: number | null
          day: string | null
          error_points: number | null
          first_rally_at: string | null
          last_rally_at: string | null
          left_points: number | null
          right_points: number | null
          total_points: number | null
        }
        Relationships: []
      }
      match_summaries: {
        Row: {
          day: string | null
          left_sets: number | null
          match_end: string | null
          match_idx: number | null
          match_start: string | null
          match_winner: string | null
          right_sets: number | null
        }
        Relationships: []
      }
      point_history: {
        Row: {
          created_at: string | null
          day: string | null
          id: string | null
          left_score: number | null
          player_id: number | null
          right_score: number | null
          score_string: string | null
          set_idx: number | null
          type: Database["public"]["Enums"]["point_type"] | null
          winner: Database["public"]["Enums"]["point_winner"] | null
        }
        Relationships: []
      }
      set_summaries: {
        Row: {
          day: string | null
          is_finished: boolean | null
          left_score: number | null
          right_score: number | null
          set_end: string | null
          set_idx: number | null
          set_start: string | null
          set_winner: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_player_ratings: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          first_name: string
          last_name: string
          username: string
          photo_url: string
          rating: number
        }[]
      }
      get_random_vote_pair: {
        Args: { voter_id_param: number }
        Returns: {
          player_a_id: number
          player_a_first_name: string
          player_a_last_name: string
          player_a_username: string
          player_a_photo_url: string
          player_b_id: number
          player_b_first_name: string
          player_b_last_name: string
          player_b_username: string
          player_b_photo_url: string
        }[]
      }
      jwt_claim_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
        }[]
      }
    }
    Enums: {
      point_type: "ace" | "attack" | "block" | "error" | "unspecified"
      point_winner: "left" | "right"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      point_type: ["ace", "attack", "block", "error", "unspecified"],
      point_winner: ["left", "right"],
    },
  },
} as const
