-- Model Sections Table
-- Purpose: Stores individual sections within AI model instances
-- Granular tracking of progress within each model
--
-- Key Relationships:
-- - Belongs to model_instances
-- - Triggers completion percentage updates
--
-- Business Logic:
-- - Each model instance has multiple sections
-- - Section completion drives overall progress
-- - section_data stores AI-generated content
-- - is_completed tracks individual section status
--
-- Columns:
-- - model_instance_id: Parent model instance
-- - section_name: Human-readable section identifier
-- - section_data: AI-generated content (JSONB)
-- - is_completed: Completion status
--
-- Example Data:
-- | model_instance_id | section_name    | is_completed | section_data                    |
-- |-------------------|-----------------|--------------|---------------------------------|
-- | inst-123         | Executive Summary | true        | {"content": "Company overview"} |
-- | inst-123         | Market Analysis   | false       | {}                              |
CREATE TABLE model_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_instance_id UUID REFERENCES model_instances(id) ON DELETE CASCADE,
    section_name TEXT,
    section_data JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE model_sections ENABLE ROW LEVEL SECURITY;