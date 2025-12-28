-- User Settings Table
-- Purpose: Stores user-specific configuration and preferences
-- Supports customizable user experience
--
-- Key Relationships:
-- - Belongs to users
-- - Stores key-value preference data
--
-- Business Logic:
-- - Flexible preference storage
-- - JSONB values for complex settings
-- - Unique key per user
--
-- Columns:
-- - user_id: Settings owner
-- - key: Setting identifier
-- - value: Setting value (JSONB)
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, key)
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;