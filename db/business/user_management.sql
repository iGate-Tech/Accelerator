-- User Management Functions
-- Functions for managing user profiles, registration, and user operations

-- Function to manage user profile operations
CREATE OR REPLACE FUNCTION manage_user_profile(p_user_id UUID, p_action TEXT, p_data JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    result JSON;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = p_user_id) INTO profile_exists;

    CASE p_action
       WHEN 'create' THEN
          IF profile_exists THEN
             RETURN json_build_object('success', false, 'error', 'Profile already exists');
          END IF;

          -- Create profile with defaults
          INSERT INTO profiles (
             user_id,
             name,
             avatar_url,
             credit_balance,
             preferences
          ) VALUES (
             p_user_id,
             COALESCE(p_data->>'name', ''),
             COALESCE(p_data->>'avatar_url', ''),
             COALESCE((p_data->>'initial_credits')::INTEGER, 1000),
             COALESCE(p_data->'preferences', '{}'::JSONB)
          );

          result := json_build_object('success', true, 'message', 'Profile created');

       WHEN 'update' THEN
          IF NOT profile_exists THEN
             RETURN json_build_object('success', false, 'error', 'Profile not found');
          END IF;

          -- Update profile fields
          UPDATE profiles SET
             name = COALESCE(p_data->>'name', name),
             avatar_url = COALESCE(p_data->>'avatar_url', avatar_url),
             preferences = COALESCE(p_data->'preferences', preferences),
             updated_at = NOW()
          WHERE user_id = p_user_id;

          result := json_build_object('success', true, 'message', 'Profile updated');

       WHEN 'get' THEN
          IF NOT profile_exists THEN
             RETURN json_build_object('success', false, 'error', 'Profile not found');
          END IF;

          -- Get profile with package info
          SELECT json_build_object(
             'success', true,
             'profile', json_build_object(
                'user_id', p.user_id,
                'name', p.name,
                'avatar_url', p.avatar_url,
                'credit_balance', p.credit_balance,
                'total_earned', p.total_earned,
                'total_spent', p.total_spent,
                'package_type', p.package_type,
                'package_status', p.package_status,
                'preferences', p.preferences
             ),
             'package', json_build_object(
                'name', pkg.name,
                'features', pkg.features,
                'price_monthly', pkg.price_monthly
             )
          ) INTO result
          FROM profiles p
          LEFT JOIN packages pkg ON p.package_type = pkg.type
          WHERE p.user_id = p_user_id;

       WHEN 'delete' THEN
          IF NOT profile_exists THEN
             RETURN json_build_object('success', false, 'error', 'Profile not found');
          END IF;

          -- Soft delete or anonymize profile
          UPDATE profiles SET
             name = '[Deleted User]',
             avatar_url = NULL,
             preferences = '{}'::JSONB
          WHERE user_id = p_user_id;

          result := json_build_object('success', true, 'message', 'Profile deleted');

       ELSE
          result := json_build_object('success', false, 'error', 'Invalid action');
    END CASE;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_user_registration(p_user_id UUID, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    profile_result JSON;
    package_type TEXT;
BEGIN
    -- Determine initial package based on metadata
    package_type := COALESCE(p_metadata->>'initial_package', 'free');

    -- Validate package type
    IF package_type NOT IN ('free', 'student', 'enterprise') THEN
       package_type := 'free';
    END IF;

    -- Create profile
    SELECT manage_user_profile(p_user_id, 'create',
       json_build_object(
          'name', COALESCE(p_metadata->>'name', ''),
          'avatar_url', COALESCE(p_metadata->>'avatar_url', ''),
          'initial_credits', CASE
             WHEN package_type = 'free' THEN 1000
             WHEN package_type = 'student' THEN 1500
             WHEN package_type = 'enterprise' THEN 5000
             ELSE 1000
          END,
          'package_type', package_type,
          'preferences', json_build_object(
             'language', COALESCE(p_metadata->>'language', 'en'),
             'theme', 'light',
             'notifications', json_build_object('push', true)
          )
       )
    ) INTO profile_result;

    IF NOT (profile_result->>'success')::BOOLEAN THEN
       RETURN profile_result;
    END IF;

    -- Create welcome notification
    PERFORM create_notification(
       p_user_id,
       'welcome',
       'Welcome to Accelerator! You have ' ||
       CASE
          WHEN package_type = 'free' THEN '1000'
          WHEN package_type = 'student' THEN '1500'
          WHEN package_type = 'enterprise' THEN '5000'
          ELSE '1000'
       END || ' credits to start building your ideas.'
    );

    -- Log registration activity
    PERFORM log_activity(p_user_id, 'register', 'user', p_user_id,
       json_build_object('package_type', package_type, 'source', p_metadata->>'source'));

    RETURN json_build_object(
       'success', true,
       'user_id', p_user_id,
       'package_type', package_type,
       'initial_credits', CASE
          WHEN package_type = 'free' THEN 1000
          WHEN package_type = 'student' THEN 1500
          WHEN package_type = 'enterprise' THEN 5000
          ELSE 1000
       END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user package
CREATE OR REPLACE FUNCTION update_user_package(p_user_id UUID, p_package_type TEXT, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    current_package TEXT;
    credit_bonus INTEGER := 0;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = p_user_id) INTO profile_exists;
    IF NOT profile_exists THEN
       RETURN json_build_object('success', false, 'error', 'Profile not found');
    END IF;

    -- Validate package type
    IF p_package_type NOT IN ('free', 'student', 'enterprise') THEN
       RETURN json_build_object('success', false, 'error', 'Invalid package type');
    END IF;

    -- Get current package
    SELECT package_type INTO current_package FROM profiles WHERE user_id = p_user_id;

    -- Calculate credit bonus for upgrades
    IF p_package_type = 'student' AND current_package = 'free' THEN
       credit_bonus := 500;
    ELSIF p_package_type = 'enterprise' AND current_package IN ('free', 'student') THEN
       credit_bonus := 4000;
    END IF;

    -- Update package
    UPDATE profiles SET
       package_type = p_package_type,
       package_status = 'active',
       package_started = NOW(),
       package_expires = CASE
          WHEN p_package_type = 'free' THEN NULL
          ELSE NOW() + INTERVAL '1 month'
       END,
       credit_balance = credit_balance + credit_bonus,
       total_earned = total_earned + credit_bonus,
       last_credit_update = NOW()
    WHERE user_id = p_user_id;

    -- Add credit transaction if bonus given
    IF credit_bonus > 0 THEN
       INSERT INTO credit_transactions (
          user_id,
          transaction_type,
          amount,
          metadata,
          status
       ) VALUES (
          p_user_id,
          'package_upgrade',
          credit_bonus,
          json_build_object('from_package', current_package, 'to_package', p_package_type),
          'active'
       );
    END IF;

    -- Create notification
    PERFORM create_notification(
       p_user_id,
       'package_upgrade',
       'Your package has been upgraded to ' || p_package_type ||
       CASE WHEN credit_bonus > 0 THEN ' with ' || credit_bonus || ' bonus credits!' ELSE '!' END
    );

    -- Log activity
    PERFORM log_activity(p_user_id, 'upgrade_package', 'user', p_user_id,
       json_build_object('from_package', current_package, 'to_package', p_package_type, 'credit_bonus', credit_bonus));

    RETURN json_build_object(
       'success', true,
       'previous_package', current_package,
       'new_package', p_package_type,
       'credit_bonus', credit_bonus,
       'expires_at', CASE
          WHEN p_package_type = 'free' THEN NULL
          ELSE (NOW() + INTERVAL '1 month')::TEXT
       END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to load user context (replaces middleware logic)
CREATE OR REPLACE FUNCTION load_user_context(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_data JSON;
    profile_data JSON;
    projects_data JSON;
    stats_data JSON;
BEGIN
    -- Get profile data
    SELECT json_build_object(
       'user_id', p.user_id,
       'name', p.name,
       'avatar_url', p.avatar_url,
       'credit_balance', p.credit_balance,
       'package_type', p.package_type,
       'package_status', p.package_status,
       'preferences', p.preferences
    ) INTO profile_data
    FROM profiles p
    WHERE p.user_id = p_user_id;

    -- Get user's recent projects
    SELECT json_agg(
       json_build_object(
          'id', i.id,
          'title', i.title,
          'completion_percentage', i.completion_percentage,
          'updated_at', i.updated_at
       )
    ) INTO projects_data
    FROM ideas i
    WHERE i.user_id = p_user_id
    ORDER BY i.updated_at DESC, i.created_at DESC
    LIMIT 10;

    -- Get quick stats
    SELECT json_build_object(
       'total_ideas', COUNT(*),
       'completed_ideas', COUNT(CASE WHEN overall_status = 'completed' THEN 1 END),
       'total_votes', COALESCE(SUM(vote_count), 0),
       'current_credits', (SELECT credit_balance FROM profiles WHERE user_id = p_user_id)
    ) INTO stats_data
    FROM ideas_with_stats
    WHERE user_id = p_user_id;

    RETURN json_build_object(
       'user', profile_data,
       'projects', COALESCE(projects_data, '[]'::JSON),
       'stats', stats_data,
       'success', true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;