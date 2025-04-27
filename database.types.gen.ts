export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      users: {
        Row: {
          admin: boolean | null
          chat_id: string | null
          created_at: string | null
          first_name: string
          id: number
          last_name: string | null
          photo_url: string | null
          pickup_height: number | null
          username: string | null
        }
        Insert: {
          admin?: boolean | null
          chat_id?: string | null
          created_at?: string | null
          first_name: string
          id: number
          last_name?: string | null
          photo_url?: string | null
          pickup_height?: number | null
          username?: string | null
        }
        Update: {
          admin?: boolean | null
          chat_id?: string | null
          created_at?: string | null
          first_name?: string
          id?: number
          last_name?: string | null
          photo_url?: string | null
          pickup_height?: number | null
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
      [_ in never]: never
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

