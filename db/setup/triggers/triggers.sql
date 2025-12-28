-- Database Triggers Setup
-- Implements automated business logic and data integrity rules
-- Triggers fire automatically on data changes to maintain consistency
--
-- TRIGGER CATEGORIES:
-- 1. VALIDATION TRIGGERS: Enforce business rules and data integrity
-- 2. CALCULATION TRIGGERS: Auto-update computed fields and aggregations
-- 3. NOTIFICATION TRIGGERS: Alert users of important events
-- 4. LOGGING TRIGGERS: Maintain audit trails and activity records
-- 5. REWARD TRIGGERS: Automate gamification and incentive systems
--
-- TOTAL TRIGGERS: 15 individual trigger definitions
-- EXECUTION: All triggers are event-driven (BEFORE/AFTER INSERT/UPDATE/DELETE)
--
-- RELIABILITY NOTES:
-- - Triggers ensure data consistency even when application logic fails
-- - All triggers include proper error handling and transaction safety
-- - Performance impact is minimal due to efficient execution

-- ============================================================================
-- VALIDATION & INTEGRITY TRIGGERS
-- ============================================================================
-- Enforce business rules and prevent invalid data states
\i db/triggers/check_credit_balance.sql
\i db/triggers/check_package_type.sql
\i db/triggers/prevent_negative_credit.sql

-- ============================================================================
-- CALCULATION & UPDATE TRIGGERS
-- ============================================================================
-- Automatically maintain computed fields and aggregations
\i db/triggers/update_completion_percentage.sql
\i db/triggers/update_idea_rating.sql
\i db/triggers/update_credit_balance.sql

-- ============================================================================
-- ACTIVITY & AUDIT TRIGGERS
-- ============================================================================
-- Maintain comprehensive audit trails and activity logs
\i db/triggers/log_idea_changes.sql
\i db/triggers/log_section_completion.sql
\i db/triggers/auto_log_activities.sql

-- ============================================================================
-- NOTIFICATION & COMMUNICATION TRIGGERS
-- ============================================================================
-- Keep users informed of important events and interactions
\i db/triggers/notify_on_vote.sql
\i db/triggers/auto_create_notifications.sql

-- ============================================================================
-- REWARD & GAMIFICATION TRIGGERS
-- ============================================================================
-- Automate incentive systems and achievement tracking
\i db/triggers/auto_reward_vote_credits.sql
\i db/triggers/auto_reward_daily_first_vote.sql
\i db/triggers/auto_unlock_models.sql
\i db/triggers/auto_milestone_achievements.sql