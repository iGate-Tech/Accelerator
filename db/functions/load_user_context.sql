-- Load User Context Function
-- Purpose: Retrieves complete user context for application sessions.
-- What it does: Gathers user profile, preferences, and related data in single call.
-- When to use: Called when loading user sessions and contexts.
-- Dependencies: Requires profiles, user_settings tables.
--
-- Example Scenario 1: Load user session data
-- Action: load_user_context('user-123')
-- Result: Returns comprehensive user context JSON
--
-- Business Logic: Optimizes user data loading for application performance.
CREATE OR REPLACE FUNCTION load_user_context(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    profile_data JSON;
    settings_data JSON;
BEGIN
    -- Get profile
    SELECT json_build_object(
        'user_id', user_id,
        'name', name,
        'avatar_url', avatar_url,
        'package_type', package_type,
        'credit_balance', credit_balance,
        'total_earned', total_earned,
        'total_spent', total_spent
    ) INTO profile_data
    FROM profiles WHERE user_id = p_user_id;

    -- Get settings
    SELECT json_object_agg(key, value) INTO settings_data
    FROM user_settings WHERE user_id = p_user_id;

    RETURN json_build_object(
        'profile', profile_data,
        'settings', COALESCE(settings_data, '{}'::JSON),
        'loaded_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;