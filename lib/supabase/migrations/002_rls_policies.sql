-- Row Level Security Policies for AgroClash
-- This file contains all RLS policies to secure user data

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow clan members to view each other's basic info
CREATE POLICY "Clan members can view each other" ON users
  FOR SELECT USING (
    clan_id IS NOT NULL AND 
    clan_id = (SELECT clan_id FROM users WHERE id = auth.uid())
  );

-- Clans table policies
CREATE POLICY "Anyone can view public clans" ON clans
  FOR SELECT USING (is_public = true);

CREATE POLICY "Clan members can view their clan" ON clans
  FOR SELECT USING (
    id = (SELECT clan_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Clan leaders can update their clan" ON clans
  FOR UPDATE USING (leader_id = auth.uid());

CREATE POLICY "Users can create clans" ON clans
  FOR INSERT WITH CHECK (leader_id = auth.uid());

-- Plots table policies
CREATE POLICY "Users can manage own plots" ON plots
  FOR ALL USING (auth.uid() = user_id);

-- Allow clan members to view each other's plots (optional feature)
CREATE POLICY "Clan members can view plots" ON plots
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users 
      WHERE clan_id IS NOT NULL 
      AND clan_id = (SELECT clan_id FROM users WHERE id = auth.uid())
    )
  );

-- Crops table policies
CREATE POLICY "Users can manage crops on own plots" ON crops
  FOR ALL USING (
    plot_id IN (SELECT id FROM plots WHERE user_id = auth.uid())
  );

-- Resources table policies
CREATE POLICY "Users can manage own resources" ON resources
  FOR ALL USING (auth.uid() = user_id);

-- XP logs table policies
CREATE POLICY "Users can view own XP logs" ON xp_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP logs" ON xp_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pest battles table policies
CREATE POLICY "Users can manage own pest battles" ON pest_battles
  FOR ALL USING (auth.uid() = user_id);

-- User badges table policies
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can award badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow clan members to view each other's badges for leaderboards
CREATE POLICY "Clan members can view badges" ON user_badges
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users 
      WHERE clan_id IS NOT NULL 
      AND clan_id = (SELECT clan_id FROM users WHERE id = auth.uid())
    )
  );

-- Quests table policies (public read access)
CREATE POLICY "Anyone can view active quests" ON quests
  FOR SELECT USING (is_active = true);

-- User quests table policies
CREATE POLICY "Users can manage own quest progress" ON user_quests
  FOR ALL USING (auth.uid() = user_id);

-- Notifications table policies
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Public read access for reference data
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view market data" ON market FOR SELECT USING (true);
CREATE POLICY "Anyone can view weather events" ON weather_events FOR SELECT USING (is_active = true);

-- Special policies for system operations
-- These allow the application to perform certain operations on behalf of users

-- Allow service role to insert market data
CREATE POLICY "Service role can manage market data" ON market
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role to insert weather events
CREATE POLICY "Service role can manage weather events" ON weather_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role to manage badges
CREATE POLICY "Service role can manage badges" ON badges
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role to manage quests
CREATE POLICY "Service role can manage quests" ON quests
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to check if user is clan leader
CREATE OR REPLACE FUNCTION is_clan_leader(user_id UUID, clan_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM clans 
    WHERE id = clan_id AND leader_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if users are in same clan
CREATE OR REPLACE FUNCTION same_clan(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = user1_id 
    AND u2.id = user2_id
    AND u1.clan_id IS NOT NULL
    AND u1.clan_id = u2.clan_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's clan members (for leaderboards)
CREATE OR REPLACE FUNCTION get_clan_members(user_id UUID)
RETURNS TABLE(member_id UUID, name TEXT, xp INTEGER, level INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.xp, u.level
  FROM users u
  WHERE u.clan_id = (SELECT clan_id FROM users WHERE id = user_id)
  AND u.clan_id IS NOT NULL
  ORDER BY u.xp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate distance between two points (for location-based features)
CREATE OR REPLACE FUNCTION calculate_distance(point1 POINT, point2 POINT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ST_Distance(point1::geography, point2::geography) / 1000; -- Return distance in kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;