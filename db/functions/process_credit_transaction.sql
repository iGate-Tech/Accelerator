-- Process Credit Transaction Function
-- Purpose: Unified function for handling all types of credit transactions with validation and balance updates.
-- What it does: Validates transaction, updates balance, creates notifications, logs activity.
-- When to use: Called for any credit operation (purchases, spending, rewards).
-- Dependencies: Requires profiles, credit_transactions tables, create_notification, log_activity functions.
--
-- Example Scenario 1: Credit purchase
-- Action: process_credit_transaction('user-123', 'credit_purchase', 100, '{"payment_id": "pay_456"}')
-- Result: Returns success JSON with transaction details, balance updated to previous + 100
--
-- Example Scenario 2: AI generation (insufficient funds)
-- Before: User has 10 credits
-- Action: process_credit_transaction('user-123', 'ai_generation', -50)
-- Result: Returns error JSON: 'Insufficient credits', balance unchanged
--
-- Example Scenario 3: Reward earning
-- Action: process_credit_transaction('user-456', 'reward_earned', 25, '{"source": "voting"}')
-- Result: Returns success JSON, balance increased, notification created
--
-- Business Logic: Comprehensive transaction processing with validation, notifications, and activity logging.
CREATE OR REPLACE FUNCTION process_credit_transaction(p_user_id UUID, p_type TEXT, p_amount INTEGER, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
    transaction_id UUID;
BEGIN
    -- Validate transaction type
    IF p_type NOT IN ('credit_purchase', 'ai_generation', 'report_generation', 'reward_earned', 'reward_given', 'package_upgrade', 'admin_adjustment') THEN
       RETURN json_build_object('success', false, 'error', 'Invalid transaction type');
    END IF;

    -- Get current balance
    SELECT credit_balance INTO current_balance
    FROM profiles WHERE user_id = p_user_id;

    IF NOT FOUND THEN
       RETURN json_build_object('success', false, 'error', 'User profile not found');
    END IF;

    -- For debit transactions, validate sufficient balance
    IF p_amount < 0 AND current_balance + p_amount < 0 THEN
       RETURN json_build_object('success', false, 'error', 'Insufficient credits', 'current_balance', current_balance, 'required', -p_amount);
    END IF;

    -- Calculate new balance
    new_balance := current_balance + p_amount;

    -- Insert transaction
    INSERT INTO credit_transactions (
       user_id,
       transaction_type,
       amount,
       metadata,
       status
    ) VALUES (
       p_user_id,
       p_type,
       p_amount,
       p_metadata,
       'active'
    ) RETURNING id INTO transaction_id;

    -- Update profile balance and totals
    UPDATE profiles SET
       credit_balance = new_balance,
       total_earned = CASE WHEN p_amount > 0 THEN total_earned + p_amount ELSE total_earned END,
       total_spent = CASE WHEN p_amount < 0 THEN total_spent - p_amount ELSE total_spent END,
       last_credit_update = NOW()
    WHERE user_id = p_user_id;

    -- Create notification for significant transactions
    IF p_type IN ('credit_purchase', 'package_upgrade') AND p_amount > 0 THEN
       PERFORM create_notification(
          p_user_id,
          'credit_earned',
          'You received ' || p_amount || ' credits for ' || p_type
       );
    ELSIF p_type IN ('ai_generation', 'report_generation') AND p_amount < 0 THEN
       PERFORM create_notification(
          p_user_id,
          'credit_spent',
          'You spent ' || -p_amount || ' credits for ' || p_type
       );
    END IF;

    -- Log activity for credit changes
    PERFORM log_activity(p_user_id, 'credit_transaction', 'credit', transaction_id,
       json_build_object('type', p_type, 'amount', p_amount, 'new_balance', new_balance));

    RETURN json_build_object(
       'success', true,
       'transaction_id', transaction_id,
       'previous_balance', current_balance,
       'new_balance', new_balance,
       'amount', p_amount,
       'type', p_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;