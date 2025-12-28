-- Billing History Table RLS Policies
-- Purpose: Controls access to payment and billing records
-- Security Model: Users can view and create their own billing records
--
-- Policy Details:
-- 1. Self-managed billing history
--
-- Security Rationale:
-- - Billing records contain sensitive payment data
-- - Users need access to their payment history
-- - Prevents unauthorized billing manipulation
--
-- Business Impact:
-- - Enables financial transparency
-- - Supports billing and subscription management
CREATE POLICY "Users can read own billing history" ON billing_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing history" ON billing_history
FOR INSERT WITH CHECK (auth.uid() = user_id);