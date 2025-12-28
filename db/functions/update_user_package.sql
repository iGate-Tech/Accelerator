-- Update User Package Function
-- Purpose: Handles package upgrades/downgrades with credit adjustments and validation.
-- What it does: Changes user package type, adjusts credits based on package pricing.
-- When to use: Called for subscription changes and package management.
-- Dependencies: Requires profiles table, process_credit_transaction function.
--
-- Example Scenario 1: Upgrade to student package
-- Action: update_user_package('user-123', 'student', '{"reason": "college_student"}')
-- Result: Updates package, processes credit transaction for pricing difference
--
-- Business Logic: Manages subscription lifecycle with proper credit handling.
CREATE OR REPLACE FUNCTION update_user_package(p_user_id UUID, p_package_type TEXT, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    current_package TEXT;
    price_difference INTEGER;
BEGIN
    -- Get current package
    SELECT package_type INTO current_package FROM profiles WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    -- Calculate price difference (simplified pricing)
    CASE
        WHEN current_package = 'free' AND p_package_type = 'student' THEN price_difference := -50;
        WHEN current_package = 'free' AND p_package_type = 'enterprise' THEN price_difference := -200;
        WHEN current_package = 'student' AND p_package_type = 'enterprise' THEN price_difference := -150;
        WHEN current_package = 'student' AND p_package_type = 'free' THEN price_difference := 50;
        WHEN current_package = 'enterprise' AND p_package_type = 'student' THEN price_difference := 150;
        WHEN current_package = 'enterprise' AND p_package_type = 'free' THEN price_difference := 200;
        ELSE price_difference := 0;
    END CASE;

    -- Update package
    UPDATE profiles SET
        package_type = p_package_type,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Process credit transaction if there's a price difference
    IF price_difference != 0 THEN
        PERFORM process_credit_transaction(
            p_user_id,
            'package_upgrade',
            price_difference,
            p_metadata
        );
    END IF;

    -- Log activity
    PERFORM log_activity(p_user_id, 'update_package', 'user', p_user_id,
        json_build_object('old_package', current_package, 'new_package', p_package_type, 'price_difference', price_difference));

    RETURN json_build_object(
        'success', true,
        'old_package', current_package,
        'new_package', p_package_type,
        'credit_adjustment', price_difference
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;