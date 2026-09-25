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
      subjects: {
        Row: {
          code: string;
          name: string;
          tagline: string;
          island_name: string;
          host_character: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          name: string;
          tagline: string;
          island_name: string;
          host_character: string;
          sort_order: number;
        };
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          subject_code: string;
          code: string;
          name: string;
          summary: string;
          age_min: number;
          age_max: number;
          levels: Json;
          sort_order: number;
        };
        Insert: {
          id?: string;
          subject_code: string;
          code: string;
          name: string;
          summary: string;
          age_min: number;
          age_max: number;
          levels: Json;
          sort_order: number;
        };
        Update: Partial<Database['public']['Tables']['skills']['Insert']>;
        Relationships: [];
      };
      skill_prerequisites: {
        Row: {
          skill_id: string;
          requires_skill_id: string;
          requires_level: number;
        };
        Insert: {
          skill_id: string;
          requires_skill_id: string;
          requires_level: number;
        };
        Update: Partial<Database['public']['Tables']['skill_prerequisites']['Insert']>;
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          skill_id: string;
          level: number;
          kind: string;
          prompt_text: string;
          prompt_audio: string | null;
          card: Json;
          answer: Json;
          points: number;
          min_age_band: string | null;
          max_age_band: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill_id: string;
          level: number;
          kind: string;
          prompt_text: string;
          prompt_audio?: string | null;
          card?: Json;
          answer?: Json;
          points?: number;
          min_age_band?: string | null;
          max_age_band?: string | null;
        };
        Update: Partial<Database['public']['Tables']['activities']['Insert']>;
        Relationships: [];
      };
      skill_mastery: {
        Row: {
          child_id: string;
          skill_id: string;
          current_level: number;
          status: 'emerging' | 'developing' | 'proficient' | 'mastered';
          attempts: number;
          correct: number;
          level_attempts: number;
          level_correct: number;
          streak: number;
          best_streak: number;
          last_practiced_at: string | null;
          next_review_at: string | null;
          mastered_at: string | null;
        };
        Insert: {
          child_id: string;
          skill_id: string;
          current_level?: number;
          status?: 'emerging' | 'developing' | 'proficient' | 'mastered';
          attempts?: number;
          correct?: number;
          level_attempts?: number;
          level_correct?: number;
          streak?: number;
          best_streak?: number;
          last_practiced_at?: string | null;
          next_review_at?: string | null;
          mastered_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['skill_mastery']['Insert']>;
        Relationships: [];
      };
      sticker_awards: {
        Row: {
          id: string;
          child_id: string;
          sticker_id: string;
          awarded_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          child_id: string;
          sticker_id: string;
          awarded_at?: string;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['sticker_awards']['Insert']>;
        Relationships: [];
      };
      digest_log: {
        Row: {
          id: string;
          child_id: string;
          week_start: string;
          summary: Json;
          emailed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          week_start: string;
          summary?: Json;
          emailed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['digest_log']['Insert']>;
        Relationships: [];
      };
      learning_events: {
        Row: {
          id: string;
          child_id: string;
          session_id: string | null;
          skill_id: string | null;
          activity_id: string | null;
          event_type: string;
          is_correct: boolean | null;
          latency_ms: number | null;
          difficulty_level: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          session_id?: string | null;
          skill_id?: string | null;
          activity_id?: string | null;
          event_type: string;
          is_correct?: boolean | null;
          latency_ms?: number | null;
          difficulty_level?: number | null;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['learning_events']['Insert']>;
        Relationships: [];
      };
      trail_progress: {
        Row: {
          child_id: string;
          position: number;
          quests_completed: number;
          updated_at: string;
        };
        Insert: {
          child_id: string;
          position?: number;
          quests_completed?: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['trail_progress']['Insert']>;
        Relationships: [];
      };
      streaks: {
        Row: {
          child_id: string;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          updated_at: string;
        };
        Insert: {
          child_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['streaks']['Insert']>;
        Relationships: [];
      };
      quest_progress: {
        Row: {
          child_id: string;
          quest_date: string;
          quest_id: string;
          progress: number;
          goal: number;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          child_id: string;
          quest_date: string;
          quest_id: string;
          progress?: number;
          goal: number;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['quest_progress']['Insert']>;
        Relationships: [];
      };
      star_balances: {
        Row: {
          child_id: string;
          balance: number;
          lifetime_earned: number;
          updated_at: string;
        };
        Insert: {
          child_id: string;
          balance?: number;
          lifetime_earned?: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['star_balances']['Insert']>;
        Relationships: [];
      };
      pets: {
        Row: {
          child_id: string;
          species: string;
          name: string | null;
          stage: string;
          happiness: number;
          feed_count: number;
          updated_at: string;
        };
        Insert: {
          child_id: string;
          species: string;
          name?: string | null;
          stage?: string;
          happiness?: number;
          feed_count?: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['pets']['Insert']>;
        Relationships: [];
      };
      child_outfits: {
        Row: {
          child_id: string;
          outfit_id: string;
          unlocked: boolean;
          equipped: boolean;
        };
        Insert: {
          child_id: string;
          outfit_id: string;
          unlocked?: boolean;
          equipped?: boolean;
        };
        Update: Partial<Database['public']['Tables']['child_outfits']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      award_stars: {
        Args: { p_child_id: string; p_amount: number };
        Returns: number;
      };
      spend_stars: {
        Args: { p_child_id: string; p_amount: number };
        Returns: boolean;
      };
      bump_quest_progress: {
        Args: {
          p_child_id: string;
          p_quest_date: string;
          p_quest_id: string;
          p_amount: number;
          p_goal: number;
        };
        Returns: Array<{ progress: number; completed: boolean; newly_completed: boolean }>;
      };
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
