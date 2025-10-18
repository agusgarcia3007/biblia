export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          default_persona: string | null
          locale: string
          created_at: string
        }
        Insert: {
          user_id: string
          default_persona?: string | null
          locale?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          default_persona?: string | null
          locale?: string
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          persona_key: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          persona_key: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          persona_key?: string
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          grounding_refs: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          grounding_refs?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          grounding_refs?: Json | null
          created_at?: string
        }
      }
      prayers: {
        Row: {
          id: string
          user_id: string
          persona_key: string
          intent_tag: string
          content: string
          grounding_refs: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          persona_key: string
          intent_tag: string
          content: string
          grounding_refs?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          persona_key?: string
          intent_tag?: string
          content?: string
          grounding_refs?: Json | null
          created_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          type: 'chat' | 'prayer' | 'verse'
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'chat' | 'prayer' | 'verse'
          payload: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'chat' | 'prayer' | 'verse'
          payload?: Json
          created_at?: string
        }
      }
      streaks: {
        Row: {
          user_id: string
          current_streak: number
          last_active_date: string
        }
        Insert: {
          user_id: string
          current_streak?: number
          last_active_date?: string
        }
        Update: {
          user_id?: string
          current_streak?: number
          last_active_date?: string
        }
      }
      bible_verses: {
        Row: {
          id: string
          book: string
          book_order: number
          chapter: number
          verse: number
          text: string
          is_deuterocanon: boolean
          embedding: string | null // vector type as string for now
        }
        Insert: {
          id?: string
          book: string
          book_order: number
          chapter: number
          verse: number
          text: string
          is_deuterocanon?: boolean
          embedding?: string | null
        }
        Update: {
          id?: string
          book?: string
          book_order?: number
          chapter?: number
          verse?: number
          text?: string
          is_deuterocanon?: boolean
          embedding?: string | null
        }
      }
      saints_personas: {
        Row: {
          key: string
          display_name: string
          style_card: string
          notes: string | null
        }
        Insert: {
          key: string
          display_name: string
          style_card: string
          notes?: string | null
        }
        Update: {
          key?: string
          display_name?: string
          style_card?: string
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_bible_verses: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          book: string
          chapter: number
          verse: number
          text: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
