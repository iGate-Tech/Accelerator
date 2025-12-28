-- Reward Distribution Monitor View
-- Purpose: Tracks automated credit rewards for votes and daily bonuses.
-- Tests: Triggers that award credits for community participation.
-- Use Case: Monitor reward system, verify automated credit distribution.
--
-- What it does:
-- - Shows all reward transactions (vote_received, daily_first_vote)
-- - Identifies who received rewards and from whom (for votes)
-- - Helps verify reward automation is working
--
-- Example Usage:
-- SELECT transaction_type, COUNT(*) as rewards_count, SUM(amount) as total_amount
-- FROM reward_distribution_monitor
-- GROUP BY transaction_type;
--
-- Example Output:
-- | transaction_type   | rewards_count | total_amount |
-- |--------------------|---------------|-------------|
-- | vote_received      | 156           | 780         |
-- | daily_first_vote   | 23            | 230         |
--
-- Low counts might indicate reward triggers are not firing.
CREATE OR REPLACE VIEW reward_distribution_monitor AS
SELECT
  ct.id,
  ct.user_id,
  p.name as recipient_name,
  ct.transaction_type,
  ct.amount,
  CASE
    WHEN ct.transaction_type = 'vote_received' THEN (ct.metadata->>'voter_id')::uuid
    WHEN ct.transaction_type = 'daily_first_vote' THEN ct.user_id
  END as source_user_id,
  CASE
    WHEN ct.transaction_type = 'vote_received' THEN sp.name
    WHEN ct.transaction_type = 'daily_first_vote' THEN 'System'
  END as source_name,
  ct.metadata,
  ct.created_at
FROM credit_transactions ct
JOIN profiles p ON ct.user_id = p.user_id
LEFT JOIN profiles sp ON (ct.metadata->>'voter_id')::uuid = sp.user_id
WHERE ct.transaction_type IN ('vote_received', 'daily_first_vote')
ORDER BY ct.created_at DESC;