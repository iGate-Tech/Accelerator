-- Packages Table
-- Purpose: Subscription package definitions
-- Product catalog for subscription offerings
--
-- Key Relationships:
-- - Referenced by user profiles
-- - Defines subscription tiers
--
-- Business Logic:
-- - Monthly pricing model
-- - Credit allocations
-- - Feature sets (JSONB)
--
-- Columns:
-- - name: Package display name
-- - type: Package category
-- - price_monthly: Monthly cost
-- - credits_monthly: Monthly credit allocation
-- - features: Feature list (JSONB)
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    type TEXT,
    price_monthly INTEGER,
    credits_monthly INTEGER,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;