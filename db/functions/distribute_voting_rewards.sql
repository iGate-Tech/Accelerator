-- Distribute Voting Rewards Function
-- Purpose: Distributes credit rewards to all voters on an idea.
-- What it does: Awards fixed credits to each user who voted on the specified idea.
-- When to use: Called after idea validation or completion to reward community participation.
-- Dependencies: Requires votes, voting_rewards, and add_credits function.
--
-- Example Scenario 1: Idea completion rewards
-- Before: 5 users voted on idea-123, each should get 10 credits
-- Action: distribute_voting_rewards('550e8400-e29b-41d4-a716-446655440000')
-- Result: 5 voting_rewards records created, 5 credit transactions added
--
-- Example Scenario 2: Empty idea (no rewards)
-- Before: No one has voted on idea-456
-- Action: distribute_voting_rewards('550e8400-e29b-41d4-a716-446655440001')
-- Result: No rewards distributed (no voters)
--
-- Business Logic: Fixed reward amount per vote, rewards all voters regardless of rating or timing.
CREATE OR REPLACE FUNCTION distribute_voting_rewards(p_idea_id UUID) RETURNS VOID AS $$
DECLARE
  reward_amount INTEGER := 10; -- Fixed reward per vote
  voter_record RECORD;
BEGIN
  FOR voter_record IN SELECT user_id FROM votes WHERE idea_id = p_idea_id LOOP
    INSERT INTO voting_rewards (idea_id, voter_id, reward_amount) VALUES (p_idea_id, voter_record.user_id, reward_amount);
    -- Add credits via function
    PERFORM add_credits(voter_record.user_id, reward_amount, 'reward_earned', jsonb_build_object('source', 'voting', 'idea_id', p_idea_id));
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;