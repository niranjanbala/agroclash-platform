-- Seed Data for AgroClash
-- This file contains initial data for badges, quests, and reference information

-- Insert initial badges
INSERT INTO badges (name, description, icon, condition_type, condition_value, rarity) VALUES
('First Steps', 'Welcome to AgroClash! Plant your first crop.', '🌱', 'xp', 10, 'common'),
('Green Thumb', 'Earn 100 XP from farming activities.', '👍', 'xp', 100, 'common'),
('Harvest Master', 'Successfully harvest 5 crops.', '🌾', 'harvest', 5, 'common'),
('Land Owner', 'Create 3 different plots.', '🏞️', 'plots', 3, 'common'),
('Farming Expert', 'Reach level 5.', '🎓', 'xp', 2500, 'rare'),
('Pest Fighter', 'Win 10 pest battles.', '⚔️', 'streak', 10, 'rare'),
('Community Leader', 'Reach 1000 XP.', '👑', 'xp', 1000, 'rare'),
('Plot Master', 'Own 5 different plots.', '🗺️', 'plots', 5, 'rare'),
('Harvest King', 'Harvest 25 crops successfully.', '🏆', 'harvest', 25, 'epic'),
('XP Champion', 'Reach 5000 XP.', '⭐', 'xp', 5000, 'epic'),
('Pest Destroyer', 'Win 50 pest battles.', '🛡️', 'streak', 50, 'epic'),
('Agricultural Legend', 'Reach level 10.', '🌟', 'xp', 10000, 'legendary'),
('Master Farmer', 'Harvest 100 crops.', '🥇', 'harvest', 100, 'legendary'),
('Land Baron', 'Own 10 different plots.', '🏰', 'plots', 10, 'legendary');

-- Insert initial quests
INSERT INTO quests (name, description, quest_type, xp_reward, requirements) VALUES
('Daily Harvest', 'Harvest at least 1 crop today', 'daily', 25, '{"crops_to_harvest": 1}'),
('Weekly Planter', 'Plant 3 new crops this week', 'weekly', 100, '{"crops_to_plant": 3}'),
('Monthly Explorer', 'Create a new plot this month', 'monthly', 200, '{"plots_to_create": 1}'),
('Pest Control', 'Win 2 pest battles', 'daily', 50, '{"battles_to_win": 2}'),
('Market Trader', 'Sell crops worth $100', 'weekly', 75, '{"sales_value": 100}'),
('Weather Watcher', 'Check weather forecast 5 times', 'weekly', 30, '{"weather_checks": 5}'),
('Clan Helper', 'Help 3 clan members', 'weekly', 80, '{"clan_helps": 3}'),
('Resource Manager', 'Use 10 units of any resource', 'daily', 20, '{"resource_usage": 10}'),
('Growth Tracker', 'Update crop status 5 times', 'daily', 15, '{"status_updates": 5}'),
('Social Farmer', 'Join a clan', 'achievement', 150, '{"join_clan": true}');

-- Insert sample market data
INSERT INTO market (crop_name, variety, price_per_kg, currency, market_location, location, trend, volume_available, quality_grade, organic) VALUES
('Tomatoes', 'Cherry', 3.50, 'USD', 'Central Market', ST_Point(-74.0060, 40.7128), 'up', 500, 'A', false),
('Tomatoes', 'Roma', 3.20, 'USD', 'Central Market', ST_Point(-74.0060, 40.7128), 'stable', 750, 'A', false),
('Tomatoes', 'Beefsteak', 4.00, 'USD', 'Central Market', ST_Point(-74.0060, 40.7128), 'up', 300, 'A+', true),
('Corn', 'Sweet', 0.85, 'USD', 'Farmers Market', ST_Point(-74.0160, 40.7228), 'down', 2000, 'B', false),
('Corn', 'Field', 0.75, 'USD', 'Wholesale District', ST_Point(-74.0260, 40.7328), 'stable', 5000, 'B', false),
('Wheat', 'Winter', 0.95, 'USD', 'Regional Hub', ST_Point(-73.9960, 40.7028), 'up', 3000, 'A', false),
('Wheat', 'Spring', 0.90, 'USD', 'Regional Hub', ST_Point(-73.9960, 40.7028), 'stable', 2500, 'A', false),
('Rice', 'Basmati', 1.20, 'USD', 'Export Terminal', ST_Point(-74.0360, 40.7428), 'up', 1000, 'A+', true),
('Rice', 'Jasmine', 1.15, 'USD', 'Export Terminal', ST_Point(-74.0360, 40.7428), 'stable', 1200, 'A', false),
('Soybeans', 'Yellow', 1.10, 'USD', 'Processing Plant', ST_Point(-73.9860, 40.6928), 'down', 4000, 'B+', false),
('Potatoes', 'Russet', 0.70, 'USD', 'Local Co-op', ST_Point(-74.0460, 40.7528), 'stable', 3500, 'B', false),
('Potatoes', 'Red', 0.75, 'USD', 'Local Co-op', ST_Point(-74.0460, 40.7528), 'up', 2000, 'B+', false),
('Onions', 'Yellow', 0.90, 'USD', 'Central Market', ST_Point(-74.0060, 40.7128), 'stable', 1500, 'A', false),
('Onions', 'Red', 1.10, 'USD', 'Central Market', ST_Point(-74.0060, 40.7128), 'up', 800, 'A', true),
('Carrots', 'Orange', 1.30, 'USD', 'Farmers Market', ST_Point(-74.0160, 40.7228), 'stable', 1000, 'A', false),
('Carrots', 'Baby', 2.50, 'USD', 'Farmers Market', ST_Point(-74.0160, 40.7228), 'up', 200, 'A+', true),
('Lettuce', 'Iceberg', 2.20, 'USD', 'Central Market', ST_Point(-74.0060, 40.7128), 'down', 600, 'B+', false),
('Lettuce', 'Romaine', 2.40, 'USD', 'Central Market', ST_Point(-74.0060, 40.7128), 'stable', 500, 'A', true),
('Peppers', 'Bell', 3.00, 'USD', 'Farmers Market', ST_Point(-74.0160, 40.7228), 'up', 400, 'A', false),
('Peppers', 'Jalapeño', 4.50, 'USD', 'Farmers Market', ST_Point(-74.0160, 40.7228), 'stable', 150, 'A+', true);

-- Insert sample weather events
INSERT INTO weather_events (location, event_type, severity, title, description, temperature, humidity, wind_speed, precipitation, start_time, end_time) VALUES
(ST_Point(-74.0060, 40.7128), 'rain', 'medium', 'Moderate Rain Expected', 'Moderate rainfall expected over the next 24 hours. Good for crops but ensure proper drainage.', 22.5, 75, 15.0, 25.0, NOW() + INTERVAL '2 hours', NOW() + INTERVAL '26 hours'),
(ST_Point(-74.0160, 40.7228), 'heat', 'high', 'Heat Wave Warning', 'Extreme temperatures expected. Increase irrigation frequency and provide shade for sensitive crops.', 38.0, 45, 8.0, 0.0, NOW() + INTERVAL '1 day', NOW() + INTERVAL '4 days'),
(ST_Point(-73.9960, 40.7028), 'storm', 'high', 'Severe Storm Alert', 'Severe thunderstorms with high winds expected. Secure equipment and protect crops from damage.', 25.0, 85, 45.0, 50.0, NOW() + INTERVAL '6 hours', NOW() + INTERVAL '12 hours'),
(ST_Point(-74.0260, 40.7328), 'drought', 'medium', 'Dry Conditions Continue', 'Extended dry period continues. Consider increasing irrigation frequency for optimal crop growth.', 30.0, 35, 12.0, 0.0, NOW() - INTERVAL '1 week', NOW() + INTERVAL '1 week'),
(ST_Point(-74.0360, 40.7428), 'frost', 'low', 'Frost Possible Tonight', 'Light frost possible overnight. Cover sensitive plants and young seedlings.', 2.0, 90, 5.0, 0.0, NOW() + INTERVAL '8 hours', NOW() + INTERVAL '14 hours');

-- Create some sample clans
INSERT INTO clans (name, description, leader_id, is_public) VALUES
('Green Thumbs United', 'A community of passionate organic farmers sharing knowledge and resources.', '00000000-0000-0000-0000-000000000001', true),
('Tech Farmers', 'Modern farmers using technology to optimize crop yields and sustainability.', '00000000-0000-0000-0000-000000000002', true),
('Local Harvest Co-op', 'Supporting local food systems and community-supported agriculture.', '00000000-0000-0000-0000-000000000003', true),
('Sustainable Growers', 'Focused on environmentally friendly farming practices and soil health.', '00000000-0000-0000-0000-000000000004', true),
('Urban Farmers', 'City-based farmers making the most of small spaces and vertical growing.', '00000000-0000-0000-0000-000000000005', true);

-- Note: The leader_id values above are placeholder UUIDs. In a real deployment, 
-- these would be replaced with actual user IDs after users are created.

-- Insert some sample notifications templates (these would be used by the notification system)
-- Note: These are just examples and would typically be created dynamically by the application

-- Create a function to generate sample data for testing
CREATE OR REPLACE FUNCTION generate_sample_user_data(user_id UUID, user_name TEXT)
RETURNS VOID AS $$
DECLARE
    plot_id UUID;
    crop_id UUID;
BEGIN
    -- Create a sample plot
    INSERT INTO plots (user_id, name, description, geometry, soil_type, irrigation_type)
    VALUES (
        user_id,
        user_name || '''s Farm',
        'My first farming plot in AgroClash',
        ST_GeomFromText('POLYGON((-74.01 40.71, -74.00 40.71, -74.00 40.72, -74.01 40.72, -74.01 40.71))', 4326),
        'Loamy',
        'Drip'
    )
    RETURNING id INTO plot_id;
    
    -- Plant some sample crops
    INSERT INTO crops (plot_id, name, variety, sown_date, expected_harvest_date, status, growth_stage, quantity_planted)
    VALUES 
    (plot_id, 'Tomatoes', 'Cherry', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 'growing', 'vegetative', 20),
    (plot_id, 'Lettuce', 'Romaine', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '30 days', 'growing', 'vegetative', 50);
    
    -- Add some resources
    INSERT INTO resources (user_id, resource_type, quantity, unit, cost_per_unit)
    VALUES 
    (user_id, 'water', 1000.0, 'liters', 0.01),
    (user_id, 'fertilizer', 50.0, 'kg', 2.50),
    (user_id, 'seeds', 100.0, 'packets', 1.00);
    
    -- Award some initial XP
    PERFORM update_user_xp(user_id, 50, 'welcome_bonus', 'Welcome to AgroClash!');
    
    -- Check for badges
    PERFORM check_and_award_badges(user_id);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance on seed data
CREATE INDEX IF NOT EXISTS idx_market_crop_variety ON market(crop_name, variety);
CREATE INDEX IF NOT EXISTS idx_weather_events_time_location ON weather_events(start_time, location);
CREATE INDEX IF NOT EXISTS idx_badges_condition ON badges(condition_type, condition_value);
CREATE INDEX IF NOT EXISTS idx_quests_type_active ON quests(quest_type, is_active);