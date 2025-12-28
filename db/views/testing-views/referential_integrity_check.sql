-- Referential Integrity Check View
-- Purpose: Detects orphaned records and broken foreign key relationships.
-- Tests: Data consistency and referential integrity constraints.
-- Use Case: Identify data corruption, cleanup orphaned records.
--
-- What it does:
-- - Checks for records in child tables that reference non-existent parent records
-- - Reports counts of integrity violations
-- - Helps maintain database consistency
--
-- Example Usage:
-- SELECT * FROM referential_integrity_check WHERE count > 0;
--
-- Example Output:
-- | issue_type          | count | description                  |
-- |---------------------|-------|------------------------------|
-- | orphaned_votes      | 3     | Votes referencing deleted ideas |
-- | orphaned_favorites  | 1     | Favorites for deleted ideas    |
--
-- Non-zero counts indicate data integrity issues that need fixing.
CREATE OR REPLACE VIEW referential_integrity_check AS
-- Check for orphaned votes
SELECT
  'orphaned_votes' as issue_type,
  COUNT(*) as count,
  'Votes referencing non-existent ideas' as description
FROM votes v
LEFT JOIN ideas i ON v.idea_id = i.id
WHERE i.id IS NULL
UNION ALL
-- Check for orphaned favorites
SELECT
  'orphaned_favorites' as issue_type,
  COUNT(*) as count,
  'Favorites referencing non-existent ideas' as description
FROM user_favorites uf
LEFT JOIN ideas i ON uf.idea_id = i.id
WHERE i.id IS NULL
UNION ALL
-- Check for orphaned model instances
SELECT
  'orphaned_model_instances' as issue_type,
  COUNT(*) as count,
  'Model instances referencing non-existent ideas' as description
FROM model_instances mi
LEFT JOIN ideas i ON mi.idea_id = i.id
WHERE i.id IS NULL
UNION ALL
-- Check for orphaned activity logs
SELECT
  'orphaned_activity_logs' as issue_type,
  COUNT(*) as count,
  'Activity logs referencing non-existent users' as description
FROM activity_log al
LEFT JOIN profiles p ON al.user_id = p.user_id
WHERE p.user_id IS NULL;