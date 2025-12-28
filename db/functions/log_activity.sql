-- Log Activity Function
-- Purpose: Records user activities for audit trails and analytics.
-- What it does: Inserts activity records into the activity_log table.
-- When to use: Called by triggers and application logic to track user actions.
-- Dependencies: Requires activity_log table.
--
-- Example Scenario 1: Idea creation
-- Action: log_activity('user-123', 'create', 'idea', '550e8400-e29b-41d4-a716-446655440000', '{"title": "My App"}')
-- Result: Activity logged for audit trail and user activity feeds
--
-- Example Scenario 2: Vote action
-- Action: log_activity('user-456', 'vote', 'idea', '550e8400-e29b-41d4-a716-446655440001', '{"rating": 5}')
-- Result: Vote activity recorded for analytics
--
-- Business Logic: Centralized activity logging for all user actions, supports detailed auditing.
CREATE OR REPLACE FUNCTION log_activity(p_user_id UUID, p_action_type TEXT, p_entity_type TEXT, p_entity_id UUID, p_details JSONB DEFAULT '{}') RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, details)
  VALUES (p_user_id, p_action_type, p_entity_type, p_entity_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;