-- Daily First Vote Tracking View
-- Purpose: Monitors distribution of daily first vote bonuses.
-- Tests: Trigger that awards bonus credits for first vote each day.
-- Use Case: Track daily bonus system, ensure fair distribution.
--
-- What it does:
-- - Shows daily voting activity per user
-- - Indicates if user received the daily first vote bonus
-- - Helps verify bonus trigger logic
--
-- Example Usage:
-- SELECT vote_date, COUNT(*) as users_with_bonus
-- FROM daily_first_vote_tracking
-- WHERE received_bonus = true
-- GROUP BY vote_date
-- ORDER BY vote_date DESC;
--
-- Example Output:
-- | vote_date  | users_with_bonus |
-- |------------|------------------|
-- | 2024-01-15 | 8                |
-- | 2024-01-14 | 12               |
--
-- Should see bonuses distributed to users who voted first each day.
CREATE OR REPLACE VIEW daily_first_vote_tracking AS
SELECT
  DATE(ct.created_at) as vote_date,
  ct.user_id,
  p.name as user_name,
  COUNT(*) as votes_on_date,
  BOOL_OR(ct.transaction_type = 'daily_first_vote') as received_bonus,
  MAX(ct.created_at) as first_vote_time
FROM credit_transactions ct
JOIN profiles p ON ct.user_id = p.user_id
WHERE ct.transaction_type IN ('vote_received', 'daily_first_vote')
  AND DATE(ct.created_at) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(ct.created_at), ct.user_id, p.name
ORDER BY vote_date DESC, first_vote_time ASC;