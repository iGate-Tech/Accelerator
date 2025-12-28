-- Cleanup script for seed data
-- Remove existing test data before seeding

-- Delete test auth users (only the ones we create in seeds)
DELETE FROM auth.users WHERE id::text LIKE '550e8400-e29b-41d4-a716-44665544%';

-- Clear existing seed data tables
TRUNCATE TABLE credit_packages CASCADE;
TRUNCATE TABLE packages CASCADE;