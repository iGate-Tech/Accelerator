-- Process AI Generation Function
-- Purpose: Handles AI content generation with automatic credit deduction and validation.
-- What it does: Validates user has sufficient credits, deducts the cost, and returns success status.
-- When to use: Called when users generate AI content through the application.
-- Dependencies: Requires deduct_credits_for_generation function.
--
-- Example Scenario 1: Successful AI generation
-- Before: User has 100 credits
-- Action: process_ai_generation('user-123', 25, '{"feature": "text_completion"}')
-- Result: Returns {'success': true, 'new_balance': 75}
--
-- Example Scenario 2: Insufficient credits
-- Before: User has 10 credits
-- Action: process_ai_generation('user-123', 50, '{"feature": "image_generation"}')
-- Result: Returns {'success': false, 'error': 'Insufficient credits'}
--
-- Business Logic: Ensures users can't generate content without sufficient credits, provides immediate feedback.
CREATE OR REPLACE FUNCTION process_ai_generation(p_user_id UUID, p_cost INTEGER, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
   current_balance INTEGER;
BEGIN
  -- Check balance
  SELECT credit_balance INTO current_balance FROM profiles WHERE user_id = p_user_id;

  IF current_balance < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Deduct credits
  PERFORM deduct_credits_for_generation(p_user_id, p_cost, p_metadata);

  RETURN json_build_object('success', true, 'new_balance', current_balance - p_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;