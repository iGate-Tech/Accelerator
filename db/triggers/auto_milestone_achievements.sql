-- Automatic Milestone Achievement Trigger
-- Purpose: Awards achievement notifications when users reach activity milestones.
-- What it does: Checks user statistics after credit transactions, awards achievements for various thresholds.
-- When it fires: AFTER INSERT on credit_transactions table (for vote rewards and daily bonuses).
-- Dependencies: Requires create_user_notification() function.
--
-- Achievement Milestones:
-- - idea_creator_10: 10+ ideas created
-- - idea_creator_25: 25+ ideas created
-- - project_finisher: 5+ completed ideas
-- - active_voter: 50+ votes given
-- - reward_earner: 1000+ credits earned from rewards
--
-- Example Scenario 1: First major milestone
-- Before: user-123 has created 9 ideas
-- Action: user-123 creates 10th idea, triggers credit transaction
-- After: Achievement notification: "🏆 Achievement Unlocked: Idea Creator (10 ideas)!"
--
-- Example Scenario 2: Multiple achievements
-- Before: user-123 has 24 ideas, 4 completed projects, 45 votes given
-- Action: user-123 creates 25th idea and it gets completed
-- After: Multiple notifications for idea_creator_25 and project_finisher
--
-- Business Logic: Gamifies the platform by recognizing user achievements and milestones.
-- Encourages continued engagement through progressive rewards and recognition.
CREATE OR REPLACE FUNCTION auto_milestone_achievements() RETURNS TRIGGER AS $$
DECLARE
  current_stats RECORD;
  new_achievements TEXT[] := ARRAY[]::TEXT[];
  achievement TEXT;
BEGIN
  -- Get current user statistics
  SELECT
    COUNT(DISTINCT i.id) as total_ideas,
    COUNT(DISTINCT CASE WHEN i.overall_status = 'completed' THEN i.id END) as completed_ideas,
    COUNT(DISTINCT v.id) as total_votes_given,
    COUNT(DISTINCT vr.id) as total_rewards_earned,
    COALESCE(SUM(vr.reward_amount), 0) as total_rewards_amount
  INTO current_stats
  FROM profiles p
  LEFT JOIN ideas i ON p.user_id = NEW.user_id
  LEFT JOIN votes v ON p.user_id = NEW.user_id
  LEFT JOIN voting_rewards vr ON p.user_id = NEW.user_id
  WHERE p.user_id = NEW.user_id;

  -- Check for new achievements
  CASE
    WHEN current_stats.total_ideas >= 10 AND current_stats.total_ideas < 25 THEN
      new_achievements := array_append(new_achievements, 'idea_creator_10');
    WHEN current_stats.total_ideas >= 25 THEN
      new_achievements := array_append(new_achievements, 'idea_creator_25');
    WHEN current_stats.completed_ideas >= 5 THEN
      new_achievements := array_append(new_achievements, 'project_finisher');
    WHEN current_stats.total_votes_given >= 50 THEN
      new_achievements := array_append(new_achievements, 'active_voter');
    WHEN current_stats.total_rewards_amount >= 1000 THEN
      new_achievements := array_append(new_achievements, 'reward_earner');
  END CASE;

  -- Create achievement notifications for new milestones
  FOREACH achievement IN ARRAY new_achievements LOOP
    CASE achievement
      WHEN 'idea_creator_10' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Idea Creator (10 ideas)!');
      WHEN 'idea_creator_25' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Pro Creator (25 ideas)!');
      WHEN 'project_finisher' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Project Finisher (5 completed)!');
      WHEN 'active_voter' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Active Voter (50 votes given)!');
      WHEN 'reward_earner' THEN
        PERFORM create_user_notification(NEW.user_id, 'achievement', '🏆 Achievement Unlocked: Reward Earner (1000 credits earned)!');
    END CASE;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_milestone_achievements
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  WHEN (NEW.transaction_type IN ('vote_received', 'daily_first_vote'))
  EXECUTE FUNCTION auto_milestone_achievements();