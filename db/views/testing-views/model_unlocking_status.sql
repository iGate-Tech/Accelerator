-- Model Unlocking Status View
-- Purpose: Monitors automatic model unlocking based on validation criteria.
-- Tests: Trigger that unlocks models when ideas meet vote/rating thresholds.
-- Use Case: Verify progression system, track model access.
--
-- What it does:
-- - Shows ideas with their current vote counts and ratings
-- - Displays unlock status based on thresholds:
--   - 10 votes + 3.0 avg rating = Basic models
--   - 25 votes + 3.5 avg rating = Advanced models
--   - 50 votes + 4.0 avg rating = All models
--
-- Example Usage:
-- SELECT title, total_votes, average_rating, unlock_status
-- FROM model_unlocking_status
-- WHERE unlock_status != 'NO_MODELS_UNLOCKED'
-- ORDER BY total_votes DESC;
--
-- Example Output:
-- | title          | total_votes | average_rating | unlock_status        |
-- |----------------|-------------|----------------|----------------------|
-- | AI Assistant   | 65          | 4.2            | ALL_MODELS_UNLOCKED  |
-- | Mobile App     | 28          | 3.6            | ADVANCED_MODELS_UNLOCKED |
--
-- Ideas with high votes/ratings but no unlocks indicate trigger failure.
CREATE OR REPLACE VIEW model_unlocking_status AS
SELECT
  i.id,
  i.title,
  i.user_id,
  p.name as user_name,
  i.unlocked_models,
  COUNT(v.id) as total_votes,
  ROUND(AVG(v.rating), 2) as average_rating,
  i.validation_threshold_met,
  CASE
    WHEN COUNT(v.id) >= 50 AND ROUND(AVG(v.rating), 2) >= 4.0 THEN 'ALL_MODELS_UNLOCKED'
    WHEN COUNT(v.id) >= 25 AND ROUND(AVG(v.rating), 2) >= 3.5 THEN 'ADVANCED_MODELS_UNLOCKED'
    WHEN COUNT(v.id) >= 10 AND ROUND(AVG(v.rating), 2) >= 3.0 THEN 'BASIC_MODELS_UNLOCKED'
    ELSE 'NO_MODELS_UNLOCKED'
  END as unlock_status
FROM ideas i
JOIN profiles p ON i.user_id = p.user_id
LEFT JOIN votes v ON i.id = v.idea_id
GROUP BY i.id, i.title, i.user_id, p.name, i.unlocked_models, i.validation_threshold_met
ORDER BY total_votes DESC;