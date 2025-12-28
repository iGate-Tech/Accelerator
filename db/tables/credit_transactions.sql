-- Credit Transactions Table
-- Purpose: Records all credit-related financial transactions
-- Complete audit trail for credit economy
--
-- Key Relationships:
-- - Belongs to users
-- - Triggers balance updates
--
-- Business Logic:
-- - All credit movements tracked here
-- - Supports different transaction types
-- - Metadata stores additional context
-- - Status tracks transaction state
--
-- Columns:
-- - user_id: Transaction owner
-- - transaction_type: Credit/debit category
-- - amount: Transaction amount (positive/negative)
-- - metadata: Additional transaction data
-- - status: Transaction status
-- - started_at/expires_at: Transaction validity period
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT CHECK (transaction_type IN ('credit_purchase', 'ai_generation', 'report_generation', 'reward_given', 'reward_earned')),
    amount INTEGER,
    metadata JSONB DEFAULT '{}',
    status TEXT CHECK (status IN ('active', 'cancelled')) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;