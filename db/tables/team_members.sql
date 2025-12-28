-- Team Members Table
-- Purpose: Stores team member information for ideas
-- Supports collaboration features
--
-- Key Relationships:
-- - Links to ideas and users
-- - Tracks team composition
--
-- Business Logic:
-- - Optional team member management
-- - Stores contact information
-- - Tracks roles within teams
--
-- Columns:
-- - user_id: Team member user account
-- - idea_id: Associated idea
-- - name: Display name
-- - role: Team role
-- - email: Contact information
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
    name TEXT,
    role TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;