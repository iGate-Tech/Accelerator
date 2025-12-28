-- Manage User Profile Function
-- Purpose: Comprehensive user profile management with create, read, update operations.
-- What it does: Handles user profile operations with proper validation and logging.
-- When to use: Called for all user profile management operations.
-- Dependencies: Requires profiles table, log_activity function.
--
-- Example Scenario 1: Update profile
-- Action: manage_user_profile('user-123', 'update', '{"name": "John Doe", "bio": "Developer"}')
-- Result: Updates user profile and logs activity
--
-- Example Scenario 2: Get profile
-- Action: manage_user_profile('user-123', 'read', '{}')
-- Result: Returns user profile data
--
-- Business Logic: Centralized user profile management with access control.
CREATE OR REPLACE FUNCTION manage_user_profile(p_user_id UUID, p_action TEXT, p_data JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    profile_record RECORD;
BEGIN
    CASE p_action
        WHEN 'read' THEN
            SELECT * INTO profile_record FROM profiles WHERE user_id = p_user_id;

            IF NOT FOUND THEN
                RETURN json_build_object('success', false, 'error', 'Profile not found');
            END IF;

            RETURN json_build_object(
                'success', true,
                'profile', json_build_object(
                    'user_id', profile_record.user_id,
                    'name', profile_record.name,
                    'bio', profile_record.bio,
                    'avatar_url', profile_record.avatar_url,
                    'package_type', profile_record.package_type,
                    'credit_balance', profile_record.credit_balance,
                    'created_at', profile_record.created_at
                )
            );

        WHEN 'update' THEN
            UPDATE profiles SET
                name = COALESCE(p_data->>'name', name),
                bio = COALESCE(p_data->>'bio', bio),
                avatar_url = COALESCE(p_data->>'avatar_url', avatar_url),
                updated_at = NOW()
            WHERE user_id = p_user_id;

            -- Log activity
            PERFORM log_activity(p_user_id, 'update', 'profile', p_user_id, p_data);

            RETURN json_build_object('success', true, 'action', 'updated');

        WHEN 'create' THEN
            INSERT INTO profiles (user_id, name, bio, avatar_url)
            VALUES (
                p_user_id,
                COALESCE(p_data->>'name', 'User'),
                COALESCE(p_data->>'bio', ''),
                p_data->>'avatar_url'
            );

            -- Log activity
            PERFORM log_activity(p_user_id, 'create', 'profile', p_user_id, p_data);

            RETURN json_build_object('success', true, 'action', 'created');

        ELSE
            RETURN json_build_object('success', false, 'error', 'Invalid action');
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;