-- Process Credit Purchase Function
-- Purpose: Handles credit purchases with automatic credit addition and notifications.
-- What it does: Adds purchased credits to user account and creates appropriate notifications.
-- When to use: Called when users complete credit purchase transactions.
-- Dependencies: Requires add_credits function.
--
-- Example Scenario 1: Credit package purchase
-- Before: User has 25 credits
-- Action: process_credit_purchase('user-123', 100, '{"payment_id": "pay_456", "package": "premium"}')
-- Result: Credits added, notification created, returns {'success': true}
--
-- Example Scenario 2: Small credit top-up
-- Before: User has 5 credits
-- Action: process_credit_purchase('user-123', 50, '{"source": "web_purchase"}')
-- Result: Credits added, returns success confirmation
--
-- Business Logic: Processes credit purchases with automatic balance updates and user notifications.
CREATE OR REPLACE FUNCTION process_credit_purchase(p_user_id UUID, p_amount INTEGER, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
BEGIN
  PERFORM add_credits(p_user_id, p_amount, 'credit_purchase', p_metadata);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;