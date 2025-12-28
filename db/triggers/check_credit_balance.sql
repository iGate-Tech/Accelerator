-- Credit Balance Validation Trigger
-- Purpose: Prevents credit balances from going negative, enforcing business rules.
-- What it does: Checks that any update to credit_balance doesn't result in a negative value.
-- When it fires: BEFORE INSERT OR UPDATE on profiles table.
-- Dependencies: None.
--
-- Example Scenario 1: Attempted negative balance (BLOCKED)
-- Before: user-123 has credit_balance = 50.00
-- Action: System attempts to set credit_balance = -10.00
-- After: Trigger raises exception: 'Credit balance cannot be negative'
--
-- Example Scenario 2: Valid update (ALLOWED)
-- Before: user-123 has credit_balance = 50.00
-- Action: System sets credit_balance = 75.00 (after credit purchase)
-- After: Update succeeds, balance is now 75.00
--
-- Business Logic: Protects against accounting errors and ensures users can't spend more credits than they have.
-- This is a critical business rule for the credit system integrity.
CREATE OR REPLACE FUNCTION check_credit_balance() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.credit_balance < 0 THEN
    RAISE EXCEPTION 'Credit balance cannot be negative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_credit_balance
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION check_credit_balance();