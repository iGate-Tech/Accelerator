-- Automatic Vote Credit Rewards Trigger
-- Purpose: Rewards idea owners with credits when their ideas receive community votes.
-- What it does: Awards 5 credits to idea owner for each vote received (excluding self-votes).
-- When it fires: AFTER INSERT on votes table.
-- Dependencies: Requires process_credit_transaction() function.
--
-- Example Scenario 1: Community vote reward
-- Before: idea-123 owned by user-A has 10 votes, user-A has 50 credits
-- Action: user-B votes 4.0 on idea-123
-- After: Credit transaction created: user-A gains 5 credits, balance becomes 55
--
-- Example Scenario 2: Self-vote (NO REWARD)
-- Before: user-A has 50 credits
-- Action: user-A votes 5.0 on their own idea-123
-- After: No credit reward (self-votes don't earn credits)
--
-- Business Logic: Incentivizes quality content creation by rewarding community engagement.
-- The 5-credit reward encourages users to create valuable ideas that attract votes.
-- Self-votes are excluded to prevent gaming the system.
CREATE OR REPLACE FUNCTION auto_reward_vote_credits() RETURNS TRIGGER AS $$
DECLARE
  idea_owner UUID;
  reward_amount INTEGER := 5; -- 5 credits per vote received
BEGIN
  -- Get idea owner
  SELECT user_id INTO idea_owner FROM ideas WHERE id = NEW.idea_id;

  -- Don't reward self-votes
  IF idea_owner != NEW.user_id THEN
    -- Award credits to idea owner
    PERFORM process_credit_transaction(
      idea_owner,
      'vote_received',
      reward_amount,
      json_build_object(
        'voter_id', NEW.user_id,
        'idea_id', NEW.idea_id,
        'rating', NEW.rating
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_vote_rewards
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION auto_reward_vote_credits();