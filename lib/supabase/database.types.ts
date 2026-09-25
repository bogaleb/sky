// Hand-maintained database types for Phase 1. After linking a Supabase
// project, regenerate with:
//   supabase gen types typescript --linked > lib/supabase/database.types.ts
// and delete this notice.

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
      avatars: {
        Row: {
          id: string;
          name: string;
          species: string;
          role: 'captain' | 'peer' | 'host';
          subject_code: string | null;
          sort_order: number;
        };
        Insert: {
          id: string;
          name: string;
          species: string;
          role: 'captain' | 'peer' | 'host';
          subject_code?: string | null;
          sort_order: number;
        };
        Update: Partial<Database['public']['Tables']['avatars']['Insert']>;
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          nickname: string;
          avatar_id: string;
          age_band: '3-4' | '5-6' | '7-8';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          nickname: string;
          avatar_id: string;
          age_band: '3-4' | '5-6' | '7-8';
        };
        Update: Partial<Database['public']['Tables']['children']['Insert']>;
        Relationships: [];
      };
      parent_settings: {
        Row: {
          child_id: string;
          daily_minutes: number;
          subject_focus: string[];
          age_band_override: '3-4' | '5-6' | '7-8' | null;
          narration_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          child_id: string;
          daily_minutes?: number;
          subject_focus?: string[];
          age_band_override?: '3-4' | '5-6' | '7-8' | null;
          narration_enabled?: boolean;
        };
        Update: Partial<Database['public']['Tables']['parent_settings']['Insert']>;
        Relationships: [];
      };
      parents: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          onboarding_completed: boolean;
          pin_set_at: string | null;
          failed_pin_attempts: number;
          pin_locked_until: string | null;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          onboarding_completed?: boolean;
          locale?: string;
        };
        Update: Partial<Database['public']['Tables']['parents']['Insert']>;
        Relationships: [];
      };
      entitlements: {
        Row: {
          parent_id: string;
          plan: 'free' | 'plus' | 'family';
          status: string;
          renews_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          parent_id: string;
          plan?: 'free' | 'plus' | 'family';
          status?: string;
          renews_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['entitlements']['Insert']>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          child_id: string;
          started_at: string;
          ended_at: string | null;
          end_reason: string | null;
          device_label: string | null;
        };
        Insert: {
          id?: string;
          child_id: string;
          device_label?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ensure_parent_profile: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_parent_profile: {
        Args: Record<string, never>;
        Returns: Json;
      };
      set_parent_pin: {
        Args: { pin: string };
        Returns: Json;
      };
      verify_parent_pin: {
        Args: { pin: string };
        Returns: boolean;
      };
      update_parent_profile: {
        Args: { p_display_name: string | null; p_narration_enabled: boolean | null };
        Returns: Json;
      };
      start_session: {
        Args: { p_child_id: string };
        Returns: string;
      };
      end_session: {
        Args: { p_session_id: string; p_reason?: string };
        Returns: Json;
      };
      fetch_activity_card: {
        Args: { p_child_id: string; p_activity_id: string };
        Returns: Json;
      };
      submit_attempt: {
        Args: {
          p_child_id: string;
          p_activity_id: string;
          p_answer: Json;
          p_latency_ms?: number | null;
          p_session_id?: string | null;
        };
        Returns: Json;
      };
      log_event: {
        Args: {
          p_child_id: string;
          p_event_type: string;
          p_skill_id?: string | null;
          p_activity_id?: string | null;
          p_session_id?: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
