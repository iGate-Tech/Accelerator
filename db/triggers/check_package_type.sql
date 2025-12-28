-- Package Type Validation Trigger
-- Purpose: Ensures users only have valid package types (free, student, enterprise).
-- What it does: Validates that package_type is one of the allowed values before allowing the change.
-- When it fires: BEFORE INSERT OR UPDATE on profiles table.
-- Dependencies: None.
--
-- Example Scenario 1: Valid package type (ALLOWED)
-- Before: user-123 has package_type = 'free'
-- Action: Admin upgrades user to package_type = 'enterprise'
-- After: Update succeeds, user now has enterprise package
--
-- Example Scenario 2: Invalid package type (BLOCKED)
-- Before: user-123 has package_type = 'free'
-- Action: System attempts to set package_type = 'premium'
-- After: Trigger raises exception: 'Invalid package type'
--
-- Business Logic: Maintains data integrity and ensures consistent package assignments.
-- This prevents typos or invalid data from corrupting the subscription system.
CREATE OR REPLACE FUNCTION check_package_type() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.package_type NOT IN ('free', 'student', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid package type';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_package_type
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION check_package_type();