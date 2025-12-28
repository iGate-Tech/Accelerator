-- Credit Packages Table
-- Purpose: Defines available credit purchase packages
-- Product catalog for credit offerings
--
-- Key Relationships:
-- - Referenced by purchase transactions
-- - Defines pricing tiers
--
-- Business Logic:
-- - Static product definitions
-- - Credits and pricing
-- - Package management
--
-- Columns:
-- - name: Package display name
-- - credits: Credits included
-- - price: Package cost
CREATE TABLE credit_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    credits INTEGER,
    price INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;