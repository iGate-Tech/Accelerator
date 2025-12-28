-- Process Vote Transaction Function
-- Purpose: Handles complete vote processing including validation, insertion, and reward distribution.
-- What it does: Validates vote, inserts vote record, distributes periodic rewards to all voters.
-- When to use: Called when users submit votes on public ideas.
-- Dependencies: Requires votes, ideas, voting_rewards tables, add_credits function.
--
-- Example Scenario 1: Valid first vote
-- Action: process_vote_transaction('user-123', 'idea-456', 4)
-- Result: Vote inserted, returns success JSON
--
-- Example Scenario 2: Self-vote attempt (BLOCKED)
-- Action: process_vote_transaction('user-123', 'idea-owned-by-123', 5)
-- Result: Returns error: 'Cannot vote on your own ideas'
--
-- Example Scenario 3: Vote triggering rewards (5th vote)
-- Before: Idea has 4 votes
-- Action: process_vote_transaction('user-123', 'idea-456', 4)
-- Result: Vote inserted, rewards distributed to all 5 voters (10 credits each)
--
-- Business Logic: Comprehensive vote validation with periodic reward distribution every 5 votes.
CREATE OR REPLACE FUNCTION process_vote_transaction(p_user_id UUID, p_idea_id UUID, p_rating INTEGER)
RETURNS JSON AS $$
DECLARE
    idea_owner UUID;
    voter_count INTEGER;
    reward_threshold INTEGER := 5; -- Reward every 5 votes
    reward_amount INTEGER := 10;
BEGIN
    -- Validate rating
    IF p_rating < 1 OR p_rating > 5 THEN
       RETURN json_build_object('success', false, 'error', 'Rating must be between 1 and 5');
    END IF;

    -- Check if user already voted
    IF EXISTS(SELECT 1 FROM votes WHERE idea_id = p_idea_id AND user_id = p_user_id) THEN
       RETURN json_build_object('success', false, 'error', 'You have already voted on this idea');
    END IF;

    -- Get idea details
    SELECT user_id INTO idea_owner FROM ideas WHERE id = p_idea_id;
    IF idea_owner IS NULL THEN
       RETURN json_build_object('success', false, 'error', 'Idea not found');
    END IF;

    -- Check if idea is public
    IF NOT EXISTS(SELECT 1 FROM ideas WHERE id = p_idea_id AND privacy = 'public') THEN
       RETURN json_build_object('success', false, 'error', 'Cannot vote on private ideas');
    END IF;

    -- Prevent self-voting
    IF idea_owner = p_user_id THEN
       RETURN json_build_object('success', false, 'error', 'Cannot vote on your own ideas');
    END IF;

    -- Insert vote
    INSERT INTO votes (idea_id, user_id, rating) VALUES (p_idea_id, p_user_id, p_rating);

    -- Get updated vote count
    SELECT COUNT(*) INTO voter_count FROM votes WHERE idea_id = p_idea_id;

    -- Check if reward threshold is met
    IF voter_count % reward_threshold = 0 THEN
       -- Distribute rewards to all voters
       INSERT INTO voting_rewards (idea_id, voter_id, reward_amount, distributed_at)
       SELECT p_idea_id, user_id, reward_amount, NOW()
       FROM votes WHERE idea_id = p_idea_id;

       -- Add credits to each voter
       PERFORM add_credits(v.user_id, reward_amount, 'reward_earned',
          jsonb_build_object('source', 'voting_milestone', 'idea_id', p_idea_id, 'milestone', voter_count))
       FROM votes v WHERE v.idea_id = p_idea_id;
    END IF;

    RETURN json_build_object(
       'success', true,
       'vote_count', voter_count,
       'rewards_distributed', (voter_count % reward_threshold = 0),
       'reward_amount', CASE WHEN voter_count % reward_threshold = 0 THEN reward_amount * voter_count ELSE 0 END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;