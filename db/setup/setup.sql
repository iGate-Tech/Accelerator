-- Complete Database Setup Orchestrator
-- This script coordinates the entire database setup process in strict dependency order
-- Each step depends on the previous ones being completed first
--
-- WHY THIS ORDER MATTERS:
-- 1. Extensions must be first (provides core functionality)
-- 2. Tables need to exist before indexes/policies can reference them
-- 3. Security policies depend on table structure
-- 4. Functions must exist before triggers can reference them
-- 5. Triggers depend on both tables and functions
-- 6. Views can reference any of the above

-- =================================================================================
-- STEP 1: EXTENSIONS
-- =================================================================================
-- PostgreSQL extensions provide core functionality (UUIDs, etc.)
-- Must be loaded before any objects that depend on them
\i db/setup/extensions/extensions.sql

-- =================================================================================
-- STEP 2: TABLES
-- =================================================================================
-- Core data structures - foundation of the entire schema
-- All other objects (indexes, policies, etc.) depend on these
\i db/setup/tables/tables.sql

-- =================================================================================
-- STEP 3: INDEXES
-- =================================================================================
-- Performance optimization for queries
-- Applied after tables exist but before heavy data loading
\i db/setup/indexes/indexes.sql

-- =================================================================================
-- STEP 4: SECURITY POLICIES
-- =================================================================================
-- Row Level Security (RLS) policies for data access control
-- Must be applied after tables but before functions (some policies use functions)
\i db/setup/policies/policies.sql

-- =================================================================================
-- STEP 5: FUNCTIONS (Dependency-Ordered)
-- =================================================================================
-- Business logic functions in carefully ordered dependencies:
-- Core functions first (used by everything else)
-- Then user management (needed by most features)
-- Credit system (financial operations)
-- Idea management (content operations)
-- Voting (depends on ideas and users)
-- Model management (AI workflows)
-- Portfolio (depends on ideas)
\i db/setup/functions/functions-core.sql
\i db/setup/functions/functions-user.sql
\i db/setup/functions/functions-credit.sql
\i db/setup/functions/functions-idea.sql
\i db/setup/functions/functions-voting.sql
\i db/setup/functions/functions-model.sql
\i db/setup/functions/functions-portfolio.sql

-- =================================================================================
-- STEP 6: TRIGGERS
-- =================================================================================
-- Automated database triggers for business rules and data integrity
-- Depend on both tables (for attachment) and functions (for logic)
\i db/setup/triggers/triggers.sql

-- =================================================================================
-- STEP 7: VIEWS
-- =================================================================================
-- Database views for data aggregation and API optimization
-- Can reference tables, functions, and other views
\i db/setup/views/views.sql