-- Deduct Credits for AI Generation Function
-- Purpose: Deducts credits when users use AI generation features.
-- What it does: Creates a debit transaction for AI usage, balance updates handled by triggers.
-- When to use: Called when users generate AI content.
-- Dependencies: Requires credit_transactions table, triggers handle balance updates.
--
-- Example Scenario 1: Standard AI generation
-- Before: User has 150 credits
-- Action: deduct_credits_for_generation('user-123', 25, '{"feature": "text_generation"}')
-- Result: Transaction created for -25 credits, balance updated to 125 by trigger
--
-- Example Scenario 2: Insufficient credits (blocked by trigger)
-- Before: User has 10 credits
-- Action: deduct_credits_for_generation('user-123', 50)
-- Result: Exception thrown by trigger: 'Insufficient credits for transaction'
--
-- Business Logic: Always creates negative transactions, validation of sufficient balance is handled by triggers.
CREATE OR REPLACE FUNCTION deduct_credits_for_generation(p_user_id UUID, p_amount INTEGER, p_metadata JSONB DEFAULT '{}') RETURNS VOID AS $$
BEGIN
  -- Insert transaction
  INSERT INTO credit_transactions (user_id, transaction_type, amount, metadata, status)
  VALUES (p_user_id, 'ai_generation', -p_amount, p_metadata, 'active');

  -- Update profile balance (handled by app logic, but trigger validates)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;