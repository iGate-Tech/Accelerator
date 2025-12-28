-- Rewards Table
-- Purpose: Legacy rewards tracking table
-- Stores reward distribution records
--
-- Key Relationships:
-- - Belongs to users
-- - Tracks earned rewards
--
-- Business Logic:
-- - Reward audit trail
-- - Different reward types
-- - Amount tracking
--
-- Columns:
-- - user_id: Reward recipient
-- - type: Reward category
-- - amount: Reward value
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT,
    amount INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;