-- Full Database Reset Script
-- This script completely resets the database in ordered steps

-- Step 1: Reset users
\i db/reset/reset-users.sql

-- Step 2: Reset views (drop first to avoid dependencies)
\i db/reset/reset-views.sql

-- Step 3: Reset functions
\i db/reset/reset-functions.sql

-- Step 4: Reset triggers
\i db/reset/reset-triggers.sql

-- Step 5: Reset tables
\i db/reset/reset-tables.sql

-- Recreate the public schema
CREATE SCHEMA public;

-- Grant necessary permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- Set search path
SET search_path TO public;