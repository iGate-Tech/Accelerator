-- Portfolio Members Table
-- Purpose: Manages team access to shared portfolios
-- Supports collaborative portfolio management
--
-- Key Relationships:
-- - Links portfolios to team members
-- - Tracks invitation and access management
--
-- Business Logic:
-- - Role-based access control (owner/editor/viewer)
-- - Invitation tracking
-- - Team collaboration features
--
-- Columns:
-- - portfolio_id: Shared portfolio
-- - user_id: Team member
-- - role: Access level (owner/editor/viewer)
-- - invited_by: Who sent the invitation
-- - invited_at: When invitation was sent
--
-- Constraints:
-- - Unique portfolio-user pairs
-- - Role must be valid enum
CREATE TABLE portfolio_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'viewer',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, user_id)
);
ALTER TABLE portfolio_members ENABLE ROW LEVEL SECURITY;