-- Trigger Firing Counts View
-- Purpose: Monitors how often different triggers are firing.
-- Tests: Trigger execution frequency and system activity levels.
-- Use Case: Detect underperforming triggers, monitor system load.
--
-- What it does:
-- - Counts trigger executions by category
-- - Shows last firing time for each trigger type
-- - Helps identify triggers that aren't firing as expected
--
-- Example Usage:
-- SELECT trigger_category, firing_count, last_fired
-- FROM trigger_firing_counts
-- ORDER BY firing_count DESC;
--
-- Example Output:
-- | trigger_category     | firing_count | last_fired          |
-- |----------------------|--------------|---------------------|
-- | activity_logging_triggers | 1247       | 2024-01-15 10:30:00 |
-- | notification_triggers    | 89         | 2024-01-15 10:25:00 |
-- | credit_triggers          | 623        | 2024-01-15 10:20:00 |
--
-- Low counts for expected trigger types indicate potential issues.
CREATE OR REPLACE VIEW trigger_firing_counts AS
SELECT
  'activity_logging_triggers' as trigger_category,
  COUNT(*) as firing_count,
  MAX(created_at) as last_fired,
  'Auto logging on CRUD operations' as description
FROM activity_log
WHERE action_type IN ('create', 'update', 'delete')
UNION ALL
SELECT
  'notification_triggers' as trigger_category,
  COUNT(*) as firing_count,
  MAX(created_at) as last_fired,
  'Auto notifications on votes/favorites' as description
FROM notifications
WHERE type IN ('vote_received', 'idea_favorited')
UNION ALL
SELECT
  'credit_triggers' as trigger_category,
  COUNT(*) as firing_count,
  MAX(created_at) as last_fired,
  'Credit updates and rewards' as description
FROM credit_transactions
WHERE transaction_type IN ('vote_received', 'daily_first_vote')
UNION ALL
SELECT
  'completion_triggers' as trigger_category,
  COUNT(*) as firing_count,
  MAX(created_at) as last_fired,
  'Completion percentage updates' as description
FROM activity_log
WHERE action_type = 'complete_section';