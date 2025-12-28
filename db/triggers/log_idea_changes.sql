-- Idea Changes Activity Logging Trigger
-- Purpose: Logs activity when ideas are updated, tracking content changes.
-- What it does: Creates activity log entries for idea modifications with change details.
-- When it fires: AFTER UPDATE on ideas table.
-- Dependencies: Requires log_activity() function.
--
-- Example Scenario 1: Title change
-- Before: idea-123 has title "My App Idea"
-- Action: User changes title to "Awesome Mobile App"
-- After: Activity log created: action='update', entity='idea', details='idea updated'
--
-- Example Scenario 2: Status change
-- Before: idea-123 has overall_status = 'draft'
-- Action: User marks as overall_status = 'completed'
-- After: Activity log created tracking the status change
--
-- Business Logic: Provides audit trail for idea modifications, supporting
-- analytics and helping users track their progress and changes.
CREATE OR REPLACE FUNCTION log_idea_changes() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(NEW.user_id, 'update', 'idea', NEW.id, jsonb_build_object('changes', 'idea updated'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_idea_changes
AFTER UPDATE ON ideas
FOR EACH ROW EXECUTE FUNCTION log_idea_changes();