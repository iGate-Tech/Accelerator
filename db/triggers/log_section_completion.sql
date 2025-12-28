-- Section Completion Activity Logging Trigger
-- Purpose: Logs activity when users complete model sections, tracking learning progress.
-- What it does: Creates activity log entries when sections change from incomplete to complete.
-- When it fires: AFTER UPDATE on model_sections table.
-- Dependencies: Requires log_activity() function and model_instances table.
--
-- Example Scenario 1: Section completed
-- Before: section-456 is_completed = false
-- Action: User completes section-456 (sets is_completed = true)
-- After: Activity log created: action='complete_section', entity='model_section',
--       user=user-from-model-instance, details={'section_name': 'Sprint Planning'}
--
-- Example Scenario 2: Section already completed (NO LOG)
-- Before: section-456 is_completed = true
-- Action: User updates some other field on section-456
-- After: No activity log created (only logs completion events)
--
-- Business Logic: Tracks learning milestones and progress, supporting
-- analytics on user engagement and course completion patterns.
CREATE OR REPLACE FUNCTION log_section_completion() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed AND (OLD.is_completed IS NULL OR NOT OLD.is_completed) THEN
    PERFORM log_activity(
      (SELECT mi.user_id FROM model_instances mi WHERE mi.id = NEW.model_instance_id),
      'complete_section',
      'model_section',
      NEW.id,
      jsonb_build_object('section_name', NEW.section_name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_section_completion
AFTER UPDATE ON model_sections
FOR EACH ROW EXECUTE FUNCTION log_section_completion();