-- Validation Threshold Progress View
-- Purpose: Shows ideas approaching model unlock thresholds.
-- Tests: Preparation for model unlocking triggers.
-- Use Case: Monitor ideas nearing validation milestones.
--
-- What it does:
-- - Shows ideas with their current validation metrics
-- - Indicates readiness for different unlock levels
-- - Shows how many more votes or rating improvement needed
--
-- Example Usage:
-- SELECT title, threshold_status, votes_needed_for_all, rating_improvement_needed
-- FROM validation_threshold_progress
-- WHERE threshold_status LIKE 'READY_FOR%'
-- ORDER BY current_votes DESC;
--
-- Example Output:
-- | title        | threshold_status | votes_needed_for_all | rating_improvement_needed |
-- |--------------|------------------|----------------------|---------------------------|
-- | Smart Hub    | READY_FOR_ADVANCED | 15                   | 0.0                       |
-- | AI Tool      | READY_FOR_BASIC   | 3                    | 0.2                       |
--
-- Helps identify ideas close to unlocking new models.
CREATE OR REPLACE VIEW validation_threshold_progress AS
SELECT
  i.id,
  i.title,
  i.user_id,
  p.name as user_name,
  COUNT(v.id) as current_votes,
  ROUND(AVG(v.rating), 2) as current_rating,
  CASE
    WHEN COUNT(v.id) >= 50 AND ROUND(AVG(v.rating), 2) >= 4.0 THEN 'READY_FOR_ALL'
    WHEN COUNT(v.id) >= 25 AND ROUND(AVG(v.rating), 2) >= 3.5 THEN 'READY_FOR_ADVANCED'
    WHEN COUNT(v.id) >= 10 AND ROUND(AVG(v.rating), 2) >= 3.0 THEN 'READY_FOR_BASIC'
    ELSE 'NEEDS_MORE_VALIDATION'
  END as threshold_status,
  50 - COUNT(v.id) as votes_needed_for_all,
  CASE WHEN ROUND(AVG(v.rating), 2) < 4.0 THEN 4.0 - ROUND(AVG(v.rating), 2) ELSE 0 END as rating_improvement_needed
FROM ideas i
JOIN profiles p ON i.user_id = p.user_id
LEFT JOIN votes v ON i.id = v.idea_id
GROUP BY i.id, i.title, i.user_id, p.name
HAVING COUNT(v.id) > 0
ORDER BY current_votes DESC;