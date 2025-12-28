-- Get Leaderboard Data Function
-- Purpose: Retrieves current leaderboard rankings based on idea popularity.
-- What it does: Calculates rankings from votes and rewards, returns top ideas.
-- When to use: Called for leaderboard displays and community features.
-- Dependencies: Requires ideas, votes, voting_rewards tables.
--
-- Example Scenario 1: Get top 10 ideas
-- Action: get_leaderboard_data()
-- Result: Returns JSON array of top 10 ideas by vote count and rewards
--
-- Business Logic: Implements leaderboard algorithm prioritizing engagement and rewards.
CREATE OR REPLACE FUNCTION get_leaderboard_data()
RETURNS JSON AS $$
DECLARE
    leaderboard_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'idea_id', i.id,
            'title', i.title,
            'author', p.name,
            'category', i.category,
            'vote_count', COUNT(v.id),
            'total_rewards', COALESCE(SUM(vr.reward_amount), 0),
            'average_rating', ROUND(AVG(v.rating), 2),
            'rank', ROW_NUMBER() OVER (
                ORDER BY COUNT(v.id) DESC, COALESCE(SUM(vr.reward_amount), 0) DESC
            )
        )
    ) INTO leaderboard_data
    FROM ideas i
    JOIN profiles p ON i.user_id = p.user_id
    LEFT JOIN votes v ON i.id = v.idea_id
    LEFT JOIN voting_rewards vr ON i.id = vr.idea_id
    WHERE i.privacy = 'public'
    GROUP BY i.id, i.title, p.name, i.category
    HAVING COUNT(v.id) > 0
    ORDER BY COUNT(v.id) DESC, COALESCE(SUM(vr.reward_amount), 0) DESC
    LIMIT 50;

    RETURN json_build_object(
        'leaderboard', COALESCE(leaderboard_data, '[]'::JSON),
        'generated_at', NOW(),
        'total_ranked_ideas', json_array_length(COALESCE(leaderboard_data, '[]'::JSON))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;