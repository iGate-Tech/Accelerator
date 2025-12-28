-- Prevent Negative Credit Transaction Trigger
-- Purpose: Blocks credit transactions that would result in negative balances for AI/report generation.
-- What it does: Checks current balance before allowing debit transactions for AI/report usage.
-- When it fires: BEFORE INSERT on credit_transactions table.
-- Dependencies: Requires access to profiles table for current balance lookup.
--
-- Example Scenario 1: Sufficient credits (ALLOWED)
-- Before: user-123 has credit_balance = 50.00
-- Action: User requests AI generation (costs 20 credits)
-- After: Transaction succeeds, balance becomes 30.00
--
-- Example Scenario 2: Insufficient credits (BLOCKED)
-- Before: user-123 has credit_balance = 15.00
-- Action: User requests report generation (costs 25 credits)
-- After: Trigger raises exception: 'Insufficient credits for transaction'
--
-- Example Scenario 3: Credit purchase (ALLOWED)
-- Before: user-123 has credit_balance = 15.00
-- Action: User purchases 50 credits
-- After: Transaction succeeds, balance becomes 65.00 (validation not applied to credits)
--
-- Business Logic: Prevents users from running up debt while allowing credit purchases.
-- Only applies to consumptive actions (AI generation, reports), not earning actions.
CREATE OR REPLACE FUNCTION prevent_negative_credit_transaction() RETURNS TRIGGER AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  IF NEW.transaction_type IN ('ai_generation', 'report_generation') AND NEW.amount < 0 THEN
    SELECT credit_balance INTO current_balance FROM profiles WHERE user_id = NEW.user_id;
    IF current_balance + NEW.amount < 0 THEN
      RAISE EXCEPTION 'Insufficient credits for transaction';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_negative_credit_transaction
BEFORE INSERT ON credit_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_negative_credit_transaction();