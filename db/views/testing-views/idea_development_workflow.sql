-- Idea Development Workflow View
-- Purpose: Monitors the complete idea development lifecycle.
-- Tests: Idea progression through different development stages.
-- Use Case: Track project completion, identify development bottlenecks.
--
-- What it does:
-- - Shows all ideas with their development metrics
-- - Categorizes ideas by completion stage
-- - Tracks model completion and voting activity
-- - Shows unlocked models status
--
-- Example Usage:
-- SELECT development_stage, COUNT(*) as idea_count
-- FROM idea_development_workflow
-- GROUP BY development_stage;
--
-- Example Output:
-- | development_stage | idea_count |
-- |-------------------|------------|
-- | COMPLETED         | 15         |
-- | NEARING_COMPLETION| 8          |
-- | HALFWAY_THERE     | 12         |
-- | STARTED           | 25         |
-- | DRAFT             | 45         |
--
-- Helps understand project completion rates and development velocity.
CREATE OR REPLACE VIEW idea_development_workflow AS
SELECT
  i.id,
  i.title,
  i.user_id,
  p.name as user_name,
  i.created_at,
  i.overall_status,
  i.completion_percentage,
  COUNT(DISTINCT mi.id) as total_models,
  COUNT(DISTINCT CASE WHEN mi.status = 'completed' THEN mi.id END) as completed_models,
  COUNT(DISTINCT v.id) as total_votes,
  ROUND(AVG(v.rating), 2) as average_rating,
  i.unlocked_models,
  CASE
    WHEN i.overall_status = 'completed' THEN 'COMPLETED'
    WHEN i.completion_percentage >= 75 THEN 'NEARING_COMPLETION'
    WHEN i.completion_percentage >= 50 THEN 'HALFWAY_THERE'
    WHEN i.completion_percentage > 0 THEN 'STARTED'
    ELSE 'DRAFT'
  END as development_stage
FROM ideas i
JOIN profiles p ON i.user_id = p.user_id
LEFT JOIN model_instances mi ON i.id = mi.idea_id
LEFT JOIN votes v ON i.id = v.idea_id
GROUP BY i.id, i.title, i.user_id, p.name, i.created_at, i.overall_status, i.completion_percentage, i.unlocked_models
ORDER BY i.created_at DESC;