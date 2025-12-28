-- Votes Table
-- Purpose: Stores community votes on ideas for rating and validation
-- Enables the core social validation mechanism
--
-- Key Relationships:
-- - Links users to ideas they voted on
-- - Triggers rating calculations on ideas table
-- - Basis for reward distribution system
--
-- Business Logic:
-- - One vote per user per idea (enforced by unique constraint)
-- - Rating scale 1-5 for community feedback
-- - Votes trigger automatic rating recalculation
-- - Used for idea validation and leaderboard rankings
-- - Cannot vote on own ideas (enforced by application logic)
--
-- Columns:
-- - idea_id: Which idea is being voted on
-- - user_id: Who cast the vote
-- - rating: Vote value (1-5 scale)
--
-- Example Data:
-- | idea_id | user_id | rating | created_at          |
-- |---------|---------|--------|---------------------|
-- | abc-123 | user-1  | 5      | 2024-01-15 10:30:00 |
-- | abc-123 | user-2  | 4      | 2024-01-15 10:25:00 |
--
-- Constraints:
-- - Rating must be between 1 and 5
-- - One vote per user per idea (unique constraint)
-- - Foreign key constraints maintain referential integrity
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(idea_id, user_id)
);
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;