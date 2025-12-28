-- Get Credit History Function
-- Purpose: Retrieves paginated credit transaction history for a user.
-- What it does: Returns transactions with summary statistics and pagination info.
-- When to use: Called to display credit history in user interfaces.
-- Dependencies: Requires credit_transactions and profiles tables.
--
-- Example Scenario 1: Recent transactions
-- Action: get_credit_history('user-123', 10, 0)
-- Result: Returns JSON with last 10 transactions, summary stats, pagination info
--
-- Example Scenario 2: Historical data
-- Action: get_credit_history('user-456', 50, 100)
-- Result: Returns transactions 101-150 with full summary
--
-- Business Logic: Provides comprehensive transaction history with efficient pagination.
CREATE OR REPLACE FUNCTION get_credit_history(p_user_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
    transactions_data JSON;
    summary_data JSON;
BEGIN
    -- Get paginated transactions
    SELECT json_agg(
       json_build_object(
          'id', id,
          'transaction_type', transaction_type,
          'amount', amount,
          'metadata', metadata,
          'created_at', created_at,
          'status', status
       ) ORDER BY created_at DESC
    ) INTO transactions_data
    FROM (
       SELECT * FROM credit_transactions
       WHERE user_id = p_user_id
       ORDER BY created_at DESC
       LIMIT p_limit OFFSET p_offset
    ) t;

    -- Get summary stats
    SELECT json_build_object(
       'total_transactions', COUNT(*),
       'total_earned', COALESCE(SUM(CASE WHEN amount > 0 THEN amount END), 0),
       'total_spent', COALESCE(SUM(CASE WHEN amount < 0 THEN -amount END), 0),
       'current_balance', (SELECT credit_balance FROM profiles WHERE user_id = p_user_id),
       'last_transaction', MAX(created_at)
    ) INTO summary_data
    FROM credit_transactions
    WHERE user_id = p_user_id;

    RETURN json_build_object(
       'transactions', COALESCE(transactions_data, '[]'::JSON),
       'summary', summary_data,
       'pagination', json_build_object(
          'limit', p_limit,
          'offset', p_offset,
          'has_more', (SELECT COUNT(*) > p_offset + p_limit FROM credit_transactions WHERE user_id = p_user_id)
       )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;