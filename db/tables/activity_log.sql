-- Activity Log Table
-- Purpose: Comprehensive audit trail of all user actions
-- Tracks system activity for analytics and compliance
--
-- Key Relationships:
-- - Belongs to users
-- - References various entities
--
-- Business Logic:
-- - Complete activity tracking
-- - Supports different action types
-- - Entity relationships for context
-- - JSONB details for flexible data storage
--
-- Columns:
-- - user_id: Action performer
-- - action_type: Type of action performed
-- - entity_type: Target entity category
-- - entity_id: Specific entity affected
-- - details: Additional action context (JSONB)
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT,
    entity_type TEXT,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;