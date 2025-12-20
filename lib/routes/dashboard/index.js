import express from "express";
import { requireAuth } from "../../session.js";

const router = express.Router();

// Dashboard (protected)
router.get("/dashboard", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  try {
    // Get user profile and stats
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    // Attach profile to user for nav conditional rendering
    req.user.profile = profile;

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
        .eq("user_id", req.user.id);

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
        .eq("portfolio_members.user_id", req.user.id);

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
      .eq("user_id", req.user.id);

    // Calculate stats
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
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get credit transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: creditTransactions } = await supabase
      .from("credit_transactions")
      .select("amount, transaction_type, created_at")
      .eq("user_id", req.user.id)
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
      .eq("user_id", req.user.id);

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
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    res.render("dashboard/dashboard", {
      title: "Dashboard - Accelerator",
      bodyClass: "dashboard-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      stats: {
        profile: profile || {},
        ideas: {
          total: totalIdeas,
          completed: completedIdeas,
          completionRate:
            totalIdeas > 0
              ? Math.round((completedIdeas / totalIdeas) * 100)
              : 0,
          averageRating: averageRating.toFixed(1),
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
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.render("dashboard/dashboard", {
      title: "Dashboard - Accelerator",
      bodyClass: "dashboard-page",
      layout: "main",
      user: req.user,
      flash: res.locals.flash,
      stats: {
        profile: {},
        ideas: { total: 0, completed: 0, completionRate: 0, averageRating: 0 },
        credits: {
          currentBalance: 0,
          earned30d: 0,
          spent30d: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
        activity: [],
        models: {},
        votes: { totalGiven: 0, recent: [] },
        portfolios: {
          total: 0,
          totalIdeas: 0,
          avgCompletion: 0,
          totalTeamMembers: 0,
        },
      },
    });
  }
});

// Portfolios page (Enterprise only)
router.get("/portfolios", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
  );

  console.log("User ID:", req.user.id);

  // Check if user has enterprise package
  const { data: profile } = await supabase
    .from("profiles")
    .select("package_type")
    .eq("user_id", req.user.id)
    .single();

  console.log("Profile:", profile);

  // Attach profile to user for nav conditional rendering
  req.user.profile = profile;

  if (profile?.package_type !== "enterprise") {
    req.session.flash.error.push(
      "Portfolio management is available for Enterprise users only",
    );
    return res.redirect("/dashboard");
  }

  // Get user's portfolios with aggregated data (owned + member portfolios)
  const { data: ownedPortfolios, error: ownedError } = await supabase
    .from("portfolios")
    .select(
      `
       *,
       portfolio_ideas (
         idea_id,
         ideas (
           id,
           title,
           completion_percentage,
           overall_status,
           rating,
           category,
           created_at
         )
       ),
       portfolio_members (
         user_id,
         role
       )
     `,
    )
    .eq("user_id", req.user.id);

  console.log("Owned portfolios:", ownedPortfolios, "Error:", ownedError);

  // Debug: get all portfolios
  const { data: allPortfolios } = await supabase.from("portfolios").select("*");
  console.log("All portfolios:", allPortfolios);

  const { data: memberPortfolios } = await supabase
    .from("portfolios")
    .select(
      `
       *,
       portfolio_ideas (
         idea_id,
         ideas (
           id,
           title,
           completion_percentage,
           overall_status,
           rating,
           category,
           created_at
         )
       ),
       portfolio_members!inner (
         user_id,
         role
       )
     `,
    )
    .eq("portfolio_members.user_id", req.user.id);

  // Combine and deduplicate portfolios
  const portfolioMap = new Map();
  [...(ownedPortfolios || []), ...(memberPortfolios || [])].forEach(
    (portfolio) => {
      if (!portfolioMap.has(portfolio.id)) {
        portfolioMap.set(portfolio.id, {
          ...portfolio,
          isOwner: portfolio.user_id === req.user.id,
          memberRole: portfolio.portfolio_members?.find(
            (m) => m.user_id === req.user.id,
          )?.role,
        });
      }
    },
  );
  const portfolios = Array.from(portfolioMap.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  // Calculate overall portfolio stats
  let portfolioStats = {
    total: 0,
    totalIdeas: 0,
    avgCompletion: 0,
    totalTeamMembers: 0,
  };

  let formattedPortfolios = [];
  if (portfolios) {
    portfolioStats.total = portfolios.length;

    formattedPortfolios = portfolios.map((portfolio) => {
      const ideas =
        portfolio.portfolio_ideas?.map((pi) => pi.ideas).filter(Boolean) || [];
      const members = portfolio.portfolio_members || [];

      const stats = {
        totalIdeas: ideas.length,
        completedIdeas: ideas.filter(
          (idea) => idea.overall_status === "completed",
        ).length,
        averageRating:
          ideas.length > 0
            ? ideas.reduce((sum, idea) => sum + (idea.rating || 0), 0) /
              ideas.length
            : 0,
        averageCompletion:
          ideas.length > 0
            ? ideas.reduce(
                (sum, idea) => sum + (idea.completion_percentage || 0),
                0,
              ) / ideas.length
            : 0,
        totalMembers: members.length,
      };

      // Update global stats
      portfolioStats.totalIdeas += stats.totalIdeas;
      portfolioStats.totalTeamMembers += stats.totalMembers;

      return {
        ...portfolio,
        ideaCount: stats.totalIdeas,
        completionRate: Math.round(stats.averageCompletion),
        teamMembers: members.map((member) => ({
          name: member.profiles?.name || "Unknown",
          avatar: member.profiles?.avatar_url,
          role: member.role,
        })),
        ideas,
        members,
      };
    });

    // Calculate average completion across all portfolios
    portfolioStats.avgCompletion =
      portfolioStats.totalIdeas > 0
        ? Math.round(
            formattedPortfolios.reduce(
              (sum, p) => sum + (p.completionRate || 0),
              0,
            ) / formattedPortfolios.length,
          )
        : 0;
  }

  res.render("dashboard/portfolios", {
    title: "Portfolios - Accelerator",
    bodyClass: "portfolios-page",
    layout: "main",
    user: req.user,
    flash: res.locals.flash,
    portfolios: formattedPortfolios,
    stats: { portfolios: portfolioStats },
  });
});

export default router;
