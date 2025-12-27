-- Credit System Functions
-- Functions for managing credits, transactions, and financial operations

-- Function to process credit transactions (unified credit management)
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

-- Function to calculate current credit balance (for validation)
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

-- Function to validate credit operation
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

-- Function to get credit history with pagination
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

-- Function to get user credit information
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

-- Function to process AI generation with credit deduction
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

-- Function to process credit purchase
CREATE OR REPLACE FUNCTION process_credit_purchase(p_user_id UUID, p_amount INTEGER, p_metadata JSONB DEFAULT '{}')
RETURNS JSON AS $$
BEGIN
  PERFORM add_credits(p_user_id, p_amount, 'credit_purchase', p_metadata);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;