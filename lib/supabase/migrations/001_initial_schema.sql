-- Initial AgroClash Database Schema Migration
-- This file contains the complete database setup for AgroClash

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE crop_status AS ENUM ('planted', 'growing', 'flowering', 'ready', 'harvested');
CREATE TYPE growth_stage AS ENUM ('seedling', 'vegetative', 'flowering', 'fruiting', 'mature');
CREATE TYPE pest_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE battle_status AS ENUM ('active', 'resolved');
CREATE TYPE weather_event_type AS ENUM ('rain', 'drought', 'frost', 'storm', 'heat');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE price_trend AS ENUM ('up', 'down', 'stable');
CREATE TYPE resource_type AS ENUM ('water', 'fertilizer', 'pesticide', 'seeds');
CREATE TYPE badge_condition AS ENUM ('xp', 'harvest', 'plots', 'streak');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location POINT,
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  clan_id UUID,
  avatar_url TEXT,
  phone TEXT,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clans table
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL CHECK (length(name) >= 3 AND length(name) <= 50),
  description TEXT CHECK (length(description) <= 500),
  leader_id UUID NOT NULL,
  member_count INTEGER DEFAULT 1 CHECK (member_count >= 0),
  total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
  max_members INTEGER DEFAULT 50 CHECK (max_members > 0),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints after both tables are created
ALTER TABLE users ADD CONSTRAINT fk_users_clan FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE SET NULL;
ALTER TABLE clans ADD CONSTRAINT fk_clans_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE;

-- Plots table with PostGIS geometry
CREATE TABLE plots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT CHECK (length(description) <= 500),
  geometry GEOMETRY(POLYGON, 4326) NOT NULL,
  area_hectares DECIMAL(10,4) GENERATED ALWAYS AS (ST_Area(geometry::geography) / 10000) STORED,
  soil_type TEXT,
  irrigation_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crops table
CREATE TABLE crops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  variety TEXT CHECK (length(variety) <= 100),
  sown_date DATE NOT NULL,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  status crop_status DEFAULT 'planted',
  growth_stage growth_stage DEFAULT 'seedling',
  quantity_planted INTEGER CHECK (quantity_planted > 0),
  quantity_harvested INTEGER DEFAULT 0 CHECK (quantity_harvested >= 0),
  notes TEXT CHECK (length(notes) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure harvest date is after sown date
  CONSTRAINT check_harvest_after_sown CHECK (
    expected_harvest_date IS NULL OR expected_harvest_date > sown_date
  ),
  CONSTRAINT check_actual_harvest_after_sown CHECK (
    actual_harvest_date IS NULL OR actual_harvest_date >= sown_date
  )
);

-- Resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL CHECK (length(unit) >= 1 AND length(unit) <= 20),
  cost_per_unit DECIMAL(10,2) CHECK (cost_per_unit >= 0),
  supplier TEXT CHECK (length(supplier) <= 100),
  purchase_date DATE,
  expiry_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate resource types per user
  UNIQUE(user_id, resource_type)
);

-- XP logs table
CREATE TABLE xp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (length(action_type) >= 1 AND length(action_type) <= 50),
  xp_awarded INTEGER NOT NULL CHECK (xp_awarded > 0),
  description TEXT CHECK (length(description) <= 200),
  related_entity_type TEXT, -- 'plot', 'crop', 'pest_battle', etc.
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pest battles table
CREATE TABLE pest_battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  pest_type TEXT NOT NULL CHECK (length(pest_type) >= 1 AND length(pest_type) <= 50),
  pest_name TEXT CHECK (length(pest_name) <= 100),
  severity pest_severity NOT NULL,
  status battle_status DEFAULT 'active',
  xp_reward INTEGER NOT NULL CHECK (xp_reward > 0),
  treatment_used TEXT CHECK (length(treatment_used) <= 200),
  success_rate DECIMAL(3,2) CHECK (success_rate >= 0 AND success_rate <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure resolved_at is after created_at when battle is resolved
  CONSTRAINT check_resolved_after_created CHECK (
    (status = 'active' AND resolved_at IS NULL) OR
    (status = 'resolved' AND resolved_at IS NOT NULL AND resolved_at >= created_at)
  )
);

-- Market table
CREATE TABLE market (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_name TEXT NOT NULL CHECK (length(crop_name) >= 1 AND length(crop_name) <= 100),
  variety TEXT CHECK (length(variety) <= 100),
  price_per_kg DECIMAL(10,2) NOT NULL CHECK (price_per_kg > 0),
  currency TEXT DEFAULT 'USD' CHECK (length(currency) = 3),
  market_location TEXT NOT NULL CHECK (length(market_location) >= 1 AND length(market_location) <= 100),
  location POINT,
  date DATE DEFAULT CURRENT_DATE,
  trend price_trend DEFAULT 'stable',
  volume_available INTEGER CHECK (volume_available >= 0),
  quality_grade TEXT CHECK (length(quality_grade) <= 20),
  organic BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather events table
CREATE TABLE weather_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location POINT NOT NULL,
  event_type weather_event_type NOT NULL,
  severity alert_severity NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description TEXT CHECK (length(description) <= 1000),
  temperature DECIMAL(5,2),
  humidity INTEGER CHECK (humidity >= 0 AND humidity <= 100),
  wind_speed DECIMAL(5,2) CHECK (wind_speed >= 0),
  precipitation DECIMAL(5,2) CHECK (precipitation >= 0),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end_time is after start_time
  CONSTRAINT check_end_after_start CHECK (
    end_time IS NULL OR end_time > start_time
  )
);

-- Badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT NOT NULL CHECK (length(description) >= 1 AND length(description) <= 500),
  icon TEXT NOT NULL CHECK (length(icon) >= 1 AND length(icon) <= 100),
  xp_requirement INTEGER CHECK (xp_requirement >= 0),
  condition_type badge_condition NOT NULL,
  condition_value INTEGER NOT NULL CHECK (condition_value > 0),
  is_active BOOLEAN DEFAULT true,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  
  -- Prevent duplicate badges per user
  UNIQUE(user_id, badge_id)
);

-- Quests table (for gamification)
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT NOT NULL CHECK (length(description) >= 1 AND length(description) <= 500),
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'monthly', 'achievement')),
  xp_reward INTEGER NOT NULL CHECK (xp_reward > 0),
  requirements JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end_date is after start_date
  CONSTRAINT check_quest_end_after_start CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  )
);

-- User quests table (tracks quest progress)
CREATE TABLE user_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
  progress JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate active quests per user
  UNIQUE(user_id, quest_id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 1000),
  type TEXT NOT NULL CHECK (type IN ('weather', 'pest', 'harvest', 'market', 'clan', 'quest', 'system')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_clan_id ON users(clan_id);
CREATE INDEX idx_users_xp ON users(xp DESC);
CREATE INDEX idx_users_level ON users(level DESC);
CREATE INDEX idx_users_location ON users USING GIST(location);

CREATE INDEX idx_clans_leader_id ON clans(leader_id);
CREATE INDEX idx_clans_member_count ON clans(member_count DESC);
CREATE INDEX idx_clans_total_xp ON clans(total_xp DESC);

CREATE INDEX idx_plots_user_id ON plots(user_id);
CREATE INDEX idx_plots_geometry ON plots USING GIST(geometry);
CREATE INDEX idx_plots_area ON plots(area_hectares DESC);
CREATE INDEX idx_plots_active ON plots(is_active);

CREATE INDEX idx_crops_plot_id ON crops(plot_id);
CREATE INDEX idx_crops_status ON crops(status);
CREATE INDEX idx_crops_sown_date ON crops(sown_date);
CREATE INDEX idx_crops_harvest_date ON crops(expected_harvest_date);

CREATE INDEX idx_resources_user_id ON resources(user_id);
CREATE INDEX idx_resources_type ON resources(resource_type);

CREATE INDEX idx_xp_logs_user_id ON xp_logs(user_id);
CREATE INDEX idx_xp_logs_created_at ON xp_logs(created_at DESC);
CREATE INDEX idx_xp_logs_action_type ON xp_logs(action_type);

CREATE INDEX idx_pest_battles_user_id ON pest_battles(user_id);
CREATE INDEX idx_pest_battles_plot_id ON pest_battles(plot_id);
CREATE INDEX idx_pest_battles_status ON pest_battles(status);
CREATE INDEX idx_pest_battles_created_at ON pest_battles(created_at DESC);

CREATE INDEX idx_market_crop_name ON market(crop_name);
CREATE INDEX idx_market_date ON market(date DESC);
CREATE INDEX idx_market_location ON market USING GIST(location);
CREATE INDEX idx_market_price ON market(price_per_kg);

CREATE INDEX idx_weather_events_location ON weather_events USING GIST(location);
CREATE INDEX idx_weather_events_type ON weather_events(event_type);
CREATE INDEX idx_weather_events_start_time ON weather_events(start_time DESC);
CREATE INDEX idx_weather_events_active ON weather_events(is_active);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);

CREATE INDEX idx_quests_type ON quests(quest_type);
CREATE INDEX idx_quests_active ON quests(is_active);
CREATE INDEX idx_quests_dates ON quests(start_date, end_date);

CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_user_quests_status ON user_quests(status);
CREATE INDEX idx_user_quests_started_at ON user_quests(started_at DESC);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);