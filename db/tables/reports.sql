-- Reports Table
-- Purpose: Stores generated business reports and analysis
-- Tracks AI-generated business documents
--
-- Key Relationships:
-- - Belongs to ideas and users
-- - Stores report generation history
--
-- Business Logic:
-- - Different report types (business-plan, pitch-deck, valuation)
-- - report_data contains generated content
-- - Tracks generation timestamps
--
-- Columns:
-- - idea_id: Source idea
-- - report_type: Type of report generated
-- - report_data: Generated content (JSONB)
-- - generated_at: When report was created
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT CHECK (report_type IN ('business-plan', 'pitch-deck', 'valuation')),
    report_data JSONB DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;