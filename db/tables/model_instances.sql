-- Model Instances Table
-- Purpose: Tracks AI model usage instances for ideas
-- Manages the lifecycle of different AI model applications
--
-- Key Relationships:
-- - Belongs to ideas (idea_id foreign key)
-- - Parent table for model_sections
-- - Links users to their model usage
--
-- Business Logic:
-- - Each idea can have multiple model instances (one per model type)
-- - Status tracks completion state (draft/completed)
-- - Model types define different AI capabilities
-- - Used for progress tracking and feature unlocking
--
-- Columns:
-- - idea_id: Associated idea
-- - model_type: Type of AI model (idea/business/financial/etc.)
-- - status: Completion state
--
-- Example Data:
-- | idea_id | model_type | status    | user_id |
-- |---------|------------|-----------|---------|
-- | abc-123 | idea       | completed | user-1  |
-- | abc-123 | business   | draft     | user-1  |
--
-- Constraints:
-- - Model type must be valid enum
-- - Status must be draft or completed
CREATE TABLE model_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    model_type TEXT CHECK (model_type IN ('idea', 'business', 'financial', 'funding', 'legal', 'marketing', 'team')),
    status TEXT CHECK (status IN ('draft', 'completed')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE model_instances ENABLE ROW LEVEL SECURITY;