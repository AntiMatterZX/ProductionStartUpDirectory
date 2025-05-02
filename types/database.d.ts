export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      audit_log: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string
          details?: Json | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          created_at?: string
        }
      }
      looking_for_options: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          website: string | null
          avatar_url: string | null
          role_id: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          website?: string | null
          avatar_url?: string | null
          role_id?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          website?: string | null
          avatar_url?: string | null
          role_id?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }
      roles: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
        }
      }
      social_links: {
        Row: {
          id: string
          startup_id: string
          platform: string
          url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          startup_id: string
          platform: string
          url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          startup_id?: string
          platform?: string
          url?: string
          created_at?: string
          updated_at?: string
        }
      }
      startups: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          website_url: string | null
          logo_url: string | null
          founding_date: string | null
          employee_count: number | null
          funding_stage: string | null
          funding_amount: number | null
          location: string | null
          category_id: number | null
          user_id: string
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          founding_date?: string | null
          employee_count?: number | null
          funding_stage?: string | null
          funding_amount?: number | null
          location?: string | null
          category_id?: number | null
          user_id: string
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          founding_date?: string | null
          employee_count?: number | null
          funding_stage?: string | null
          funding_amount?: number | null
          location?: string | null
          category_id?: number | null
          user_id?: string
          status?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      startup_looking_for: {
        Row: {
          startup_id: string
          option_id: number
          created_at: string
        }
        Insert: {
          startup_id: string
          option_id: number
          created_at?: string
        }
        Update: {
          startup_id?: string
          option_id?: number
          created_at?: string
        }
      }
      startup_media: {
        Row: {
          id: string
          startup_id: string
          media_type: string
          url: string
          title: string | null
          description: string | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          startup_id: string
          media_type: string
          url: string
          title?: string | null
          description?: string | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          startup_id?: string
          media_type?: string
          url?: string
          title?: string | null
          description?: string | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          startup_id: string
          user_id: string
          vote: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          startup_id: string
          user_id: string
          vote: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          startup_id?: string
          user_id?: string
          vote?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wishlist: {
        Row: {
          id: string
          startup_id: string
          user_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          startup_id: string
          user_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          startup_id?: string
          user_id?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
