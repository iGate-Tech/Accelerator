-- Notifications Table
-- Purpose: Stores user notifications for platform events
-- Manages in-app notification system
--
-- Key Relationships:
-- - Belongs to users
-- - Created by triggers and application logic
--
-- Business Logic:
-- - Different notification types for various events
-- - is_read tracks user engagement
-- - Supports real-time notification delivery
--
-- Columns:
-- - user_id: Notification recipient
-- - type: Notification category
-- - message: Notification content
-- - is_read: User engagement status
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;