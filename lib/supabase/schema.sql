-- AgroClash Database Schema
-- Run this in your Supabase SQL editor

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location POINT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  clan_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clans table
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL,
  member_count INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for clan_id
ALTER TABLE users ADD CONSTRAINT fk_users_clan FOREIGN KEY (clan_id) REFERENCES clans(id);
ALTER TABLE clans ADD CONSTRAINT fk_clans_leader FOREIGN KEY (leader_id) REFERENCES users(id);

-- Plots table with PostGIS geometry
CREATE TABLE plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  geometry GEOMETRY(POLYGON, 4326) NOT NULL,
  area_hectares DECIMAL(10,4) GENERATED ALWAYS AS (ST_Area(geometry::geography) / 10000) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crops table
CREATE TABLE crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variety TEXT,
  sown_date DATE NOT NULL,
  expected_harvest_date DATE,
  status TEXT DEFAULT 'planted' CHECK (status IN ('planted', 'growing', 'flowering', 'ready', 'harvested')),
  growth_stage TEXT DEFAULT 'seedling' CHECK (growth_stage IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'mature')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('water', 'fertilizer', 'pesticide', 'seeds')),
  quantity INTEGER DEFAULT 0,
  unit TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XP logs table
CREATE TABLE xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pest battles table
CREATE TABLE pest_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  pest_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  xp_reward INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Market table
CREATE TABLE market (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  variety TEXT,
  price_per_kg DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  market_location TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather events table
CREATE TABLE weather_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location POINT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('rain', 'drought', 'frost', 'storm', 'heat')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_requirement INTEGER,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('xp', 'harvest', 'plots', 'streak')),
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create indexes for better performance
CREATE INDEX idx_plots_user_id ON plots(user_id);
CREATE INDEX idx_plots_geometry ON plots USING GIST(geometry);
CREATE INDEX idx_crops_plot_id ON crops(plot_id);
CREATE INDEX idx_crops_status ON crops(status);
CREATE INDEX idx_xp_logs_user_id ON xp_logs(user_id);
CREATE INDEX idx_xp_logs_created_at ON xp_logs(created_at);
CREATE INDEX idx_pest_battles_user_id ON pest_battles(user_id);
CREATE INDEX idx_pest_battles_status ON pest_battles(status);
CREATE INDEX idx_weather_events_location ON weather_events USING GIST(location);
CREATE INDEX idx_market_crop_name ON market(crop_name);
CREATE INDEX idx_market_date ON market(date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own profile and clan members' basic info
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Clan members can view each other" ON users
  FOR SELECT USING (
    clan_id IS NOT NULL AND 
    clan_id = (SELECT clan_id FROM users WHERE id = auth.uid())
  );

-- Users can manage their own plots
CREATE POLICY "Users can manage own plots" ON plots
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage crops on their plots
CREATE POLICY "Users can manage crops on own plots" ON crops
  FOR ALL USING (
    plot_id IN (SELECT id FROM plots WHERE user_id = auth.uid())
  );

-- Users can manage their own resources
CREATE POLICY "Users can manage own resources" ON resources
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their own XP logs
CREATE POLICY "Users can view own XP logs" ON xp_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own pest battles
CREATE POLICY "Users can manage own pest battles" ON pest_battles
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their own badges
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Public read access for badges and market data
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Anyone can view market data" ON market FOR SELECT USING (true);
CREATE POLICY "Anyone can view weather events" ON weather_events FOR SELECT USING (true);

-- Clans are publicly readable for search
CREATE POLICY "Anyone can view clans" ON clans FOR SELECT USING (true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON plots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON crops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user XP and level
CREATE OR REPLACE FUNCTION update_user_xp(user_id UUID, xp_amount INTEGER)
RETURNS VOID AS $$
DECLARE
    new_xp INTEGER;
    new_level INTEGER;
BEGIN
    -- Update user XP
    UPDATE users 
    SET xp = xp + xp_amount 
    WHERE id = user_id
    RETURNING xp INTO new_xp;
    
    -- Calculate new level
    new_level := FLOOR(SQRT(new_xp / 100)) + 1;
    
    -- Update level if changed
    UPDATE users 
    SET level = new_level 
    WHERE id = user_id AND level != new_level;
END;
$$ LANGUAGE plpgsql;

-- Function to update clan total XP
CREATE OR REPLACE FUNCTION update_clan_xp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clan_id IS NOT NULL THEN
        UPDATE clans 
        SET total_xp = (
            SELECT COALESCE(SUM(xp), 0) 
            FROM users 
            WHERE clan_id = NEW.clan_id
        )
        WHERE id = NEW.clan_id;
    END IF;
    
    IF OLD.clan_id IS NOT NULL AND OLD.clan_id != NEW.clan_id THEN
        UPDATE clans 
        SET total_xp = (
            SELECT COALESCE(SUM(xp), 0) 
            FROM users 
            WHERE clan_id = OLD.clan_id
        )
        WHERE id = OLD.clan_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update clan XP when user XP changes
CREATE TRIGGER update_clan_xp_trigger 
    AFTER UPDATE OF xp ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_clan_xp();

-- Insert some initial badges
INSERT INTO badges (name, description, icon, condition_type, condition_value) VALUES
('First Steps', 'Welcome to AgroClash! Plant your first crop.', '🌱', 'xp', 10),
('Green Thumb', 'Earn 100 XP from farming activities.', '👍', 'xp', 100),
('Harvest Master', 'Successfully harvest 5 crops.', '🌾', 'harvest', 5),
('Land Owner', 'Create 3 different plots.', '🏞️', 'plots', 3),
('Farming Expert', 'Reach level 5.', '🎓', 'xp', 2500),
('Pest Fighter', 'Win 10 pest battles.', '⚔️', 'streak', 10),
('Community Leader', 'Reach 1000 XP.', '👑', 'xp', 1000);