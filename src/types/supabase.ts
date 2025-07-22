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
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          barcode: string
          name: string
          description: string | null
          category_id: string
          location_id: string
          quantity: number
          unit_price: number | null
          image_url: string | null
          status: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barcode: string
          name: string
          description?: string | null
          category_id: string
          location_id: string
          quantity?: number
          unit_price?: number | null
          image_url?: string | null
          status?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barcode?: string
          name?: string
          description?: string | null
          category_id?: string
          location_id?: string
          quantity?: number
          unit_price?: number | null
          image_url?: string | null
          status?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          id: string
          source_location_id: string
          destination_location_id: string
          requested_by_user_id: string
          approved_by_user_id: string | null
          status: string
          items: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source_location_id: string
          destination_location_id: string
          requested_by_user_id: string
          approved_by_user_id?: string | null
          status?: string
          items: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source_location_id?: string
          destination_location_id?: string
          requested_by_user_id?: string
          approved_by_user_id?: string | null
          status?: string
          items?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_source_location_id_fkey"
            columns: ["source_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_destination_location_id_fkey"
            columns: ["destination_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            referencedRelation: "users"
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