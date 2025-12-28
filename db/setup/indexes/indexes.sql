-- Database Indexes and Storage Configuration Setup
-- Creates performance indexes and configures file storage
--
-- INDEXES INCLUDED:
-- - portfolio_members_user_id: Optimizes portfolio member queries
--   * Improves performance for user-specific portfolio access
--   * Critical for enterprise team collaboration features
--
-- STORAGE CONFIGURATION:
-- - storage_buckets_setup: Configures Supabase Storage buckets
--   * Sets up avatar upload bucket with security and size limits
--   * Enables file upload functionality for user profiles
--
-- PERFORMANCE IMPACT:
-- - Indexes reduce query time from O(n) to O(log n)
-- - Strategic indexing improves application responsiveness
-- - Storage configuration enables media upload features
--
-- MAINTENANCE NOTES:
-- - Monitor index usage with pg_stat_user_indexes
-- - Rebuild indexes periodically for optimal performance
-- - Storage policies ensure secure file access

-- Include individual index and configuration files
\i db/indexes/portfolio_members_user_id.sql
\i db/indexes/storage_buckets_setup.sql