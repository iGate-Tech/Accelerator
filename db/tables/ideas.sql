-- Ideas Table
-- Purpose: Core table storing user-generated ideas/projects
-- This is the central business entity of the platform
--
-- Key Relationships:
-- - Belongs to users (user_id foreign key)
-- - Referenced by votes, model_instances, portfolios, favorites
-- - Parent table for most idea-related activities
--
-- Business Logic:
-- - Ideas start as 'draft' and progress through workflow
-- - Privacy controls public visibility for voting/community features
-- - Completion percentage calculated from model progress
-- - Rating computed from community votes
-- - Unlocked models control available AI tools based on validation
-- - Slug provides SEO-friendly URLs
--
-- Columns:
-- - title: Idea name (required, user-facing)
-- - category: Business domain classification
-- - privacy: Public/private visibility setting
-- - completion_percentage: Progress indicator (0-100)
-- - overall_status: Workflow state (draft/in_progress/completed/archived)
-- - unlocked_models: Array of available AI model types
-- - validation_threshold_met: Community validation milestone
--
-- Example Data:
-- | title          | category | privacy | completion_percentage | overall_status | unlocked_models       |
-- |----------------|----------|---------|----------------------|----------------|----------------------|
-- | AI Assistant   | Tech     | public  | 85                   | in_progress    | ["idea","canvas"]    |
-- | Mobile App     | Product  | private | 0                    | draft          | ["idea"]             |
--
-- Constraints:
-- - Title cannot be empty
-- - Completion percentage must be 0-100
-- - Status must be valid enum value
-- - Privacy must be public/private
-- - Slug must be unique for URL generation
CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT,
    category_icon TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    slug TEXT UNIQUE,
    privacy TEXT CHECK (privacy IN ('public', 'private')) DEFAULT 'public',
    validation_threshold_met BOOLEAN DEFAULT FALSE,
    unlocked_models TEXT[] DEFAULT ARRAY['idea'],
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    overall_status TEXT CHECK (overall_status IN ('draft', 'in_progress', 'completed', 'reported', 'archived')) DEFAULT 'draft',
    rating DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;