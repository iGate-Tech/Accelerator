-- Automation Success Rates View
-- Purpose: Measures success rates of automated processes and validations.
-- Tests: Overall effectiveness of automation triggers and calculations.
-- Use Case: Monitor system reliability, identify automation failures.
--
-- What it does:
-- - Calculates success percentages for different automated processes
-- - Compares automated results against expected outcomes
-- - Provides overall system health metrics
--
-- Example Usage:
-- SELECT automation_type, success_rate, description
-- FROM automation_success_rates
-- ORDER BY success_rate ASC;
--
-- Example Output:
-- | automation_type           | success_rate | description                          |
-- |---------------------------|--------------|--------------------------------------|
-- | credit_balance_consistency | 98.5         | Balance matches transaction history  |
-- | package_type_validation   | 100.0        | All profiles have valid package types |
-- | completion_calculation    | 95.2         | Completion percentages are accurate  |
--
-- Success rates below 100% indicate areas needing attention.
CREATE OR REPLACE VIEW automation_success_rates AS
-- Credit balance consistency rate
SELECT
  'credit_balance_consistency' as automation_type,
  COUNT(CASE WHEN status = 'VALID' THEN 1 END)::float / COUNT(*) * 100 as success_rate,
  COUNT(*) as total_checked,
  'Percentage of profiles with correct credit balances' as description
FROM credit_balance_validation
UNION ALL
-- Package type validation rate
SELECT
  'package_type_validation' as automation_type,
  CASE WHEN COUNT(*) = 0 THEN 100.0 ELSE 0.0 END as success_rate,
  (SELECT COUNT(*) FROM profiles) as total_checked,
  'Percentage of profiles with valid package types' as description
FROM package_type_validation
UNION ALL
-- Completion calculation accuracy
SELECT
  'completion_calculation' as automation_type,
  COUNT(CASE WHEN status = 'VALID' THEN 1 END)::float / COUNT(*) * 100 as success_rate,
  COUNT(*) as total_checked,
  'Percentage of ideas with accurate completion percentages' as description
FROM completion_percentage_accuracy
UNION ALL
-- Rating calculation accuracy
SELECT
  'rating_calculation' as automation_type,
  COUNT(CASE WHEN status = 'VALID' THEN 1 END)::float / COUNT(*) * 100 as success_rate,
  COUNT(*) as total_checked,
  'Percentage of ideas with accurate ratings' as description
FROM rating_calculation_check;