-- Calculate Voting Rewards Function
-- Purpose: Calculates reward distribution for voters on a completed idea.
-- What it does: Determines how many credits each voter should receive based on voting thresholds.
-- When to use: Called internally by reward distribution functions.
-- Dependencies: Requires votes, voting_rewards tables.
--
-- Example Scenario 1: Standard reward calculation
-- Before: Idea has 8 votes
-- Action: calculate_voting_rewards('idea-123')
-- Result: Returns details about reward distribution (used by distribute function)
--
-- Business Logic: Implements the reward algorithm based on vote counts and thresholds.
CREATE OR REPLACE FUNCTION calculate_voting_rewards(p_idea_id UUID)
RETURNS JSON AS $$
DECLARE
    total_votes INTEGER;
    reward_amount INTEGER := 10;
BEGIN
    SELECT COUNT(*) INTO total_votes FROM votes WHERE idea_id = p_idea_id;

    RETURN json_build_object(
        'idea_id', p_idea_id,
        'total_votes', total_votes,
        'reward_per_voter', reward_amount,
        'total_rewards', total_votes * reward_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;