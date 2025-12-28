-- Voting Dashboard View
-- This view aggregates voting-related metrics for each user, focusing on their participation in the voting system.
-- It shows:
-- - Total ideas created (as basis for received votes)
-- - Votes received on their ideas
-- - Overall rating across all their ideas
-- - Rewards earned through the voting system
-- - Votes given by the user (their voting activity)
-- - Current credit balance
-- Used for voting analytics and reward tracking dashboards.
--
-- Example usage:
-- SELECT name, total_votes_received, overall_rating, rewards_earned
-- FROM voting_dashboard
-- WHERE user_id = 'user-123';
--
-- Example output:
-- | name  | total_votes_received | overall_rating | rewards_earned | current_credits |
-- |-------|----------------------|----------------|----------------|-----------------|
-- | Alice | 127                  | 4.1            | 15             | 450.00          |
CREATE OR REPLACE VIEW voting_dashboard AS
SELECT
  p.user_id,
  p.name,
  COUNT(DISTINCT i.id) as total_ideas,
  COUNT(DISTINCT v.id) as total_votes_received,
  ROUND(AVG(i.rating), 2) as overall_rating,
  COUNT(DISTINCT vr.id) as rewards_earned,
  COALESCE(SUM(vr.reward_amount), 0) as total_earned_from_rewards,
  COUNT(DISTINCT v_given.id) as votes_given,
  (SELECT credit_balance FROM profiles WHERE user_id = p.user_id) as current_credits
FROM profiles p
LEFT JOIN ideas i ON p.user_id = i.user_id
LEFT JOIN votes v ON i.id = v.idea_id
LEFT JOIN voting_rewards vr ON p.user_id = vr.voter_id
LEFT JOIN votes v_given ON p.user_id = v_given.user_id
GROUP BY p.user_id, p.name;