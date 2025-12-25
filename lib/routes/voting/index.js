import express from "express";
import { createClient } from "@supabase/supabase-js";
import config from "../../config.js";
import logger from "../../utils/logger.js";
import { requireAuth } from "../../session.js";

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.key);

// POST /api/votes - Cast a vote on a public idea
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { idea_id, rating = 5 } = req.body;

    if (!idea_id) {
      return res.status(400).json({ error: "Idea ID is required" });
    }

    // Validate rating (1-5 stars)
    const numericRating = parseInt(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if idea exists and is public
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("id, title, privacy, validation_threshold_met, user_id")
      .eq("id", idea_id)
      .single();

    if (ideaError || !idea) {
      return res.status(404).json({ error: "Idea not found" });
    }

    if (idea.privacy !== "public") {
      return res.status(403).json({ error: "Cannot vote on private ideas" });
    }

    // Users cannot vote on their own ideas
    if (idea.user_id === userId) {
      return res.status(403).json({ error: "Cannot vote on your own ideas" });
    }

    // Check if user already voted on this idea
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("idea_id", idea_id)
      .eq("user_id", userId)
      .single();

    if (existingVote) {
      return res
        .status(400)
        .json({ error: "You have already voted on this idea" });
    }

    // Insert vote
    const { error: voteError } = await supabase.from("votes").insert({
      idea_id,
      user_id: userId,
      rating: numericRating,
    });

    if (voteError) {
      logger.error("Vote insert error:", voteError);
      return res.status(500).json({ error: "Failed to cast vote" });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "vote_cast",
      entity_type: "idea",
      entity_id: idea_id,
      details: { rating: numericRating },
    });

    // Check for voting milestones and send notifications
    await checkVotingMilestones(idea_id, idea.title, idea.user_id);

    // Check if idea reached validation threshold and trigger rewards
    await checkValidationThreshold(idea_id, idea.title);

    // Get updated vote statistics
    const { data: allVotes } = await supabase
      .from("votes")
      .select("rating")
      .eq("idea_id", idea_id);

    const averageRating =
      allVotes && allVotes.length > 0
        ? allVotes.reduce((sum, vote) => sum + vote.rating, 0) / allVotes.length
        : 0;

    res.json({
      success: true,
      message: "Vote cast successfully",
      vote: {
        idea_id,
        rating: numericRating,
      },
      statistics: {
        total_votes: allVotes?.length || 0,
        average_rating: averageRating,
      },
    });
  } catch (error) {
    logger.error("Vote API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/votes/:ideaId - Get voting statistics for an idea
router.get("/:ideaId", async (req, res) => {
  try {
    const { ideaId } = req.params;

    // Check if idea exists and is public
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("id, title, privacy")
      .eq("id", ideaId)
      .single();

    if (ideaError || !idea) {
      return res.status(404).json({ error: "Idea not found" });
    }

    if (idea.privacy !== "public") {
      return res
        .status(403)
        .json({ error: "Cannot access votes for private ideas" });
    }

    // Get vote statistics
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("rating, created_at")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false });

    if (votesError) {
      logger.error("Votes fetch error:", votesError);
      return res.status(500).json({ error: "Failed to fetch votes" });
    }

    // Calculate statistics
    const totalVotes = votes?.length || 0;
    const averageRating =
      totalVotes > 0
        ? votes.reduce((sum, vote) => sum + vote.rating, 0) / totalVotes
        : 0;

    // Rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    votes?.forEach((vote) => {
      distribution[vote.rating] = (distribution[vote.rating] || 0) + 1;
    });

    res.json({
      success: true,
      idea_id: ideaId,
      statistics: {
        total_votes: totalVotes,
        average_rating: averageRating,
        distribution,
      },
      votes: votes || [],
    });
  } catch (error) {
    logger.error("Get votes error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/votes/user/stats - Get user's voting statistics
router.get("/user/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's votes
    const { data: userVotes, error: votesError } = await supabase
      .from("votes")
      .select(
        `
        id,
        rating,
        created_at,
        ideas:id (
          title,
          category
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (votesError) {
      logger.error("User votes fetch error:", votesError);
      return res
        .status(500)
        .json({ error: "Failed to fetch voting statistics" });
    }

    // Get rewards earned
    const { data: rewards, error: rewardsError } = await supabase
      .from("voting_rewards")
      .select(
        `
        reward_amount,
        created_at,
        ideas:id (
          title
        )
      `,
      )
      .eq("voter_id", userId)
      .order("created_at", { ascending: false });

    if (rewardsError) {
      logger.error("Rewards fetch error:", rewardsError);
    }

    // Calculate statistics
    const totalVotes = userVotes?.length || 0;
    const totalRewards =
      rewards?.reduce((sum, reward) => sum + reward.reward_amount, 0) || 0;
    const averageRating =
      totalVotes > 0
        ? userVotes.reduce((sum, vote) => sum + vote.rating, 0) / totalVotes
        : 0;

    res.json({
      success: true,
      statistics: {
        total_votes: totalVotes,
        average_rating: averageRating,
        total_rewards_earned: totalRewards,
        rewards_count: rewards?.length || 0,
      },
      recent_votes: userVotes?.slice(0, 10) || [],
      recent_rewards: rewards?.slice(0, 10) || [],
    });
  } catch (error) {
    logger.error("Get user voting stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Helper function to check voting milestones and send notifications
async function checkVotingMilestones(ideaId) {
  try {
    // Get vote count
    const { data: votes } = await supabase
      .from("votes")
      .select("id")
      .eq("idea_id", ideaId);

    const voteCount = votes?.length || 0;
    const milestones = [10, 25, 50, 100];

    for (const milestone of milestones) {
      if (voteCount === milestone) {
        break; // Only send for the current milestone
      }
    }
  } catch (error) {
    logger.error("Error in checkVotingMilestones:", error);
  }
}

// Helper function to check validation threshold and distribute rewards
async function checkValidationThreshold(ideaId, ideaTitle) {
  try {
    // Get all votes for the idea
    const { data: ideaVotes } = await supabase
      .from("votes")
      .select("user_id, rating")
      .eq("idea_id", ideaId);

    if (!ideaVotes || ideaVotes.length < 3) {
      return; // Not enough votes for validation
    }

    const averageRating =
      ideaVotes.reduce((sum, vote) => sum + vote.rating, 0) / ideaVotes.length;

    if (averageRating >= 3) {
      // Mark idea as validated
      await supabase
        .from("ideas")
        .update({ validation_threshold_met: true })
        .eq("id", ideaId);

      // Check if rewards already distributed
      const { data: existingRewards } = await supabase
        .from("voting_rewards")
        .select("id")
        .eq("idea_id", ideaId);

      if (!existingRewards || existingRewards.length === 0) {
        // Distribute rewards to all voters (5 credits total, shared equally)
        const totalReward = 5;
        const rewardPerVoter = Math.max(
          1,
          Math.floor(totalReward / ideaVotes.length),
        );

        for (const vote of ideaVotes) {
          // Record reward
          await supabase.from("voting_rewards").insert({
            idea_id: ideaId,
            voter_id: vote.user_id,
            reward_amount: rewardPerVoter,
          });

          // Record general reward
          await supabase.from("rewards").insert({
            user_id: vote.user_id,
            type: "voting",
            amount: rewardPerVoter,
          });

          // Update credit balance
          const { data: voterProfile } = await supabase
            .from("profiles")
            .select("credit_balance, total_earned")
            .eq("user_id", vote.user_id)
            .single();

          if (voterProfile) {
            const newBalance = voterProfile.credit_balance + rewardPerVoter;
            const newTotalEarned = voterProfile.total_earned + rewardPerVoter;

            await supabase
              .from("profiles")
              .update({
                credit_balance: newBalance,
                total_earned: newTotalEarned,
                last_credit_update: new Date().toISOString(),
              })
              .eq("user_id", vote.user_id);
          }

          // Record transaction
          await supabase.from("credit_transactions").insert({
            user_id: vote.user_id,
            transaction_type: "reward_earned",
            amount: rewardPerVoter,
            metadata: {
              idea_id: ideaId,
              idea_title: ideaTitle,
              type: "voting_reward",
            },
          });

          // Create notification
          await supabase.from("notifications").insert({
            user_id: vote.user_id,
            type: "reward_earned",
            message: `🎁 Congratulations! You earned ${rewardPerVoter} credits for voting on the idea "${ideaTitle}" which reached validation threshold.`,
          });

          // Log activity
          await supabase.from("activity_log").insert({
            user_id: vote.user_id,
            action_type: "reward_earned",
            entity_type: "voting_reward",
            entity_id: `${ideaId}_${vote.user_id}`,
            details: { idea_id: ideaId, reward_amount: rewardPerVoter },
          });
        }
      }
    }
  } catch (error) {
    logger.error("Error in checkValidationThreshold:", error);
  }
}

export default router;
