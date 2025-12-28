-- Calculate Credit Balance Function
-- Purpose: Retrieves the current credit balance for a user.
-- What it does: Simple lookup of credit_balance from profiles table.
-- When to use: Called for balance checks and validation.
-- Dependencies: Requires profiles table.
--
-- Example Scenario 1: Balance check
-- Action: calculate_credit_balance('user-123')
-- Result: Returns current credit balance (e.g., 150)
--
-- Example Scenario 2: Non-existent user
-- Action: calculate_credit_balance('user-999')
-- Result: Returns 0 (user not found)
--
-- Business Logic: Simple balance retrieval, returns 0 for missing users.
CREATE OR REPLACE FUNCTION calculate_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    balance INTEGER;
BEGIN
    SELECT credit_balance INTO balance
    FROM profiles WHERE user_id = p_user_id;

    IF NOT FOUND THEN
       RETURN 0;
    END IF;

    RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;