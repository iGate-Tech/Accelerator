-- Voting and Rewards Functions
-- Functions for managing voting, rewards distribution, and social features

-- Function to process vote transaction (atomic vote + reward distribution)
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
       FROM votes
       WHERE idea_id = p_idea_id;

       -- Add credits to each voter
       UPDATE profiles SET
          credit_balance = credit_balance + reward_amount,
          total_earned = total_earned + reward_amount,
          last_credit_update = NOW()
       WHERE user_id IN (
          SELECT user_id FROM votes WHERE idea_id = p_idea_id
       );

       -- Create credit transactions
       INSERT INTO credit_transactions (user_id, transaction_type, amount, metadata, status)
       SELECT
          v.user_id,
          'reward_earned',
          reward_amount,
          json_build_object('idea_id', p_idea_id, 'source', 'voting'),
          'active'
       FROM votes v
       WHERE v.idea_id = p_idea_id;

       -- Notify voters
       INSERT INTO notifications (user_id, type, message)
       SELECT
          v.user_id,
          'reward_earned',
          'You earned ' || reward_amount || ' credits for voting on an idea!'
       FROM votes v
       WHERE v.idea_id = p_idea_id;

       -- Log activity
       PERFORM log_activity(p_user_id, 'vote_reward_distributed', 'idea', p_idea_id,
          json_build_object('voters_rewarded', voter_count, 'reward_amount', reward_amount));
    END IF;

    -- Log the vote
    PERFORM log_activity(p_user_id, 'vote_cast', 'idea', p_idea_id,
       json_build_object('rating', p_rating));

    RETURN json_build_object(
       'success', true,
       'vote_count', voter_count,
       'rewards_distributed', CASE WHEN voter_count % reward_threshold = 0 THEN voter_count ELSE 0 END,
       'reward_amount', CASE WHEN voter_count % reward_threshold = 0 THEN reward_amount ELSE 0 END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate voting rewards for an idea
CREATE OR REPLACE FUNCTION calculate_voting_rewards(p_idea_id UUID)
RETURNS JSON AS $$
DECLARE
    reward_amount INTEGER := 10;
    voter_count INTEGER;
    total_rewards INTEGER;
BEGIN
    -- Count voters
    SELECT COUNT(*) INTO voter_count FROM votes WHERE idea_id = p_idea_id;

    IF voter_count = 0 THEN
       RETURN json_build_object('success', false, 'error', 'No votes found');
    END IF;

    total_rewards := voter_count * reward_amount;

    -- Insert rewards (if not already exist)
    INSERT INTO voting_rewards (idea_id, voter_id, reward_amount, distributed_at)
    SELECT p_idea_id, user_id, reward_amount, NOW()
    FROM votes
    WHERE idea_id = p_idea_id
    ON CONFLICT (idea_id, voter_id) DO NOTHING;

    -- Add credits
    UPDATE profiles SET
       credit_balance = credit_balance + reward_amount,
       total_earned = total_earned + reward_amount,
       last_credit_update = NOW()
    WHERE user_id IN (
       SELECT user_id FROM votes WHERE idea_id = p_idea_id
    );

     -- Create transactions
     INSERT INTO credit_transactions (user_id, transaction_type, amount, metadata, status)
     SELECT
        v.user_id,
        'reward_earned',
        reward_amount,
        json_build_object('idea_id', p_idea_id, 'source', 'voting'),
        'active'
     FROM votes v
     WHERE v.idea_id = p_idea_id;

    RETURN json_build_object(
       'success', true,
       'voters_rewarded', voter_count,
       'total_rewards', total_rewards,
       'reward_per_voter', reward_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to distribute rewards (can be called by scheduled job)
CREATE OR REPLACE FUNCTION distribute_pending_rewards()
RETURNS JSON AS $$
DECLARE
    processed_count INTEGER := 0;
    total_rewards INTEGER := 0;
BEGIN
    -- Find ideas that need reward distribution
    -- This is a simplified version - in practice, you'd have more complex logic

    -- For now, just return success
    RETURN json_build_object(
       'success', true,
       'processed_ideas', processed_count,
       'total_rewards_distributed', total_rewards
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and cast vote
CREATE OR REPLACE FUNCTION validate_and_cast_vote(p_idea_id UUID, p_user_id UUID, p_rating INTEGER)
RETURNS JSON AS $$
DECLARE
   idea_data RECORD;
BEGIN
   -- Get idea data
   SELECT * INTO idea_data FROM ideas WHERE id = p_idea_id;

   IF NOT FOUND THEN
     RETURN json_build_object('success', false, 'error', 'Idea not found');
   END IF;

   IF idea_data.privacy != 'public' THEN
     RETURN json_build_object('success', false, 'error', 'Cannot vote on private ideas');
   END IF;

   IF idea_data.user_id = p_user_id THEN
     RETURN json_build_object('success', false, 'error', 'Cannot vote on your own ideas');
   END IF;

   IF p_rating < 1 OR p_rating > 5 THEN
     RETURN json_build_object('success', false, 'error', 'Rating must be between 1 and 5');
   END IF;

   -- Cast vote
   PERFORM cast_vote(p_idea_id, p_user_id, p_rating);

   RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard_data()
RETURNS TABLE (
  idea_id UUID,
  title TEXT,
  user_name TEXT,
  rating DECIMAL(3,2),
  vote_count BIGINT,
  reward_amount INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    p.name,
    i.rating,
    COUNT(v.*) as vote_count,
    COALESCE(SUM(vr.reward_amount), 0)::INTEGER as reward_amount
  FROM ideas i
  JOIN profiles p ON i.user_id = p.user_id
  LEFT JOIN votes v ON i.id = v.idea_id
  LEFT JOIN voting_rewards vr ON i.id = vr.idea_id
  WHERE i.privacy = 'public'
  GROUP BY i.id, i.title, p.name, i.rating
  ORDER BY reward_amount DESC, rating DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;