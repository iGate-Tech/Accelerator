-- Voting Rewards Table
-- Purpose: Tracks credit rewards distributed to voters
-- Manages the reward distribution system
--
-- Key Relationships:
-- - Links to ideas and voters
-- - Created by reward distribution processes
--
-- Business Logic:
-- - Records rewards for community participation
-- - Tracks distribution status
-- - Supports reward auditing
--
-- Columns:
-- - idea_id: Idea that generated rewards
-- - voter_id: User who received reward
-- - reward_amount: Credits awarded
-- - distributed_at: When reward was processed
CREATE TABLE voting_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_amount INTEGER,
    distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE voting_rewards ENABLE ROW LEVEL SECURITY;