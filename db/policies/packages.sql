-- Product Catalog RLS Policies
-- Purpose: Controls access to product offerings (packages and credit plans)
-- Security Model: Public read access for authenticated users
--
-- Policy Details:
-- 1. Read-only access to product catalog
--
-- Security Rationale:
-- - Product information is public marketing data
-- - Prevents unauthorized catalog modifications
-- - Allows all users to browse offerings
--
-- Business Impact:
-- - Enables subscription and credit purchase flows
-- - Supports transparent pricing display
CREATE POLICY "Allow authenticated users to read credit packages" ON credit_packages FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read packages" ON packages FOR SELECT USING (auth.role() = 'authenticated');