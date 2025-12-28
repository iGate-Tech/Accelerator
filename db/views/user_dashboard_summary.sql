-- User Dashboard Summary View
-- This view provides a comprehensive summary of user activity and statistics for dashboard display.
-- It aggregates data from profiles, ideas, votes, and voting rewards to show:
-- - Basic user profile information (name, avatar, credits)
-- - Idea creation and completion statistics
-- - Voting activity counts
-- - Reward earnings from voting system
-- Used primarily for user dashboard widgets and profile overviews.
--
-- Example usage:
-- SELECT name, total_ideas, completed_ideas, rewards_amount
-- FROM user_dashboard_summary
-- WHERE user_id = 'user-123';
--
-- Example output:
-- | name  | total_ideas | completed_ideas | rewards_amount |
-- |-------|-------------|-----------------|----------------|
-- | Alice | 15          | 8               | 250.00         |
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT
  p.user_id,
  p.name,
  p.avatar_url,
  p.credit_balance,
  p.total_earned,
  p.total_spent,
  p.package_type,
  p.package_status,
  COUNT(DISTINCT i.id) as total_ideas,
  COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) as completed_ideas,
  ROUND(AVG(i.rating), 2) as average_rating,
  COUNT(DISTINCT v.id) as total_votes_given,
  COUNT(DISTINCT vr.id) as total_rewards_earned,
  COALESCE(SUM(vr.reward_amount), 0) as rewards_amount
FROM profiles p
LEFT JOIN ideas i ON p.user_id = i.user_id
LEFT JOIN votes v ON p.user_id = v.user_id
LEFT JOIN voting_rewards vr ON p.user_id = vr.voter_id
GROUP BY p.user_id, p.name, p.avatar_url, p.credit_balance, p.total_earned, p.total_spent, p.package_type, p.package_status;