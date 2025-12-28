-- Database Cleanup Script
-- Purpose: Clears existing test data before seeding fresh data
-- Run this before applying seed data to ensure clean state
--
-- What it does:
-- - Removes all data from credit_packages and packages tables
-- - Uses CASCADE to handle foreign key constraints
-- - Prepares database for fresh seed data import
--
-- When to use:
-- - Before running seed data in development/testing
-- - When resetting database to known state
-- - During automated testing setup
--
-- Safety Notes:
-- - Only affects specified tables
-- - CASCADE ensures referential integrity
-- - Does not affect production data (use in dev/test only)
TRUNCATE TABLE credit_packages CASCADE;
TRUNCATE TABLE packages CASCADE;