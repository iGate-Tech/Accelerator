-- Idea Progress View
-- This view shows the completion status and progress of individual ideas.
-- It categorizes ideas into progress states:
-- - 'draft': No progress (0% completion)
-- - 'in_progress': Some progress (>0% but <100%)
-- - 'completed': Fully completed (100%)
-- Also includes counts of associated models and their completion status.
-- Used for project tracking, progress dashboards, and workflow management.
--
-- Example usage:
-- SELECT title, completion_percentage, progress_status, total_models
-- FROM idea_progress_view
-- WHERE user_id = 'user-123';
--
-- Example output:
-- | title        | completion_percentage | progress_status | total_models |
-- |--------------|-----------------------|-----------------|--------------|
-- | AI Assistant | 100                   | completed       | 3            |
-- | Mobile App   | 45                    | in_progress     | 2            |
-- | New Idea     | 0                     | draft           | 0            |
CREATE OR REPLACE VIEW idea_progress_view AS
SELECT
  i.id,
  i.user_id,
  i.title,
  i.completion_percentage,
  CASE
    WHEN i.completion_percentage >= 100 THEN 'completed'
    WHEN i.completion_percentage > 0 THEN 'in_progress'
    ELSE 'draft'
  END as progress_status,
  COUNT(DISTINCT mi.id) as total_models,
  COUNT(DISTINCT CASE WHEN mi.status = 'completed' THEN mi.id END) as completed_models
FROM ideas i
LEFT JOIN model_instances mi ON i.id = mi.idea_id
GROUP BY i.id, i.user_id, i.title, i.completion_percentage;