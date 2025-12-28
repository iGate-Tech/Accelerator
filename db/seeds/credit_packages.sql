-- Credit Packages Seed Data
-- Purpose: Defines available credit purchase options for users
-- Part of the monetization and credit economy system
--
-- What it contains:
-- - Basic package: 500 credits for $9.99
-- - Pro package: 2000 credits for $29.99
--
-- Business Logic:
-- - Basic: Entry-level credit purchase for casual users
-- - Pro: Higher volume purchase with better value proposition
-- - Prices in cents (999 = $9.99, 2999 = $29.99)
-- - Credits provide access to AI features and premium content
--
-- Usage Context:
-- - Displayed in credit purchase UI
-- - Used for payment processing integration
-- - Supports different user segments (casual vs. power users)
--
-- Example Usage:
-- - User selects "Pro" package → 2000 credits added to account
-- - Payment of $29.99 processed through integrated payment system
-- - Credits immediately available for AI generation and features
INSERT INTO credit_packages (name, credits, price) VALUES
  ('Basic', 500, 999),
  ('Pro', 2000, 2999);