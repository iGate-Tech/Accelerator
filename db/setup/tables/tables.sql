-- Database Tables Setup
-- Creates all database tables in strict dependency order
-- Tables are ordered to satisfy foreign key constraints
--
-- DEPENDENCY HIERARCHY:
-- 1. Foundation tables (no dependencies)
-- 2. Authentication-dependent tables
-- 3. Business entity tables
-- 4. Relationship/junction tables
-- 5. Derived/calculated tables
--
-- TOTAL TABLES: 21
-- Each table includes comprehensive documentation and constraints

-- ============================================================================
-- CORE FOUNDATION TABLES
-- ============================================================================
-- Authentication and user management (depends on auth.users)
\i db/tables/profiles.sql

-- ============================================================================
-- BUSINESS ENTITIES
-- ============================================================================
-- Primary business objects
\i db/tables/ideas.sql

-- ============================================================================
-- SOCIAL & INTERACTION FEATURES
-- ============================================================================
-- User interactions and social features
\i db/tables/votes.sql
\i db/tables/user_favorites.sql

-- ============================================================================
-- AI MODEL MANAGEMENT
-- ============================================================================
-- AI workflow and progress tracking
\i db/tables/model_instances.sql
\i db/tables/model_sections.sql

-- ============================================================================
-- COLLABORATION FEATURES
-- ============================================================================
-- Team and organizational features
\i db/tables/team_members.sql

-- ============================================================================
-- GENERATED CONTENT
-- ============================================================================
-- AI-generated reports and documents
\i db/tables/reports.sql

-- ============================================================================
-- SYSTEM COMMUNICATION
-- ============================================================================
-- Notifications and user messaging
\i db/tables/notifications.sql

-- ============================================================================
-- FINANCIAL & ECONOMIC SYSTEM
-- ============================================================================
-- Credit economy and financial transactions
\i db/tables/credit_transactions.sql
\i db/tables/billing_history.sql
\i db/tables/rewards.sql

-- ============================================================================
-- ACTIVITY & AUDIT TRAIL
-- ============================================================================
-- User activity tracking and audit logs
\i db/tables/activity_log.sql
\i db/tables/voting_rewards.sql

-- ============================================================================
-- USER CONFIGURATION
-- ============================================================================
-- User preferences and settings
\i db/tables/user_settings.sql

-- ============================================================================
-- PRODUCT CATALOG
-- ============================================================================
-- Subscription packages and credit offerings
\i db/tables/credit_packages.sql
\i db/tables/packages.sql

-- ============================================================================
-- ENTERPRISE FEATURES
-- ============================================================================
-- Advanced organizational features
\i db/tables/portfolios.sql
\i db/tables/portfolio_ideas.sql
\i db/tables/portfolio_members.sql

-- ============================================================================
-- INFRASTRUCTURE
-- ============================================================================
-- Session management and system infrastructure
\i db/tables/session.sql