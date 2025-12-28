-- Portfolio Ideas Table
-- Purpose: Junction table linking portfolios to ideas
-- Enables many-to-many relationship between portfolios and ideas
--
-- Key Relationships:
-- - Links portfolios to ideas
-- - Supports portfolio organization
--
-- Business Logic:
-- - Ideas can belong to multiple portfolios
-- - Tracks when ideas were added
-- - Unique constraint prevents duplicates
--
-- Columns:
-- - portfolio_id: Parent portfolio
-- - idea_id: Contained idea
-- - added_at: When idea was added
--
-- Constraints:
-- - Unique portfolio-idea pairs
CREATE TABLE portfolio_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, idea_id)
);
ALTER TABLE portfolio_ideas ENABLE ROW LEVEL SECURITY;