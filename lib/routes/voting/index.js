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

    // Use DB function for voting
    const { data, error } = await supabase.rpc("validate_and_cast_vote", {
      p_idea_id: idea_id,
      p_user_id: userId,
      p_rating: numericRating,
    });

    if (error || !data.success) {
      logger.error("Vote error:", error || data.error);
      return res
        .status(400)
        .json({ error: data?.error || "Failed to cast vote" });
    }

    res.json({
      success: true,
      message: "Vote cast successfully",
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

export default router;
