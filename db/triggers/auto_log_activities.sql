-- Automatic Activity Logging Triggers
-- Purpose: Automatically logs all CRUD operations across key tables for comprehensive audit trail.
-- What it does: Creates activity log entries for INSERT/UPDATE/DELETE operations on ideas, votes, and favorites.
-- When it fires: AFTER INSERT/UPDATE/DELETE on ideas, votes, and user_favorites tables.
-- Dependencies: Requires log_user_activity() function and activity_log table.
--
-- Example Scenario 1: New idea created
-- Action: User inserts new idea
-- After: Activity log created: action='create', entity='idea', user=user-id, entity_id=idea-id
--
-- Example Scenario 2: Vote cast
-- Action: User votes on idea
-- After: Activity log created: action='create', entity='vote', user=user-id, entity_id=vote-id
--
-- Example Scenario 3: Favorite removed
-- Action: User unfavorites an idea
-- After: Activity log created: action='delete', entity='favorite', user=user-id, entity_id=idea-id
--
-- Business Logic: Provides complete audit trail of all user actions,
-- supporting analytics, debugging, and compliance requirements.
-- Automatically captures all data changes without manual logging calls.
CREATE OR REPLACE FUNCTION auto_log_activities() RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  entity_type TEXT;
  entity_id UUID;
BEGIN
  -- Determine entity type from table
  CASE TG_TABLE_NAME
    WHEN 'ideas' THEN
      entity_type := 'idea';
      entity_id := COALESCE(NEW.id, OLD.id);
    WHEN 'votes' THEN
      entity_type := 'vote';
      entity_id := COALESCE(NEW.id, OLD.id);
    WHEN 'user_favorites' THEN
      entity_type := 'favorite';
      entity_id := COALESCE(NEW.idea_id, OLD.idea_id);
    WHEN 'credit_transactions' THEN
      entity_type := 'credit';
      entity_id := COALESCE(NEW.id, OLD.id);
    WHEN 'profiles' THEN
      entity_type := 'profile';
      entity_id := COALESCE(NEW.user_id, OLD.user_id);
    ELSE
      entity_type := TG_TABLE_NAME;
      entity_id := COALESCE(NEW.id, OLD.id);
  END CASE;

  -- Determine action type
  CASE TG_OP
    WHEN 'INSERT' THEN action_type := 'create';
    WHEN 'UPDATE' THEN action_type := 'update';
    WHEN 'DELETE' THEN action_type := 'delete';
  END CASE;

  -- Auto-log the activity if we have a user_id
  IF (COALESCE(NEW.user_id, OLD.user_id) IS NOT NULL) THEN
    PERFORM log_user_activity(
      COALESCE(NEW.user_id, OLD.user_id),
      action_type,
      entity_type,
      entity_id
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply auto-logging to key tables
CREATE TRIGGER trigger_auto_log_ideas
  AFTER INSERT OR UPDATE OR DELETE ON ideas
  FOR EACH ROW EXECUTE FUNCTION auto_log_activities();

CREATE TRIGGER trigger_auto_log_votes
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION auto_log_activities();

CREATE TRIGGER trigger_auto_log_favorites
  AFTER INSERT OR DELETE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION auto_log_activities();