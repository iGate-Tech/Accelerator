-- Row Level Security (RLS) Policies Setup
-- Implements fine-grained access control at the database level
-- Policies control who can see/modify which data rows
--
-- POLICY TYPES IMPLEMENTED:
-- 1. SELF-MANAGEMENT: Users control their own data
-- 2. PUBLIC ACCESS: Community features with open visibility
-- 3. TEAM COLLABORATION: Shared access for team members
-- 4. SERVICE ROLE: Administrative access for backend operations
-- 5. OWNER PERMISSIONS: Content creators control their work
--
-- SECURITY PRINCIPLES:
-- - Defense in depth with application and database level controls
-- - Principle of least privilege for all operations
-- - Service role bypasses RLS for trusted backend operations
-- - Authentication required for all data access
--
-- TOTAL POLICIES: 16 individual policy files
-- COVERAGE: All 21 tables protected with appropriate access controls

-- ============================================================================
-- FOUNDATION POLICIES
-- ============================================================================
-- Core user data access (fundamental to all other policies)
\i db/policies/profiles.sql

-- Administrative access (must be early for system operations)
\i db/policies/service_role_admin.sql

-- ============================================================================
-- BUSINESS ENTITY POLICIES
-- ============================================================================
-- Primary business objects and their access rules
\i db/policies/ideas.sql
\i db/policies/votes.sql

-- ============================================================================
-- WORKFLOW & PROGRESS POLICIES
-- ============================================================================
-- AI model and progress tracking access
\i db/policies/model_instances_sections.sql

-- ============================================================================
-- COLLABORATION POLICIES
-- ============================================================================
-- Team and organizational features
\i db/policies/team_members.sql
\i db/policies/reports.sql

-- ============================================================================
-- USER EXPERIENCE POLICIES
-- ============================================================================
-- Communication and personalization features
\i db/policies/notifications.sql
\i db/policies/user_favorites.sql
\i db/policies/user_settings.sql

-- ============================================================================
-- FINANCIAL POLICIES
-- ============================================================================
-- Credit economy and transaction access
\i db/policies/credit_transactions.sql
\i db/policies/billing_history.sql
\i db/policies/activity_log.sql

-- ============================================================================
-- COMMERCIAL POLICIES
-- ============================================================================
-- Product catalog and commercial features
\i db/policies/packages.sql

-- ============================================================================
-- ENTERPRISE POLICIES
-- ============================================================================
-- Advanced organizational features
\i db/policies/portfolios.sql

-- ============================================================================
-- INFRASTRUCTURE POLICIES
-- ============================================================================
-- System infrastructure and file storage
\i db/policies/storage_buckets_setup.sql