-- Handle User Registration Function
-- Purpose: Processes new user registration with profile creation and initial setup.
-- What it does: Creates user profile, sets defaults, logs registration activity.
-- When to use: Called when new users sign up for the platform.
-- Dependencies: Requires profiles table, log_activity function.
--
-- Example Scenario 1: New user registration
-- Action: handle_user_registration('user-123', '{"name": "Alice", "source": "web"}')
-- Result: Creates profile with initial credits, logs registration
--
-- Business Logic: Standardizes user onboarding with consistent initial setup.
CREATE OR REPLACE FUNCTION handle_user_registration(p_user_id UUID, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
BEGIN
    INSERT INTO profiles (
        user_id,
        name,
        package_type,
        credit_balance,
        created_at
    ) VALUES (
        p_user_id,
        COALESCE(p_metadata->>'name', 'New User'),
        'free',
        100, -- Welcome bonus
        NOW()
    );

    -- Log registration
    PERFORM log_activity(p_user_id, 'register', 'user', p_user_id, p_metadata);

    RETURN json_build_object(
        'success', true,
        'user_id', p_user_id,
        'welcome_credits', 100,
        'package_type', 'free'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;