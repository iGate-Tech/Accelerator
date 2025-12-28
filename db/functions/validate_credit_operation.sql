-- Validate Credit Operation Function
-- Purpose: Validates if a credit operation can be performed without causing negative balance.
-- What it does: Checks current balance against proposed transaction amount.
-- When to use: Called before credit operations to validate feasibility.
-- Dependencies: Requires profiles table.
--
-- Example Scenario 1: Valid debit
-- Before: User has 100 credits
-- Action: validate_credit_operation('user-123', -25)
-- Result: Returns {'valid': true, 'current_balance': 100, 'projected_balance': 75}
--
-- Example Scenario 2: Insufficient funds
-- Before: User has 10 credits
-- Action: validate_credit_operation('user-123', -50)
-- Result: Returns {'valid': false, 'error': 'Insufficient credits', 'shortfall': 40}
--
-- Example Scenario 3: Credit addition
-- Before: User has 50 credits
-- Action: validate_credit_operation('user-123', 25)
-- Result: Returns {'valid': true, 'current_balance': 50, 'projected_balance': 75}
--
-- Business Logic: Validates debit operations against available balance.
CREATE OR REPLACE FUNCTION validate_credit_operation(p_user_id UUID, p_amount INTEGER)
RETURNS JSON AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    SELECT credit_balance INTO current_balance
    FROM profiles WHERE user_id = p_user_id;

    IF NOT FOUND THEN
       RETURN json_build_object('valid', false, 'error', 'User profile not found');
    END IF;

    IF p_amount < 0 AND current_balance + p_amount < 0 THEN
       RETURN json_build_object(
          'valid', false,
          'error', 'Insufficient credits',
          'current_balance', current_balance,
          'required', -p_amount,
          'shortfall', -(current_balance + p_amount)
       );
    END IF;

    RETURN json_build_object(
       'valid', true,
       'current_balance', current_balance,
       'projected_balance', current_balance + p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;