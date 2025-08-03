-- Database Functions and Triggers for AgroClash
-- This file contains stored procedures and triggers for business logic

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clans_updated_at 
    BEFORE UPDATE ON clans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plots_updated_at 
    BEFORE UPDATE ON plots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crops_updated_at 
    BEFORE UPDATE ON crops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_updated_at 
    BEFORE UPDATE ON market
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user XP and level
CREATE OR REPLACE FUNCTION update_user_xp(user_id UUID, xp_amount INTEGER, action_type TEXT DEFAULT NULL, description TEXT DEFAULT NULL)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, level_up BOOLEAN) AS $$
DECLARE
    old_xp INTEGER;
    old_level INTEGER;
    calculated_new_xp INTEGER;
    calculated_new_level INTEGER;
    did_level_up BOOLEAN := FALSE;
BEGIN
    -- Get current XP and level
    SELECT xp, level INTO old_xp, old_level
    FROM users WHERE id = user_id;
    
    IF old_xp IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_id;
    END IF;
    
    -- Calculate new XP (ensure it doesn't go below 0)
    calculated_new_xp := GREATEST(0, old_xp + xp_amount);
    
    -- Calculate new level using the formula: level = floor(sqrt(xp / 100)) + 1
    calculated_new_level := FLOOR(SQRT(calculated_new_xp / 100.0)) + 1;
    
    -- Check if user leveled up
    did_level_up := calculated_new_level > old_level;
    
    -- Update user XP and level
    UPDATE users 
    SET xp = calculated_new_xp, level = calculated_new_level
    WHERE id = user_id;
    
    -- Log the XP change if it's positive
    IF xp_amount > 0 THEN
        INSERT INTO xp_logs (user_id, action_type, xp_awarded, description)
        VALUES (user_id, COALESCE(action_type, 'manual_award'), xp_amount, description);
    END IF;
    
    -- Update clan total XP if user is in a clan
    UPDATE clans 
    SET total_xp = (
        SELECT COALESCE(SUM(xp), 0) 
        FROM users 
        WHERE clan_id = clans.id
    )
    WHERE id = (SELECT clan_id FROM users WHERE id = user_id);
    
    RETURN QUERY SELECT calculated_new_xp, calculated_new_level, did_level_up;
END;
$$ LANGUAGE plpgsql;

-- Function to handle clan membership changes
CREATE OR REPLACE FUNCTION update_clan_member_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle user joining a clan
    IF NEW.clan_id IS NOT NULL AND (OLD.clan_id IS NULL OR OLD.clan_id != NEW.clan_id) THEN
        -- Increment new clan member count
        UPDATE clans 
        SET member_count = member_count + 1,
            total_xp = total_xp + NEW.xp
        WHERE id = NEW.clan_id;
        
        -- Decrement old clan member count if user was in a different clan
        IF OLD.clan_id IS NOT NULL AND OLD.clan_id != NEW.clan_id THEN
            UPDATE clans 
            SET member_count = member_count - 1,
                total_xp = total_xp - OLD.xp
            WHERE id = OLD.clan_id;
        END IF;
    END IF;
    
    -- Handle user leaving a clan
    IF OLD.clan_id IS NOT NULL AND NEW.clan_id IS NULL THEN
        UPDATE clans 
        SET member_count = member_count - 1,
            total_xp = total_xp - OLD.xp
        WHERE id = OLD.clan_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for clan membership changes
CREATE TRIGGER update_clan_member_count_trigger
    AFTER UPDATE OF clan_id ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_clan_member_count();

-- Function to handle user XP changes and update clan total
CREATE OR REPLACE FUNCTION update_clan_xp_on_user_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update clan total XP when user XP changes
    IF NEW.clan_id IS NOT NULL AND NEW.xp != OLD.xp THEN
        UPDATE clans 
        SET total_xp = (
            SELECT COALESCE(SUM(xp), 0) 
            FROM users 
            WHERE clan_id = NEW.clan_id
        )
        WHERE id = NEW.clan_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user XP changes
CREATE TRIGGER update_clan_xp_trigger 
    AFTER UPDATE OF xp ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_clan_xp_on_user_change();

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id UUID)
RETURNS TABLE(badge_id UUID, badge_name TEXT) AS $$
DECLARE
    user_record RECORD;
    badge_record RECORD;
    user_stats RECORD;
BEGIN
    -- Get user information
    SELECT * INTO user_record FROM users WHERE id = user_id;
    
    IF user_record IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate user statistics
    SELECT 
        COUNT(DISTINCT p.id) as plot_count,
        COUNT(DISTINCT c.id) as total_crops,
        COUNT(DISTINCT CASE WHEN c.status = 'harvested' THEN c.id END) as harvested_crops,
        COUNT(DISTINCT CASE WHEN pb.status = 'resolved' THEN pb.id END) as resolved_battles
    INTO user_stats
    FROM plots p
    LEFT JOIN crops c ON p.id = c.plot_id
    LEFT JOIN pest_battles pb ON p.id = pb.plot_id
    WHERE p.user_id = user_id;
    
    -- Check each badge condition
    FOR badge_record IN 
        SELECT b.* FROM badges b 
        WHERE b.is_active = true 
        AND b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_badges.user_id = user_id)
    LOOP
        CASE badge_record.condition_type
            WHEN 'xp' THEN
                IF user_record.xp >= badge_record.condition_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (user_id, badge_record.id);
                    RETURN QUERY SELECT badge_record.id, badge_record.name;
                END IF;
            WHEN 'harvest' THEN
                IF user_stats.harvested_crops >= badge_record.condition_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (user_id, badge_record.id);
                    RETURN QUERY SELECT badge_record.id, badge_record.name;
                END IF;
            WHEN 'plots' THEN
                IF user_stats.plot_count >= badge_record.condition_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (user_id, badge_record.id);
                    RETURN QUERY SELECT badge_record.id, badge_record.name;
                END IF;
            WHEN 'streak' THEN
                IF user_stats.resolved_battles >= badge_record.condition_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (user_id, badge_record.id);
                    RETURN QUERY SELECT badge_record.id, badge_record.name;
                END IF;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new user profile (called after Supabase auth)
CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID, user_email TEXT, user_name TEXT)
RETURNS UUID AS $$
BEGIN
    INSERT INTO users (id, email, name)
    VALUES (user_id, user_email, user_name)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name;
    
    -- Award welcome badge
    PERFORM check_and_award_badges(user_id);
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard(user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user', (
            SELECT json_build_object(
                'id', u.id,
                'name', u.name,
                'xp', u.xp,
                'level', u.level,
                'clan_name', c.name
            )
            FROM users u
            LEFT JOIN clans c ON u.clan_id = c.id
            WHERE u.id = user_id
        ),
        'plots', (
            SELECT json_agg(
                json_build_object(
                    'id', p.id,
                    'name', p.name,
                    'area_hectares', p.area_hectares,
                    'crop_count', (SELECT COUNT(*) FROM crops WHERE plot_id = p.id AND status != 'harvested')
                )
            )
            FROM plots p
            WHERE p.user_id = user_id AND p.is_active = true
        ),
        'active_battles', (
            SELECT COUNT(*)
            FROM pest_battles pb
            JOIN plots p ON pb.plot_id = p.id
            WHERE p.user_id = user_id AND pb.status = 'active'
        ),
        'recent_xp', (
            SELECT json_agg(
                json_build_object(
                    'action_type', xl.action_type,
                    'xp_awarded', xl.xp_awarded,
                    'description', xl.description,
                    'created_at', xl.created_at
                )
            )
            FROM xp_logs xl
            WHERE xl.user_id = user_id
            ORDER BY xl.created_at DESC
            LIMIT 5
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get clan leaderboard
CREATE OR REPLACE FUNCTION get_clan_leaderboard(clan_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    user_id UUID,
    name TEXT,
    xp INTEGER,
    level INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.xp,
        u.level,
        ROW_NUMBER() OVER (ORDER BY u.xp DESC)::INTEGER as rank
    FROM users u
    WHERE u.clan_id = clan_id
    ORDER BY u.xp DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate crop growth progress
CREATE OR REPLACE FUNCTION calculate_crop_progress(crop_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    crop_record RECORD;
    days_since_sown INTEGER;
    expected_days INTEGER;
    progress DECIMAL;
BEGIN
    SELECT * INTO crop_record FROM crops WHERE id = crop_id;
    
    IF crop_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate days since sown
    days_since_sown := CURRENT_DATE - crop_record.sown_date;
    
    -- Calculate expected growing period
    IF crop_record.expected_harvest_date IS NOT NULL THEN
        expected_days := crop_record.expected_harvest_date - crop_record.sown_date;
        progress := LEAST(1.0, days_since_sown::DECIMAL / expected_days::DECIMAL);
    ELSE
        -- Default to 90 days if no expected harvest date
        progress := LEAST(1.0, days_since_sown::DECIMAL / 90.0);
    END IF;
    
    RETURN GREATEST(0, progress);
END;
$$ LANGUAGE plpgsql;

-- Function to get nearby weather events
CREATE OR REPLACE FUNCTION get_nearby_weather_events(user_location POINT, radius_km INTEGER DEFAULT 50)
RETURNS TABLE(
    event_id UUID,
    event_type weather_event_type,
    severity alert_severity,
    title TEXT,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        we.id,
        we.event_type,
        we.severity,
        we.title,
        we.description,
        we.start_time,
        (ST_Distance(user_location::geography, we.location::geography) / 1000)::DECIMAL as distance_km
    FROM weather_events we
    WHERE we.is_active = true
    AND ST_DWithin(user_location::geography, we.location::geography, radius_km * 1000)
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to suggest optimal planting times
CREATE OR REPLACE FUNCTION get_planting_suggestions(user_location POINT)
RETURNS TABLE(
    crop_name TEXT,
    best_planting_month INTEGER,
    expected_harvest_month INTEGER,
    reason TEXT
) AS $$
BEGIN
    -- This is a simplified version - in reality, this would use complex agricultural data
    RETURN QUERY
    SELECT 
        'Tomatoes'::TEXT,
        3::INTEGER, -- March
        6::INTEGER, -- June
        'Optimal temperature and rainfall conditions'::TEXT
    UNION ALL
    SELECT 
        'Corn'::TEXT,
        4::INTEGER, -- April
        8::INTEGER, -- August
        'Good soil temperature and growing season length'::TEXT
    UNION ALL
    SELECT 
        'Wheat'::TEXT,
        10::INTEGER, -- October
        5::INTEGER, -- May (next year)
        'Winter wheat variety suitable for climate'::TEXT;
END;
$$ LANGUAGE plpgsql;