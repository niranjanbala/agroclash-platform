// Core type definitions for AgroClash platform
import { GeoJSON } from 'geojson'

export interface User {
  id: string
  email: string
  name: string
  location?: {
    latitude: number
    longitude: number
  }
  xp: number
  level: number
  clan_id?: string
  created_at: string
  updated_at: string
}

export interface Plot {
  id: string
  user_id: string
  name: string
  geometry: GeoJSON.Polygon
  area_hectares: number
  created_at: string
  updated_at: string
}

export interface Crop {
  id: string
  plot_id: string
  name: string
  variety?: string
  sown_date: string
  expected_harvest_date?: string
  status: 'planted' | 'growing' | 'flowering' | 'ready' | 'harvested'
  growth_stage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'mature'
  created_at: string
  updated_at: string
}

export interface XPLog {
  id: string
  user_id: string
  action_type: string
  xp_awarded: number
  description?: string
  created_at: string
}

export interface Clan {
  id: string
  name: string
  description?: string
  leader_id: string
  member_count: number
  total_xp: number
  created_at: string
}

export interface WeatherData {
  location: {
    latitude: number
    longitude: number
  }
  current: {
    temperature: number
    humidity: number
    wind_speed: number
    description: string
    icon: string
  }
  forecast: WeatherForecast[]
  alerts: WeatherAlert[]
}

export interface WeatherForecast {
  date: string
  temperature_min: number
  temperature_max: number
  humidity: number
  precipitation_chance: number
  description: string
  icon: string
}

export interface WeatherAlert {
  id: string
  type: 'rain' | 'drought' | 'frost' | 'storm' | 'heat'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  start_time: string
  end_time: string
}

export interface MarketPrice {
  crop_name: string
  variety?: string
  price_per_kg: number
  currency: string
  market_location: string
  date: string
  trend: 'up' | 'down' | 'stable'
}

export interface PestBattle {
  id: string
  user_id: string
  plot_id: string
  pest_type: string
  severity: 'low' | 'medium' | 'high'
  status: 'active' | 'resolved'
  xp_reward: number
  created_at: string
  resolved_at?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  xp_requirement?: number
  condition_type: 'xp' | 'harvest' | 'plots' | 'streak'
  condition_value: number
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
}

export interface Location {
  latitude: number
  longitude: number
}

export interface ServiceError {
  type: 'NETWORK_ERROR' | 'API_LIMIT_EXCEEDED' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR'
  message: string
  originalRequest?: any
  resource?: string
}

export type NotificationType = 
  | 'crop_milestone' 
  | 'weather_alert' 
  | 'xp_reward' 
  | 'clan_invite' 
  | 'clan_update' 
  | 'market_alert' 
  | 'pest_battle'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  push_notifications: boolean
  email_notifications: boolean
  crop_updates: boolean
  weather_alerts: boolean
  xp_notifications: boolean
  clan_notifications: boolean
  market_alerts: boolean
  game_notifications: boolean
  quiet_hours_start?: string // HH:MM format
  quiet_hours_end?: string // HH:MM format
  created_at: string
  updated_at: string
}

export interface PushToken {
  id: string
  user_id: string
  token: string
  platform: 'ios' | 'android' | 'web'
  active: boolean
  created_at: string
  updated_at: string
}