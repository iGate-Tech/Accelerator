-- Completion Percentage Update Trigger
-- Purpose: Automatically updates idea completion percentages when model sections are completed or modified.
-- What it does: Whenever a model section is inserted or updated, recalculates the completion percentage
-- for the associated idea using the calculate_completion_percentage() function.
-- When it fires: AFTER INSERT OR UPDATE on model_sections table.
-- Dependencies: Requires calculate_completion_percentage() function to exist.
--
-- Example Scenario 1: User completes a section
-- Before: idea-123 has completion_percentage = 50.0%
-- Action: User marks section-456 as completed (model_instance_id points to idea-123)
-- After: Trigger fires, completion_percentage recalculated and updated to 66.7%
--
-- Example Scenario 2: New section added
-- Before: idea-123 has 2 completed out of 3 sections (66.7%)
-- Action: Instructor adds a new section to the model
-- After: Trigger fires, completion_percentage recalculated to 50.0% (2 out of 4 sections)
--
-- Business Logic: Ensures completion percentages always reflect current progress,
-- supporting accurate progress tracking and achievement calculations.
CREATE OR REPLACE FUNCTION update_completion_on_section_change() RETURNS TRIGGER AS $$
BEGIN
    UPDATE ideas SET completion_percentage = calculate_completion_percentage(idea_id)
    FROM model_instances mi WHERE mi.id = NEW.model_instance_id AND ideas.id = mi.idea_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_completion
AFTER INSERT OR UPDATE ON model_sections
FOR EACH ROW EXECUTE FUNCTION update_completion_on_section_change();