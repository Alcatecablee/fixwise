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
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          email_confirmed: boolean
          plan: 'free' | 'starter' | 'professional' | 'business' | 'enterprise' | 'premium'
          subscription_status: 'active' | 'canceled' | 'suspended' | 'trial'
          trial_ends_at: string | null
          subscription_id: string | null
          payment_method: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          email_confirmed?: boolean
          plan?: 'free' | 'starter' | 'professional' | 'business' | 'enterprise' | 'premium'
          subscription_status?: 'active' | 'canceled' | 'suspended' | 'trial'
          trial_ends_at?: string | null
          subscription_id?: string | null
          payment_method?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          email_confirmed?: boolean
          plan?: 'free' | 'starter' | 'professional' | 'business' | 'enterprise' | 'premium'
          subscription_status?: 'active' | 'canceled' | 'suspended' | 'trial'
          trial_ends_at?: string | null
          subscription_id?: string | null
          payment_method?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          default_layers: number[]
          auto_save: boolean
          notifications: boolean
          theme: 'dark' | 'light'
          email_notifications: boolean
          webhook_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_layers?: number[]
          auto_save?: boolean
          notifications?: boolean
          theme?: 'dark' | 'light'
          email_notifications?: boolean
          webhook_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_layers?: number[]
          auto_save?: boolean
          notifications?: boolean
          theme?: 'dark' | 'light'
          email_notifications?: boolean
          webhook_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      analysis_history: {
        Row: {
          id: string
          user_id: string
          filename: string
          timestamp: string
          result: Json
          layers: number[]
          execution_time: number
          project_id: string | null
          session_id: string | null
          api_key_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          timestamp?: string
          result: Json
          layers?: number[]
          execution_time?: number
          project_id?: string | null
          session_id?: string | null
          api_key_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          timestamp?: string
          result?: Json
          layers?: number[]
          execution_time?: number
          project_id?: string | null
          session_id?: string | null
          api_key_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          files: string[]
          stats: Json
          created_at: string
          updated_at: string
          last_analyzed: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          files?: string[]
          stats?: Json
          created_at?: string
          updated_at?: string
          last_analyzed?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          files?: string[]
          stats?: Json
          created_at?: string
          updated_at?: string
          last_analyzed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_analyses: {
        Row: {
          id: string
          project_id: string
          filename: string
          timestamp: string
          result: Json
          layers: number[]
          execution_time: number
          user_id: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          filename: string
          timestamp?: string
          result: Json
          layers?: number[]
          execution_time?: number
          user_id: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          filename?: string
          timestamp?: string
          result?: Json
          layers?: number[]
          execution_time?: number
          user_id?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          key_hash: string
          key_preview: string
          name: string
          permissions: string[]
          rate_limit: Json
          usage_count: number
          hourly_usage: number
          daily_usage: number
          last_hour_reset: string
          last_day_reset: string
          last_used: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          key_hash: string
          key_preview: string
          name: string
          permissions?: string[]
          rate_limit?: Json
          usage_count?: number
          hourly_usage?: number
          daily_usage?: number
          last_hour_reset?: string
          last_day_reset?: string
          last_used?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          key_hash?: string
          key_preview?: string
          name?: string
          permissions?: string[]
          rate_limit?: Json
          usage_count?: number
          hourly_usage?: number
          daily_usage?: number
          last_hour_reset?: string
          last_day_reset?: string
          last_used?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_subscriptions: {
        Row: {
          id: string
          project_id: string
          user_id: string
          plan: string
          billing_period: 'monthly' | 'yearly'
          status: 'active' | 'canceled' | 'suspended'
          created_at: string
          updated_at: string
          next_billing_date: string
          paypal_subscription_id: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          plan: string
          billing_period?: 'monthly' | 'yearly'
          status?: 'active' | 'canceled' | 'suspended'
          created_at?: string
          updated_at?: string
          next_billing_date: string
          paypal_subscription_id?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          plan?: string
          billing_period?: 'monthly' | 'yearly'
          status?: 'active' | 'canceled' | 'suspended'
          created_at?: string
          updated_at?: string
          next_billing_date?: string
          paypal_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_usage: {
        Row: {
          id: string
          project_id: string
          user_id: string
          current_month: string
          monthly_fix_count: number
          total_fix_count: number
          last_fix_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          current_month: string
          monthly_fix_count?: number
          total_fix_count?: number
          last_fix_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          current_month?: string
          monthly_fix_count?: number
          total_fix_count?: number
          last_fix_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}