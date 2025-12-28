-- Credit Transactions Table RLS Policies
-- Purpose: Controls access to financial transaction records
-- Security Model: Users can view and create their own transactions
--
-- Policy Details:
-- 1. Read access to own transaction history
-- 2. Insert access for transaction creation
--
-- Security Rationale:
-- - Users need visibility into their financial activity
-- - Transaction creation is controlled by application logic
-- - Prevents manipulation of financial records
--
-- Business Impact:
-- - Enables financial transparency for users
-- - Supports billing and credit management
CREATE POLICY "Users can read own credit transactions" ON credit_transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit transactions" ON credit_transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);