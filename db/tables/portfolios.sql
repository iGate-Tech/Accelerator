-- Portfolios Table
-- Purpose: Enterprise feature for organizing ideas into collections
-- Allows users to group and manage multiple ideas
--
-- Key Relationships:
-- - Belongs to users
-- - Parent table for portfolio_ideas and portfolio_members
--
-- Business Logic:
-- - One default portfolio per user
-- - Customizable colors for UI
-- - Team collaboration support
-- - Idea organization and management
--
-- Columns:
-- - user_id: Portfolio owner
-- - name: Portfolio display name (required)
-- - description: Portfolio description
-- - color: UI theme color (hex)
-- - is_default: Default portfolio flag
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6', -- Hex color for UI theming
    is_default BOOLEAN DEFAULT FALSE, -- One default portfolio per user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;