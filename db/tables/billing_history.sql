-- Billing History Table
-- Purpose: Records billing transactions and payment history
-- Tracks financial transactions for accounting
--
-- Key Relationships:
-- - Belongs to users
-- - Stores payment records
--
-- Business Logic:
-- - Audit trail for payments
-- - Multi-currency support
-- - Status tracking
--
-- Columns:
-- - user_id: Payer
-- - amount: Payment amount
-- - currency: Payment currency
-- - status: Transaction status
CREATE TABLE billing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER,
    currency TEXT DEFAULT 'USD',
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;