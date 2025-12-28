-- Credit Balance Update Trigger
-- Purpose: Automatically updates user credit balances when transactions occur.
-- What it does: Adjusts the credit_balance in profiles table based on transaction amounts.
-- When it fires: AFTER INSERT on credit_transactions table.
-- Dependencies: Requires access to profiles table for balance updates.
--
-- Example Scenario 1: Credit purchase (BALANCE INCREASE)
-- Before: user-123 has credit_balance = 25.00
-- Action: User purchases 50 credits (transaction_type = 'credit_purchase', amount = 50)
-- After: Balance updated to 75.00, last_credit_update timestamp set
--
-- Example Scenario 2: AI generation usage (BALANCE DECREASE)
-- Before: user-123 has credit_balance = 75.00
-- Action: User generates AI content (transaction_type = 'ai_generation', amount = -20)
-- After: Balance updated to 55.00, last_credit_update timestamp set
--
-- Example Scenario 3: Vote reward (BALANCE INCREASE)
-- Before: user-123 has credit_balance = 55.00
-- Action: User receives vote reward (transaction_type = 'vote_received', amount = 5)
-- After: Balance updated to 60.00, last_credit_update timestamp set
--
-- Business Logic: Maintains real-time credit balance accuracy, supporting
-- immediate balance checks and preventing overdrafts.
CREATE OR REPLACE FUNCTION update_credit_balance() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type IN ('credit_purchase', 'reward_earned') THEN
    UPDATE profiles SET credit_balance = credit_balance + NEW.amount, last_credit_update = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.transaction_type IN ('ai_generation', 'report_generation') THEN
    UPDATE profiles SET credit_balance = credit_balance + NEW.amount, last_credit_update = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_balance
AFTER INSERT ON credit_transactions
FOR EACH ROW EXECUTE FUNCTION update_credit_balance();