-- Subscription Packages Seed Data
-- Purpose: Defines available subscription tiers and their features
-- Core of the SaaS monetization model
--
-- Package Tiers:
-- 1. Free: Basic access with limited features
-- 2. Student: Mid-tier with model access and creation rights
-- 3. Enterprise: Full access with team collaboration features
--
-- Package Details:
-- - Free: $0/month, 50 credits, basic voting only
-- - Student: $9.99/month, 500 credits, creation and basic models
-- - Enterprise: $29.99/month, 2000 credits, full features + team management
--
-- Business Logic:
-- - Freemium model to attract users
-- - Student tier for individual creators
-- - Enterprise tier for teams and serious projects
-- - Credits regenerate monthly for continuous usage
-- - Feature flags control access to advanced capabilities
--
-- Usage Context:
-- - Subscription management UI
-- - Feature gating throughout application
-- - Billing and payment processing
-- - User onboarding and upgrade flows
--
-- Example Usage:
-- - New user gets Free tier automatically
-- - Creator upgrades to Student for model access
-- - Team upgrades to Enterprise for collaboration features
INSERT INTO packages (name, type, price_monthly, credits_monthly, features) VALUES
  ('Free', 'free', 0, 50, '{"vote": true}'),
  ('Student', 'student', 999, 500, '{"create": true, "models": true}'),
  ('Enterprise', 'enterprise', 2999, 2000, '{"all": true, "team": true}');