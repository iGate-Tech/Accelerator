-- User Model Progress View
-- This view tracks user progress through various model types and their completion status.
-- It aggregates data from model_instances and model_sections to show:
-- - Progress by model type (e.g., different frameworks or methodologies)
-- - Total sections and completed sections per model type
-- - Calculated completion percentage
-- - Instance counts (total and completed)
-- Used for learning progress tracking and achievement systems.
--
-- Example usage:
-- SELECT model_type, completion_percentage, total_instances
-- FROM user_model_progress
-- WHERE user_id = 'user-123';
--
-- Example output:
-- | model_type    | completion_percentage | total_instances |
-- |---------------|-----------------------|-----------------|
-- | agile         | 85.5                  | 3               |
-- | scrum         | 92.0                  | 2               |
-- | design_thinking | 45.2               | 1               |
CREATE OR REPLACE VIEW user_model_progress AS
SELECT
  mi.user_id,
  mi.model_type,
  COUNT(*) as total_sections,
  COUNT(CASE WHEN ms.is_completed THEN 1 END) as completed_sections,
  ROUND(
    (COUNT(CASE WHEN ms.is_completed THEN 1 END) * 100.0) / COUNT(*),
    1
  ) as completion_percentage,
  COUNT(DISTINCT mi.id) as total_instances,
  COUNT(DISTINCT CASE WHEN mi.status = 'completed' THEN mi.id END) as completed_instances
FROM model_instances mi
JOIN model_sections ms ON mi.id = ms.model_instance_id
GROUP BY mi.user_id, mi.model_type;