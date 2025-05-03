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
      startups: {
        Row: {
          id: string
          name: string
          slug: string
          tagline: string | null
          description: string
          website_url: string | null
          founding_date: string | null
          employee_count: number | null
          funding_stage: string | null
          funding_amount: number | null
          location: string | null
          category_id: number | null
          user_id: string
          status: string
          created_at: string
          updated_at: string
          logo_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          looking_for: number[] | null
          media_images: string[] | null
          media_documents: string[] | null
          media_videos: string[] | null
          logo_media_url: string | null
          pitch_deck_url: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          tagline?: string | null
          description: string
          website_url?: string | null
          founding_date?: string | null
          employee_count?: number | null
          funding_stage?: string | null
          funding_amount?: number | null
          location?: string | null
          category_id?: number | null
          user_id: string
          status?: string
          created_at?: string
          updated_at?: string
          logo_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          looking_for?: number[] | null
          media_images?: string[] | null
          media_documents?: string[] | null
          media_videos?: string[] | null
          logo_media_url?: string | null
          pitch_deck_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          tagline?: string | null
          description?: string
          website_url?: string | null
          founding_date?: string | null
          employee_count?: number | null
          funding_stage?: string | null
          funding_amount?: number | null
          location?: string | null
          category_id?: number | null
          user_id?: string
          status?: string
          created_at?: string
          updated_at?: string
          logo_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          looking_for?: number[] | null
          media_images?: string[] | null
          media_documents?: string[] | null
          media_videos?: string[] | null
          logo_media_url?: string | null
          pitch_deck_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startups_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startups_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      
      categories: {
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
        Relationships: []
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
        Relationships: []
      }
      
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
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
  }
}
