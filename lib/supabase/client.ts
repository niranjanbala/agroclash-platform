// Supabase client configuration

import { createClient } from '@supabase/supabase-js'
import { config } from '../config/environment'

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// Database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          location: { latitude: number; longitude: number } | null
          xp: number
          level: number
          clan_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          location?: { latitude: number; longitude: number } | null
          xp?: number
          level?: number
          clan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          location?: { latitude: number; longitude: number } | null
          xp?: number
          level?: number
          clan_id?: string | null
          updated_at?: string
        }
      }
      plots: {
        Row: {
          id: string
          user_id: string
          name: string
          geometry: GeoJSON.Polygon
          area_hectares: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          geometry: GeoJSON.Polygon
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          geometry?: GeoJSON.Polygon
          updated_at?: string
        }
      }
      crops: {
        Row: {
          id: string
          plot_id: string
          name: string
          variety: string | null
          sown_date: string
          expected_harvest_date: string | null
          status: 'planted' | 'growing' | 'flowering' | 'ready' | 'harvested'
          growth_stage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'mature'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          name: string
          variety?: string | null
          sown_date: string
          expected_harvest_date?: string | null
          status?: 'planted' | 'growing' | 'flowering' | 'ready' | 'harvested'
          growth_stage?: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'mature'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plot_id?: string
          name?: string
          variety?: string | null
          sown_date?: string
          expected_harvest_date?: string | null
          status?: 'planted' | 'growing' | 'flowering' | 'ready' | 'harvested'
          growth_stage?: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'mature'
          updated_at?: string
        }
      }
      xp_logs: {
        Row: {
          id: string
          user_id: string
          action_type: string
          xp_awarded: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          xp_awarded: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          xp_awarded?: number
          description?: string | null
        }
      }
      clans: {
        Row: {
          id: string
          name: string
          description: string | null
          leader_id: string
          member_count: number
          total_xp: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          leader_id: string
          member_count?: number
          total_xp?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          leader_id?: string
          member_count?: number
          total_xp?: number
        }
      }
      pest_battles: {
        Row: {
          id: string
          user_id: string
          plot_id: string
          pest_type: string
          severity: 'low' | 'medium' | 'high'
          status: 'active' | 'resolved'
          xp_reward: number
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plot_id: string
          pest_type: string
          severity: 'low' | 'medium' | 'high'
          status?: 'active' | 'resolved'
          xp_reward: number
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plot_id?: string
          pest_type?: string
          severity?: 'low' | 'medium' | 'high'
          status?: 'active' | 'resolved'
          xp_reward?: number
          resolved_at?: string | null
        }
      }
    }
  }
}