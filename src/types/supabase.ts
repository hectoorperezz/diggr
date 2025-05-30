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
      users: {
        Row: {
          id: string
          email: string
          spotify_connected: boolean
          spotify_refresh_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          spotify_connected?: boolean
          spotify_refresh_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          spotify_connected?: boolean
          spotify_refresh_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      playlists: {
        Row: {
          id: string
          user_id: string
          spotify_playlist_id: string | null
          name: string
          description: string | null
          criteria: Json
          track_count: number
          spotify_url: string | null
          image_url: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          spotify_playlist_id?: string | null
          name: string
          description?: string | null
          criteria: Json
          track_count?: number
          spotify_url?: string | null
          image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          spotify_playlist_id?: string | null
          name?: string
          description?: string | null
          criteria?: Json
          track_count?: number
          spotify_url?: string | null
          image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_type: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_stats: {
        Row: {
          id: string
          user_id: string
          playlists_created_count: number
          reset_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          playlists_created_count?: number
          reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          playlists_created_count?: number
          reset_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      [key: string]: unknown
    }
    Enums: {
      [key: string]: unknown
    }
  }
} 