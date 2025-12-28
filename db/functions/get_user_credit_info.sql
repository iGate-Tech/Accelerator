-- Get User Credit Info Function
-- Purpose: Retrieves comprehensive credit information for a user including profile and recent transactions.
-- What it does: Combines credit profile data with recent transaction history in a single JSON response.
-- When to use: Called for user dashboard credit displays and account management interfaces.
-- Dependencies: Requires profiles and credit_transactions tables.
--
-- Example Scenario 1: Full credit info request
-- Action: get_user_credit_info('user-123')
-- Result: Returns JSON with credit balance, totals, and last 20 transactions
--
-- Example Scenario 2: User with no transactions
-- Action: get_user_credit_info('user-new')
-- Result: Returns JSON with zero balances and empty transactions array
--
-- Business Logic: Provides complete credit overview for user interfaces, including historical context.
CREATE OR REPLACE FUNCTION get_user_credit_info(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
   profile_data JSON;
   transactions_data JSON;
BEGIN
  -- Get profile data
  SELECT json_build_object(
    'credit_balance', credit_balance,
    'total_spent', total_spent,
    'total_earned', total_earned,
    'last_credit_update', last_credit_update
  ) INTO profile_data
  FROM profiles WHERE user_id = p_user_id;

  -- Get recent transactions (last 20)
  SELECT json_agg(
    json_build_object(
      'id', id,
      'transaction_type', transaction_type,
      'amount', amount,
      'metadata', metadata,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ) INTO transactions_data
  FROM (
    SELECT * FROM credit_transactions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 20
  ) t;

  RETURN json_build_object(
    'profile', profile_data,
    'transactions', transactions_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;