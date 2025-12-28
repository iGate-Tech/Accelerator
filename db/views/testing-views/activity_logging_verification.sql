-- Activity Logging Verification View
-- Purpose: Monitors that all user actions are being logged by the activity triggers.
-- Tests: Auto-logging triggers on all CRUD operations across tables.
-- Use Case: Verify audit trail completeness, track system activity.
--
-- What it does:
-- - Shows recent activity log entries with user and entity details
-- - Displays human-readable entity names instead of just IDs
-- - Helps verify that triggers are firing on create/update/delete operations
--
-- Example Usage:
-- SELECT * FROM activity_logging_verification LIMIT 10;
--
-- Example Output:
-- | id  | user_id | user_name | action_type | entity_type | entity_display_name | created_at          |
-- |-----|---------|-----------|-------------|-------------|---------------------|---------------------|
-- | 123 | user-1  | Alice     | create      | idea        | New Mobile App      | 2024-01-15 10:30:00 |
-- | 124 | user-2  | Bob       | vote        | idea        | AI Assistant        | 2024-01-15 10:25:00 |
--
-- Empty result set would indicate activity logging triggers are not working.
CREATE OR REPLACE VIEW activity_logging_verification AS
SELECT
  al.id,
  al.user_id,
  p.name as user_name,
  al.action_type,
  al.entity_type,
  al.entity_id,
  CASE
    WHEN al.entity_type = 'idea' THEN i.title
    WHEN al.entity_type = 'profile' THEN pp.name
    ELSE al.entity_id::text
  END as entity_display_name,
  al.details,
  al.created_at
FROM activity_log al
LEFT JOIN profiles p ON al.user_id = p.user_id
LEFT JOIN ideas i ON al.entity_id = i.id AND al.entity_type = 'idea'
LEFT JOIN profiles pp ON al.entity_id = pp.user_id AND al.entity_type = 'profile'
ORDER BY al.created_at DESC;