-- Setup Idea Management Functions
-- Idea creation and management functions

-- Include individual idea function files
\i db/functions/generate_idea_slug.sql
\i db/functions/manage_idea.sql
\i db/functions/validate_idea_access.sql
\i db/functions/get_user_ideas.sql
\i db/functions/validate_and_create_idea.sql
\i db/functions/update_idea_workflow.sql
\i db/functions/get_user_ideas_filtered.sql