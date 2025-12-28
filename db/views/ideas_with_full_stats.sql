-- Ideas with Full Stats View
-- This comprehensive view combines all idea information with extensive community and progress statistics.
-- Includes all idea fields plus:
-- - Author information (name and avatar)
-- - Community engagement (votes, favorites, average rating)
-- - Model progress (total models, completed models, completion percentage)
-- - Recent activity timestamps
-- Used for detailed idea pages, analytics, and recommendation systems.
--
-- Example usage:
-- SELECT title, author_name, vote_count, favorite_count, model_completion_percentage
-- FROM ideas_with_full_stats
-- WHERE id = 'idea-456';
--
-- Example output:
-- | title        | author_name | vote_count | favorite_count | model_completion_percentage |
-- |--------------|-------------|------------|----------------|----------------------------|
-- | AI Assistant | Bob         | 45         | 12             | 85.7                       |
CREATE OR REPLACE VIEW ideas_with_full_stats AS
SELECT
  i.*,
  -- Author information
  p.name as author_name,
  p.avatar_url as author_avatar,
  -- Statistics
  COUNT(DISTINCT v.id) as vote_count,
  ROUND(AVG(v.rating), 2) as average_rating,
  COUNT(DISTINCT f.id) as favorite_count,
  COUNT(DISTINCT mi.id) as total_models,
  COUNT(DISTINCT CASE WHEN mi.status = 'completed' THEN mi.id END) as completed_models,
  -- Model progress percentage
  CASE
    WHEN COUNT(mi.id) > 0 THEN ROUND((COUNT(CASE WHEN mi.status = 'completed' THEN 1 END)::decimal / COUNT(mi.id)) * 100, 1)
    ELSE 0
  END as model_completion_percentage,
  -- Recent activity
  MAX(al.created_at) as last_activity_at
FROM ideas i
JOIN profiles p ON i.user_id = p.user_id
LEFT JOIN votes v ON i.id = v.idea_id
LEFT JOIN user_favorites f ON i.id = f.idea_id
LEFT JOIN model_instances mi ON i.id = mi.idea_id
LEFT JOIN activity_log al ON i.id = al.entity_id AND al.entity_type = 'idea'
GROUP BY i.id, p.name, p.avatar_url;