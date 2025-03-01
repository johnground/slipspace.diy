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
          full_name: string | null
          language: string
          timezone: string
          email_notifications: boolean
          push_notifications: boolean
          newsletter_subscription: boolean
          marketing_emails: boolean
          profile_visibility: string
          data_sharing: boolean
          font_size: string
          color_scheme: string
          social_links: Json
          professional_info: Json
          interests: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          language?: string
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          newsletter_subscription?: boolean
          marketing_emails?: boolean
          profile_visibility?: string
          data_sharing?: boolean
          font_size?: string
          color_scheme?: string
          social_links?: Json
          professional_info?: Json
          interests?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          language?: string
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          newsletter_subscription?: boolean
          marketing_emails?: boolean
          profile_visibility?: string
          data_sharing?: boolean
          font_size?: string
          color_scheme?: string
          social_links?: Json
          professional_info?: Json
          interests?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
