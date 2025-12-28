-- Setup Credit System Functions
-- Credit and payment functions

-- Include individual credit function files
\i db/functions/process_credit_transaction.sql
\i db/functions/calculate_credit_balance.sql
\i db/functions/validate_credit_operation.sql
\i db/functions/get_credit_history.sql
\i db/functions/get_user_credit_info.sql
\i db/functions/process_ai_generation.sql
\i db/functions/process_credit_purchase.sql