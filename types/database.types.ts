/**
 * Nomekop Bequest - Supabase Database Types
 *
 * Auto-generated type definitions for database schema
 * These types provide TypeScript type safety when working with Supabase
 *
 * To regenerate: npx supabase gen types typescript --local > types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          player_level: number;
          experience_points: number;
          total_playtime: number;
          achievements: Json;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          player_level?: number;
          experience_points?: number;
          total_playtime?: number;
          achievements?: Json;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          player_level?: number;
          experience_points?: number;
          total_playtime?: number;
          achievements?: Json;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_settings: {
        Row: {
          id: string;
          theme: string;
          language: string;
          master_volume: number;
          music_volume: number;
          sfx_volume: number;
          voice_volume: number;
          difficulty: string;
          auto_save_enabled: boolean;
          subtitles_enabled: boolean;
          profile_visibility: string;
          show_online_status: boolean;
          email_notifications: boolean;
          push_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          theme?: string;
          language?: string;
          master_volume?: number;
          music_volume?: number;
          sfx_volume?: number;
          voice_volume?: number;
          difficulty?: string;
          auto_save_enabled?: boolean;
          subtitles_enabled?: boolean;
          profile_visibility?: string;
          show_online_status?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          theme?: string;
          language?: string;
          master_volume?: number;
          music_volume?: number;
          sfx_volume?: number;
          voice_volume?: number;
          difficulty?: string;
          auto_save_enabled?: boolean;
          subtitles_enabled?: boolean;
          profile_visibility?: string;
          show_online_status?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_settings_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string | null;
          ip_address: string | null;
          user_agent: string | null;
          device_info: Json | null;
          country: string | null;
          city: string | null;
          created_at: string;
          last_activity_at: string;
          expires_at: string | null;
          logged_out_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          device_info?: Json | null;
          country?: string | null;
          city?: string | null;
          created_at?: string;
          last_activity_at?: string;
          expires_at?: string | null;
          logged_out_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          device_info?: Json | null;
          country?: string | null;
          city?: string | null;
          created_at?: string;
          last_activity_at?: string;
          expires_at?: string | null;
          logged_out_at?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      wallet_connections: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          wallet_type: string;
          chain_id: number;
          chain_name: string | null;
          is_verified: boolean;
          verified_at: string | null;
          signature: string | null;
          is_primary: boolean;
          nickname: string | null;
          created_at: string;
          updated_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          wallet_type: string;
          chain_id: number;
          chain_name?: string | null;
          is_verified?: boolean;
          verified_at?: string | null;
          signature?: string | null;
          is_primary?: boolean;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_address?: string;
          wallet_type?: string;
          chain_id?: number;
          chain_name?: string | null;
          is_verified?: boolean;
          verified_at?: string | null;
          signature?: string | null;
          is_primary?: boolean;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wallet_connections_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          activity_type: string;
          activity_category: string;
          description: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          session_id: string | null;
          created_at: string;
          severity: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          activity_type: string;
          activity_category: string;
          description?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          session_id?: string | null;
          created_at?: string;
          severity?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          activity_type?: string;
          activity_category?: string;
          description?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          session_id?: string | null;
          created_at?: string;
          severity?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "user_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_stats: {
        Args: {
          target_user_id: string;
        };
        Returns: Json;
      };
      log_activity: {
        Args: {
          p_activity_type: string;
          p_category: string;
          p_description?: string;
          p_metadata?: Json;
          p_severity?: string;
        };
        Returns: string;
      };
      verify_wallet: {
        Args: {
          p_wallet_id: string;
          p_signature: string;
        };
        Returns: boolean;
      };
      cleanup_old_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      theme_type: "light" | "dark" | "auto";
      language_type: "en" | "es" | "fr" | "de" | "ja";
      difficulty_type: "easy" | "normal" | "hard" | "expert";
      profile_visibility_type: "public" | "friends" | "private";
      wallet_type:
        | "metamask"
        | "walletconnect"
        | "coinbase"
        | "phantom"
        | "other";
      activity_category_type:
        | "auth"
        | "profile"
        | "gameplay"
        | "social"
        | "purchase"
        | "settings"
        | "security"
        | "system";
      severity_type: "info" | "warning" | "error" | "critical";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Type helpers for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific type exports for convenience
export type UserProfile = Tables<"user_profiles">;
export type UserSettings = Tables<"user_settings">;
export type UserSession = Tables<"user_sessions">;
export type WalletConnection = Tables<"wallet_connections">;
export type ActivityLog = Tables<"activity_logs">;

export type UserProfileInsert = Inserts<"user_profiles">;
export type UserSettingsInsert = Inserts<"user_settings">;
export type UserSessionInsert = Inserts<"user_sessions">;
export type WalletConnectionInsert = Inserts<"wallet_connections">;
export type ActivityLogInsert = Inserts<"activity_logs">;

export type UserProfileUpdate = Updates<"user_profiles">;
export type UserSettingsUpdate = Updates<"user_settings">;
export type UserSessionUpdate = Updates<"user_sessions">;
export type WalletConnectionUpdate = Updates<"wallet_connections">;
export type ActivityLogUpdate = Updates<"activity_logs">;

// Enum types
export type Theme = Database["public"]["Enums"]["theme_type"];
export type Language = Database["public"]["Enums"]["language_type"];
export type Difficulty = Database["public"]["Enums"]["difficulty_type"];
export type ProfileVisibility =
  Database["public"]["Enums"]["profile_visibility_type"];
export type WalletType = Database["public"]["Enums"]["wallet_type"];
export type ActivityCategory =
  Database["public"]["Enums"]["activity_category_type"];
export type Severity = Database["public"]["Enums"]["severity_type"];

// Function return types
export type UserStatsResult =
  Database["public"]["Functions"]["get_user_stats"]["Returns"];
