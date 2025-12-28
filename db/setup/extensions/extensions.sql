-- PostgreSQL Extensions Setup
-- Enables critical database extensions required for application functionality
-- Extensions provide enhanced PostgreSQL capabilities beyond standard SQL
--
-- EXTENSIONS INCLUDED:
-- - uuid-ossp: Universally Unique Identifier (UUID) generation
--   * Essential for primary keys and unique identifiers
--   * Provides cryptographically strong random UUIDs (v4)
--   * Required for all entity relationships in the application
--
-- DEPENDENCY NOTES:
-- - Must be executed before any tables or functions that use extension features
-- - Requires superuser privileges for installation
-- - Safe to run multiple times (IF NOT EXISTS protection)

-- Include individual extension files
\i db/extensions/uuid-ossp.sql