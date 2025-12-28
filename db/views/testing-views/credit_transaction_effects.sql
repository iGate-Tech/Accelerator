-- Credit Transaction Effects View
-- Purpose: Monitors how credit transactions affect user balances.
-- Tests: Trigger that updates credit_balance after transactions.
-- Use Case: Track credit flow, verify balance updates are working.
--
-- What it does:
-- - Shows credit transactions with current balance after each transaction
-- - Helps verify that credit update triggers are working correctly
-- - Displays transaction metadata for debugging
--
-- Example Usage:
-- SELECT user_name, transaction_type, amount, current_balance
-- FROM credit_transaction_effects
-- WHERE user_id = 'user-123'
-- ORDER BY created_at DESC LIMIT 5;
--
-- Example Output:
-- | user_name | transaction_type | amount | current_balance | created_at          |
-- |-----------|------------------|--------|-----------------|---------------------|
-- | Alice     | vote_received    | 5      | 150             | 2024-01-15 10:30:00 |
-- | Alice     | ai_generation    | -20    | 130             | 2024-01-15 10:25:00 |
--
-- Balance should reflect cumulative effects of all transactions.
CREATE OR REPLACE VIEW credit_transaction_effects AS
SELECT
  ct.id,
  ct.user_id,
  p.name as user_name,
  ct.transaction_type,
  ct.amount,
  p.credit_balance as current_balance,
  ct.metadata,
  ct.created_at
FROM credit_transactions ct
JOIN profiles p ON ct.user_id = p.user_id
ORDER BY ct.created_at DESC;