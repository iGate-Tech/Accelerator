-- Package Type Validation View
-- Purpose: Ensures all user profiles have valid package types as enforced by triggers.
-- Tests: Trigger that validates package_type on profile updates/inserts.
-- Use Case: Monitor data quality, detect invalid package assignments.
--
-- What it does:
-- - Lists all profiles with package types not in the allowed list ('free', 'student', 'enterprise')
-- - Should return empty result set if validation triggers are working correctly
--
-- Example Usage:
-- SELECT COUNT(*) FROM package_type_validation;
--
-- If triggers are working, this should return 0.
-- If broken, you might see:
-- | user_id | name  | package_type | validation_status |
-- |---------|-------|--------------|-------------------|
-- | user-1  | Alice | premium      | INVALID           |
--
-- This indicates the package type validation trigger failed to prevent invalid data.
CREATE OR REPLACE VIEW package_type_validation AS
SELECT
  user_id,
  name,
  package_type,
  CASE WHEN package_type IN ('free', 'student', 'enterprise') THEN 'VALID' ELSE 'INVALID' END as validation_status
FROM profiles
WHERE package_type NOT IN ('free', 'student', 'enterprise');