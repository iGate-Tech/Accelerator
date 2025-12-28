-- Add Credits Function
-- Purpose: Adds credits to user accounts for purchases, rewards, or bonuses.
-- What it does: Creates a credit transaction, balance updates handled by triggers.
-- When to use: Called for credit purchases, reward distributions, or bonus credits.
-- Dependencies: Requires credit_transactions table, triggers handle balance updates.
--
-- Example Scenario 1: Credit purchase
-- Before: User has 50 credits
-- Action: add_credits('user-123', 100, 'credit_purchase', '{"payment_id": "pay_456"}')
-- Result: Transaction created for +100 credits, balance updated to 150 by trigger
--
-- Example Scenario 2: Voting reward
-- Before: User has 75 credits
-- Action: add_credits('user-123', 5, 'reward_earned', '{"source": "vote", "idea_id": "idea-789"}')
-- Result: Transaction created for +5 credits, balance updated to 80 by trigger
--
-- Business Logic: Handles all types of credit additions, metadata tracks the source for auditing.
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER, p_transaction_type TEXT, p_metadata JSONB DEFAULT '{}') RETURNS VOID AS $$
BEGIN
  INSERT INTO credit_transactions (user_id, transaction_type, amount, metadata, status)
  VALUES (p_user_id, p_transaction_type, p_amount, p_metadata, 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;