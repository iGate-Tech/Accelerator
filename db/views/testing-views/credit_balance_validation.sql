-- Credit Balance Validation View
-- Purpose: Validates that stored credit balances match calculated balances from transaction history.
-- Tests: Trigger that updates credit_balance on transactions, prevention of negative balances.
-- Use Case: Detect discrepancies in credit system, ensure financial data integrity.
--
-- What it does:
-- - Compares the stored credit_balance in profiles table with sum of all credit_transactions
-- - Identifies users with balance inconsistencies
-- - Shows difference between stored and calculated balances
--
-- Example Usage:
-- SELECT * FROM credit_balance_validation WHERE status = 'INVALID';
--
-- Example Output (if balance inconsistency found):
-- | user_id | name  | stored_balance | calculated_balance | difference | status  |
-- |---------|-------|----------------|-------------------|------------|---------|
-- | user-1  | Alice | 150.00         | 200.00            | -50.00     | INVALID |
--
-- This would indicate that Alice's stored balance (150) doesn't match her transaction history (200),
-- suggesting a problem with the credit update triggers.
CREATE OR REPLACE VIEW credit_balance_validation AS
SELECT
  p.user_id,
  p.name,
  p.credit_balance as stored_balance,
  COALESCE(SUM(ct.amount), 0) as calculated_balance,
  p.credit_balance - COALESCE(SUM(ct.amount), 0) as difference,
  CASE WHEN p.credit_balance = COALESCE(SUM(ct.amount), 0) THEN 'VALID' ELSE 'INVALID' END as status
FROM profiles p
LEFT JOIN credit_transactions ct ON p.user_id = ct.user_id
GROUP BY p.user_id, p.name, p.credit_balance;