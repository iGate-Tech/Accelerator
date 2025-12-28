-- Voting System Health View
-- Purpose: Provides overview of voting system performance and reward distribution.
-- Tests: Overall health of the voting and reward ecosystem.
-- Use Case: Monitor community engagement, reward system effectiveness.
--
-- What it does:
-- - Shows system-wide voting statistics
-- - Tracks reward distribution
-- - Compares daily vs overall metrics
--
-- Example Usage:
-- SELECT * FROM voting_system_health WHERE metric_type = 'system_overview';
--
-- Example Output:
-- | metric_type     | total_ideas | total_votes | total_voters | average_vote_rating | total_rewards_distributed | total_reward_amount |
-- |-----------------|-------------|-------------|--------------|---------------------|---------------------------|---------------------|
-- | system_overview | 156         | 1247        | 89           | 3.8                 | 623                       | 3115                |
--
-- Low reward distribution relative to votes indicates reward trigger issues.
CREATE OR REPLACE VIEW voting_system_health AS
SELECT
  'system_overview' as metric_type,
  COUNT(DISTINCT i.id) as total_ideas,
  COUNT(DISTINCT v.id) as total_votes,
  COUNT(DISTINCT p.user_id) as total_voters,
  ROUND(AVG(v.rating), 2) as average_vote_rating,
  COUNT(DISTINCT CASE WHEN ct.transaction_type = 'vote_received' THEN ct.id END) as total_rewards_distributed,
  COALESCE(SUM(CASE WHEN ct.transaction_type = 'vote_received' THEN ct.amount END), 0) as total_reward_amount
FROM ideas i
LEFT JOIN votes v ON i.id = v.idea_id
LEFT JOIN profiles p ON v.user_id = p.user_id
LEFT JOIN credit_transactions ct ON ct.transaction_type = 'vote_received'
UNION ALL
SELECT
  'daily_stats' as metric_type,
  COUNT(DISTINCT i.id) as total_ideas,
  COUNT(DISTINCT v.id) as total_votes,
  COUNT(DISTINCT p.user_id) as total_voters,
  ROUND(AVG(v.rating), 2) as average_vote_rating,
  COUNT(DISTINCT CASE WHEN ct.transaction_type = 'vote_received' THEN ct.id END) as total_rewards_distributed,
  COALESCE(SUM(CASE WHEN ct.transaction_type = 'vote_received' THEN ct.amount END), 0) as total_reward_amount
FROM ideas i
LEFT JOIN votes v ON i.id = v.idea_id AND DATE(v.created_at) = CURRENT_DATE
LEFT JOIN profiles p ON v.user_id = p.user_id
LEFT JOIN credit_transactions ct ON ct.transaction_type = 'vote_received' AND DATE(ct.created_at) = CURRENT_DATE;