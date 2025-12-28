-- Validate Idea Access Function
-- Purpose: Checks if a user has permission to access or modify a specific idea.
-- What it does: Validates ownership for private ideas and allows public access.
-- When to use: Called before any idea modification or private content access.
-- Dependencies: Requires ideas table.
--
-- Example Scenario 1: Owner accessing private idea
-- Action: validate_idea_access('user-123', 'idea-456') -- where user-123 owns idea-456
-- Result: Returns true (access granted)
--
-- Example Scenario 2: Non-owner accessing private idea
-- Action: validate_idea_access('user-789', 'idea-456') -- where user-789 doesn't own idea-456
-- Result: Returns false (access denied)
--
-- Example Scenario 3: Any user accessing public idea
-- Action: validate_idea_access('any-user', 'public-idea-123')
-- Result: Returns true (public access allowed)
--
-- Business Logic: Enforces idea privacy settings while allowing public content access.
CREATE OR REPLACE FUNCTION validate_idea_access(p_user_id UUID, p_idea_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    idea_privacy TEXT;
    idea_owner UUID;
BEGIN
    SELECT privacy, user_id INTO idea_privacy, idea_owner
    FROM ideas WHERE id = p_idea_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Allow access if user owns the idea or idea is public
    RETURN idea_owner = p_user_id OR idea_privacy = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;