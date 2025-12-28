-- Model Section Completion Tracking View
-- Purpose: Monitors completion of model sections and associated activity logging.
-- Tests: Triggers for section completion and activity logging.
-- Use Case: Track learning progress, verify completion triggers work.
--
-- What it does:
-- - Shows completed model sections with user and model details
-- - Links to activity log entries for completion events
-- - Helps verify both completion tracking and logging triggers
--
-- Example Usage:
-- SELECT user_name, model_type, section_name, completed_at, logged_at
-- FROM model_section_completion_tracking
-- WHERE logged_at IS NULL;
--
-- Example Output:
-- | user_name | model_type | section_name | completed_at          | logged_at            |
-- |-----------|------------|--------------|-----------------------|----------------------|
-- | Alice     | agile      | Sprint Planning | 2024-01-15 10:00:00 | 2024-01-15 10:00:00 |
--
-- Rows with logged_at IS NULL indicate the activity logging trigger failed.
CREATE OR REPLACE VIEW model_section_completion_tracking AS
SELECT
  ms.id,
  ms.model_instance_id,
  mi.model_type,
  mi.user_id,
  p.name as user_name,
  ms.section_name,
  ms.is_completed,
  ms.updated_at as completed_at,
  al.created_at as logged_at,
  al.details
FROM model_sections ms
JOIN model_instances mi ON ms.model_instance_id = mi.id
JOIN profiles p ON mi.user_id = p.user_id
LEFT JOIN activity_log al ON al.entity_id = ms.id AND al.entity_type = 'model_section' AND al.action_type = 'complete_section'
WHERE ms.is_completed = true
ORDER BY ms.updated_at DESC;