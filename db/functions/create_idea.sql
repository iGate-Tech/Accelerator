-- Create Idea Function
-- Purpose: Creates a new idea with basic information and logs the activity.
-- What it does: Inserts idea record and logs the creation activity.
-- When to use: Called when users create new ideas through the application.
-- Dependencies: Requires ideas table and log_activity function.
--
-- Example Scenario 1: Basic idea creation
-- Action: create_idea('user-123', 'My Awesome App', 'Technology', 'An app that solves world hunger')
-- Result: New idea created, activity logged, returns the new idea UUID
--
-- Example Scenario 2: Minimal idea creation
-- Action: create_idea('user-456', 'Simple Idea')
-- Result: Idea created with defaults for category and description, activity logged
--
-- Business Logic: Provides a simple interface for idea creation with automatic activity logging.
CREATE OR REPLACE FUNCTION create_idea(p_user_id UUID, p_title TEXT, p_category TEXT DEFAULT NULL, p_description TEXT DEFAULT NULL) RETURNS UUID AS $$
DECLARE
  new_idea_id UUID;
BEGIN
  INSERT INTO ideas (user_id, title, category, description)
  VALUES (p_user_id, p_title, p_category, p_description)
  RETURNING id INTO new_idea_id;

  -- Log activity
  PERFORM log_activity(p_user_id, 'create', 'idea', new_idea_id);

  RETURN new_idea_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;