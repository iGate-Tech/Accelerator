-- Calculate Completion Percentage Function
-- Purpose: Calculates the completion percentage for an idea based on completed model sections.
-- What it does: Counts total sections vs completed sections across all completed model instances for an idea.
-- When to use: Called by triggers and views to determine idea progress.
-- Dependencies: Requires model_instances and model_sections tables.
--
-- Example Scenario 1: Idea with partial completion
-- Before: User has completed 3 out of 5 sections across their model instances
-- Action: calculate_completion_percentage('550e8400-e29b-41d4-a716-446655440000')
-- Result: Returns 60 (3 completed sections out of 5 total)
--
-- Example Scenario 2: Idea with no models yet
-- Before: User has just created an idea but hasn't started any models
-- Action: calculate_completion_percentage('550e8400-e29b-41d4-a716-446655440001')
-- Result: Returns 0 (no sections to complete)
--
-- Example Scenario 3: Fully completed idea
-- Before: All model instances are completed with all sections done
-- Action: calculate_completion_percentage('550e8400-e29b-41d4-a716-446655440002')
-- Result: Returns 100 (all sections completed)
--
-- Business Logic: Only counts sections from model instances that are marked as 'completed' status.
-- This ensures we don't inflate completion by counting sections from abandoned models.
CREATE OR REPLACE FUNCTION calculate_completion_percentage(idea_uuid UUID) RETURNS INTEGER AS $$
DECLARE
    total_sections INTEGER;
    completed_sections INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_sections FROM model_sections ms
    JOIN model_instances mi ON ms.model_instance_id = mi.id
    WHERE mi.idea_id = idea_uuid AND mi.status = 'completed';

    SELECT COUNT(*) INTO completed_sections FROM model_sections ms
    JOIN model_instances mi ON ms.model_instance_id = mi.id
    WHERE mi.idea_id = idea_uuid AND mi.status = 'completed' AND ms.is_completed = TRUE;

    IF total_sections = 0 THEN RETURN 0; END IF;
    RETURN (completed_sections * 100) / total_sections;
END;
$$ LANGUAGE plpgsql;