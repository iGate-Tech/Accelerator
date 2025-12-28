-- Complete Database Setup
-- This script sets up the entire database in the correct order

-- Step 1: Extensions
\i db/setup/extensions.sql

-- Step 2: Tables
\i db/setup/tables.sql

-- Step 3: Indexes
\i db/setup/indexes.sql

-- Step 4: Security Policies
\i db/setup/policies.sql

-- Step 5: Functions (in dependency order)
\i db/setup/functions/functions-core.sql
\i db/setup/functions/functions-user.sql
\i db/setup/functions/functions-credit.sql
\i db/setup/functions/functions-idea.sql
\i db/setup/functions/functions-voting.sql
\i db/setup/functions/functions-model.sql
\i db/setup/functions/functions-portfolio.sql

-- Step 6: Triggers
\i db/setup/triggers.sql

-- Step 7: Views
\i db/setup/views.sql