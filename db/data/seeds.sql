-- Sample data for Accelerator database
-- Run after schema setup

-- Credit packages
INSERT INTO credit_packages (name, credits, price) VALUES ('Basic', 500, 999), ('Pro', 2000, 2999);

-- Packages
INSERT INTO packages (name, type, price_monthly, credits_monthly, features) VALUES
('Free', 'free', 0, 50, '{"vote": true}'),
('Student', 'student', 999, 500, '{"create": true, "models": true}'),
('Enterprise', 'enterprise', 2999, 2000, '{"all": true, "team": true}');