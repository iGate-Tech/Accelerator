-- Create Notification Function
-- Purpose: Creates in-app notifications for users.
-- What it does: Inserts a notification record into the notifications table.
-- When to use: Called by triggers and application logic to alert users of events.
-- Dependencies: Requires notifications table.
--
-- Example Scenario 1: Vote notification
-- Action: create_notification('user-123', 'vote_received', 'Someone voted on your idea!')
-- Result: Notification created and visible to user-123 in their notification feed
--
-- Example Scenario 2: Achievement notification
-- Action: create_notification('user-456', 'achievement', '🏆 Achievement Unlocked: First Idea!')
-- Result: Achievement notification created for user-456
--
-- Business Logic: Simple notification creation, UI handles display formatting and read status.
CREATE OR REPLACE FUNCTION create_notification(p_user_id UUID, p_type TEXT, p_message TEXT) RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, message) VALUES (p_user_id, p_type, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;