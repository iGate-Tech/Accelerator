-- Generate Idea Slug Function
-- Purpose: Creates unique URL-friendly slugs for ideas based on their titles.
-- What it does: Converts title to slug format, ensures uniqueness by appending numbers if needed.
-- When to use: Called when creating new ideas to generate SEO-friendly URLs.
-- Dependencies: Requires ideas table for uniqueness checking.
--
-- Example Scenario 1: Unique title
-- Action: generate_idea_slug('My Awesome App')
-- Result: Returns 'my-awesome-app'
--
-- Example Scenario 2: Duplicate title (first duplicate)
-- Before: 'my-awesome-app' already exists
-- Action: generate_idea_slug('My Awesome App')
-- Result: Returns 'my-awesome-app-1'
--
-- Example Scenario 3: Special characters
-- Action: generate_idea_slug('Hello World! (2024)')
-- Result: Returns 'hello-world-2024'
--
-- Example Scenario 4: Empty title
-- Action: generate_idea_slug('')
-- Result: Returns 'idea'
--
-- Business Logic: Creates clean slugs, handles duplicates, ensures URL safety.
CREATE OR REPLACE FUNCTION generate_idea_slug(p_title TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Create base slug from title
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(p_title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));

    -- Ensure it's not empty
    IF base_slug = '' OR base_slug IS NULL THEN
       base_slug := 'idea';
    END IF;

    -- Find unique slug
    final_slug := base_slug;

    WHILE EXISTS(SELECT 1 FROM ideas WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;