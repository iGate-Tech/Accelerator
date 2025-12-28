-- User Favorites Table
-- Purpose: Tracks user favorite/bookmarked ideas
-- Supports personalization features
--
-- Key Relationships:
-- - Links users to favorited ideas
-- - Enables personalized content feeds
--
-- Business Logic:
-- - Users can favorite multiple ideas
-- - One favorite per user per idea
-- - Used for recommendation algorithms
-- - Triggers notification on favorites
--
-- Columns:
-- - user_id: User who favorited
-- - idea_id: Favorited idea
--
-- Constraints:
-- - Unique constraint prevents duplicate favorites
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, idea_id)
);
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;