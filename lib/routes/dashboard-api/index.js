import express from "express";
import { requireAuth } from "../../session.js";

const router = express.Router();

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get portfolio data for enterprise users
    let portfolioStats = null;
    if (profile?.package_type === "enterprise") {
      // Get portfolios owned by user OR where user is a member
      const { data: ownedPortfolios } = await supabase
        .from("portfolios")
        .select(
          `
          *,
          portfolio_ideas (
            idea_id,
            ideas (
              id,
              completion_percentage,
              overall_status,
              rating
            )
          ),
          portfolio_members (
            user_id
          )
        `,
        )
        .eq("user_id", userId);

      const { data: memberPortfolios } = await supabase
        .from("portfolios")
        .select(
          `
          *,
          portfolio_ideas (
            idea_id,
            ideas (
              id,
              completion_percentage,
              overall_status,
              rating
            )
          ),
          portfolio_members!inner (
            user_id,
            role
          )
        `,
        )
        .eq("portfolio_members.user_id", userId);

      // Combine and deduplicate portfolios
      const portfolioMap = new Map();
      [...(ownedPortfolios || []), ...(memberPortfolios || [])].forEach(
        (portfolio) => {
          if (!portfolioMap.has(portfolio.id)) {
            portfolioMap.set(portfolio.id, portfolio);
          }
        },
      );
      const portfolios = Array.from(portfolioMap.values());

      if (portfolios) {
        const totalPortfolios = portfolios.length;
        const totalIdeas = portfolios.reduce(
          (sum, p) => sum + (p.portfolio_ideas?.length || 0),
          0,
        );
        const completedIdeas = portfolios.reduce(
          (sum, p) =>
            sum +
            (p.portfolio_ideas?.filter(
              (pi) => pi.ideas?.overall_status === "completed",
            ).length || 0),
          0,
        );
        const avgCompletion =
          totalIdeas > 0
            ? portfolios.reduce(
                (sum, p) =>
                  sum +
                  (p.portfolio_ideas?.reduce(
                    (s, pi) => s + (pi.ideas?.completion_percentage || 0),
                    0,
                  ) || 0),
                0,
              ) / totalIdeas
            : 0;
        const totalTeamMembers = portfolios.reduce(
          (sum, p) => sum + (p.portfolio_members?.length || 0),
          0,
        );

        portfolioStats = {
          total: totalPortfolios,
          totalIdeas,
          completedIdeas,
          avgCompletion: Math.round(avgCompletion),
          totalTeamMembers,
        };
      }
    }

    // Get user's ideas stats
    const { data: ideas } = await supabase
      .from("ideas")
      .select("id, completion_percentage, overall_status, rating, created_at")
      .eq("user_id", userId);

    // Calculate ideas stats
    const totalIdeas = ideas?.length || 0;
    const completedIdeas =
      ideas?.filter((idea) => idea.overall_status === "completed").length || 0;
    const averageRating =
      ideas?.length > 0
        ? ideas.reduce((sum, idea) => sum + (idea.rating || 0), 0) /
          ideas.length
        : 0;

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from("activity_log")
      .select(
        `
        id,
        action_type,
        entity_type,
        created_at,
        details
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get credit transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: creditTransactions } = await supabase
      .from("credit_transactions")
      .select("amount, transaction_type, created_at")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    // Calculate credit stats
    const creditsEarned30d =
      creditTransactions
        ?.filter((t) => t.transaction_type === "reward_earned")
        .reduce((sum, t) => sum + t.amount, 0) || 0;
    const creditsSpent30d =
      creditTransactions
        ?.filter((t) =>
          ["ai_generation", "report_generation"].includes(t.transaction_type),
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    // Get model completion stats
    const { data: modelInstances } = await supabase
      .from("model_instances")
      .select("model_type, status")
      .eq("user_id", userId);

    const modelsByType = {};
    modelInstances?.forEach((model) => {
      if (!modelsByType[model.model_type]) {
        modelsByType[model.model_type] = { total: 0, completed: 0 };
      }
      modelsByType[model.model_type].total++;
      if (model.status === "completed") {
        modelsByType[model.model_type].completed++;
      }
    });

    // Get voting activity
    const { data: votesGiven } = await supabase
      .from("votes")
      .select("id, rating, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const dashboardStats = {
      profile: profile || {},
      ideas: {
        total: totalIdeas,
        completed: completedIdeas,
        completionRate:
          totalIdeas > 0 ? Math.round((completedIdeas / totalIdeas) * 100) : 0,
        averageRating: parseFloat(averageRating.toFixed(1)),
      },
      credits: {
        currentBalance: profile?.credit_balance || 0,
        earned30d: creditsEarned30d,
        spent30d: creditsSpent30d,
        totalEarned: profile?.total_earned || 0,
        totalSpent: profile?.total_spent || 0,
      },
      activity: recentActivity || [],
      models: modelsByType,
      votes: {
        totalGiven: votesGiven?.length || 0,
        recent: votesGiven?.slice(0, 5) || [],
      },
      portfolios: portfolioStats || {
        total: 0,
        totalIdeas: 0,
        avgCompletion: 0,
        totalTeamMembers: 0,
      },
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      stats: dashboardStats,
    });
  } catch (error) {
    console.error("Dashboard stats API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics",
    });
  }
});

// GET /api/dashboard/activity - Get recent activity with pagination
router.get("/activity", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, type, entity_type } = req.query;
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    let query = supabase
      .from("activity_log")
      .select(
        `
        id,
        action_type,
        entity_type,
        entity_id,
        created_at,
        details
      `,
      )
      .eq("user_id", userId);

    // Apply filters
    if (type) {
      query = query.eq("action_type", type);
    }
    if (entity_type) {
      query = query.eq("entity_type", entity_type);
    }

    // Get total count
    const { count } = await query;

    // Apply pagination and ordering
    query = query
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: activities, error } = await query;

    if (error) {
      console.error("Error fetching activity:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch activity data",
      });
    }

    res.json({
      success: true,
      activities: activities || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: activities && activities.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Dashboard activity API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/dashboard/real-time - Get real-time updates for dashboard metrics
router.get("/real-time", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Get latest metrics that might change frequently
    const [profileResult, recentActivityResult, creditBalanceResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("credit_balance, total_earned, total_spent")
          .eq("user_id", userId)
          .single(),

        supabase
          .from("activity_log")
          .select("id, action_type, entity_type, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),

        supabase
          .from("credit_transactions")
          .select("amount")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    const { data: profile } = profileResult;
    const { data: recentActivity } = recentActivityResult;
    const { data: recentCredits } = creditBalanceResult;

    // Calculate recent credit changes
    const recentCreditsEarned =
      recentCredits
        ?.filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0) || 0;
    const recentCreditsSpent =
      recentCredits
        ?.filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    res.json({
      success: true,
      realTimeData: {
        credit_balance: profile?.credit_balance || 0,
        recent_activity_count: recentActivity?.length || 0,
        recent_credits_earned: recentCreditsEarned,
        recent_credits_spent: recentCreditsSpent,
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Dashboard real-time API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch real-time data",
    });
  }
});

export default router;
