-- Validate and Cast Vote Function
-- Purpose: Validates voting eligibility and casts vote with comprehensive checks.
-- What it does: Performs all validation before allowing a vote to be cast.
-- When to use: Called for vote submission with full validation requirements.
-- Dependencies: Requires votes, ideas tables.
--
-- Example Scenario 1: Valid vote
-- Action: validate_and_cast_vote('idea-public', 'user-123', 4)
-- Result: Vote cast successfully, returns success JSON
--
-- Example Scenario 2: Double vote attempt
-- Action: validate_and_cast_vote('idea-123', 'user-123', 5) -- user already voted
-- Result: Returns error: 'You have already voted on this idea'
--
-- Example Scenario 3: Private idea vote attempt
-- Action: validate_and_cast_vote('idea-private', 'user-not-owner', 3)
-- Result: Returns error: 'Cannot vote on private ideas'
--
-- Business Logic: Comprehensive validation ensures voting integrity and prevents abuse.
CREATE OR REPLACE FUNCTION validate_and_cast_vote(p_idea_id UUID, p_user_id UUID, p_rating INTEGER)
RETURNS JSON AS $$
DECLARE
    idea_owner UUID;
    idea_privacy TEXT;
BEGIN
    -- Validate rating
    IF p_rating < 1 OR p_rating > 5 THEN
        RETURN json_build_object('success', false, 'error', 'Rating must be between 1 and 5');
    END IF;

    -- Get idea details
    SELECT user_id, privacy INTO idea_owner, idea_privacy
    FROM ideas WHERE id = p_idea_id;

    IF idea_owner IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Idea not found');
    END IF;

    -- Check privacy
    IF idea_privacy != 'public' THEN
        RETURN json_build_object('success', false, 'error', 'Cannot vote on private ideas');
    END IF;

    -- Prevent self-voting
    IF idea_owner = p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Cannot vote on your own ideas');
    END IF;

    -- Check if already voted
    IF EXISTS(SELECT 1 FROM votes WHERE idea_id = p_idea_id AND user_id = p_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'You have already voted on this idea');
    END IF;

    -- Cast vote
    INSERT INTO votes (idea_id, user_id, rating) VALUES (p_idea_id, p_user_id, p_rating);

    RETURN json_build_object(
        'success', true,
        'message', 'Vote cast successfully',
        'idea_id', p_idea_id,
        'rating', p_rating
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;