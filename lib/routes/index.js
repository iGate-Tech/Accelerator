import express from "express";
import { optionalAuth, requireAuth } from "../session.js";
import config from "../config.js";
import logger from "../utils/logger.js";
import auth from "./auth/index.js";
import dashboard from "./dashboard/index.js";
import dashboardApi from "./dashboard-api/index.js";
import ideas from "./ideas/index.js";
import models from "./models/index.js";
import reports from "./reports/index.js";
import payment from "./payment/index.js";
import projects from "./projects/index.js";
import settings from "./settings/index.js";
import onboarding from "./onboarding/index.js";
import notifications from "./notifications/index.js";
import portfolios from "./portfolios/index.js";
import users from "./users/index.js";
import packages from "./packages/index.js";
import voting from "./voting/index.js";
import credits from "./credits/index.js";
import activity from "./activity/index.js";
import profile from "./profile/index.js";
import ai from "./ai/index.js";
import api from "./api/index.js";

const router = express.Router();

// Language prefix middleware
router.use("/:lang(en|ar)?", (req, res, next) => {
  if (req.params.lang) {
    req.language = req.params.lang;
    // Ensure i18n switches language for prefixed routes
    req.i18n.changeLanguage(req.params.lang);
  }
  next();
});

// Home page - always show landing page
router.get("/", optionalAuth, (req, res) => {
  res.render("auth/landingpage", {
    title: "Accelerator - Build Your Startup",
    bodyClass: "home-page",
    layout: "auth",
    user: req.user,
    flash: res.locals.flash,
    lng: req.language || "en",
    showThemeLang: false,
  });
});

// Terms and Conditions page
router.get("/terms", optionalAuth, (req, res) => {
  res.render("auth/terms", {
    title: "Terms and Conditions - Accelerator",
    bodyClass: "terms-page",
    layout: "auth",
    user: req.user,
    flash: res.locals.flash,
    lng: req.language || "en",
  });
});

// Privacy Policy page
router.get("/privacy", optionalAuth, (req, res) => {
  res.render("auth/privacy", {
    title: "Privacy Policy - Accelerator",
    bodyClass: "privacy-page",
    layout: "auth",
    user: req.user,
    flash: res.locals.flash,
    lng: req.language || "en",
  });
});

// Use sub-routers
router.use("/", auth);
router.use("/", dashboard);
router.use("/", ideas);
router.use("/", models);
router.use("/", reports);
router.use("/", payment);
router.use("/projects", projects);
router.use("/", settings);
router.use("/", onboarding);
router.use("/api/notifications", notifications);
router.use("/portfolios", portfolios);
router.use("/api/users", users);
router.use("/api/packages", packages);
router.use("/api/votes", voting);
router.use("/api/credits", credits);
router.use("/api/dashboard", dashboardApi);
router.use("/api/activity", activity);
router.use("/profile", profile);
router.use("/api/ai", ai);
router.use("/api", api);

// Voting & Rewards Dashboard page route
router.get("/voting-reward", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
    );

    const userId = req.user.id;

    // Get user's profile data including credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      logger.error("Profile fetch error:", profileError);
      return res.status(500).render("error", {
        title: "Error",
        message: "Failed to load profile data",
      });
    }

    // Get user's ideas with ratings and completion data
    const { data: userIdeas, error: ideasError } = await supabase
      .from("ideas")
      .select(
        `
        *,
        votes (
          rating,
          created_at
        ),
        model_instances (
          model_type,
          status,
          model_sections (
            is_completed
          )
        )
      `,
      )
      .eq("user_id", userId);

    if (ideasError) {
      logger.error("Ideas fetch error:", ideasError);
    }

    // Calculate completion percentages and overall status for each idea
    const processedIdeas = (userIdeas || []).map((idea) => {
      const completedSections =
        idea.model_instances?.flatMap(
          (mi) => mi.model_sections?.filter((ms) => ms.is_completed) || [],
        ).length || 0;
      const totalSections =
        idea.model_instances?.flatMap((mi) => mi.model_sections || []).length ||
        0;
      const completionPercentage =
        totalSections > 0
          ? Math.round((completedSections / totalSections) * 100)
          : 0;

      let overallStatus = "draft";
      if (completionPercentage > 0 && completionPercentage < 100) {
        overallStatus = "in_progress";
      } else if (completionPercentage === 100) {
        overallStatus = "completed";
      }

      // Calculate average rating
      const ratings = idea.votes?.map((v) => v.rating) || [];
      const averageRating =
        ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : 0;

      return {
        ...idea,
        completion_percentage: completionPercentage,
        overall_status: overallStatus,
        rating: averageRating,
        votes_count: ratings.length,
      };
    });

    // Get recent voting activity (where user voted on others' ideas)
    const { data: userVotes } = await supabase
      .from("votes")
      .select(
        `
        *,
        ideas (
          title,
          user_id
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get rewards earned by this user
    const { data: rewardsEarned } = await supabase
      .from("voting_rewards")
      .select(
        `
        *,
        ideas (
          title
        )
      `,
      )
      .eq("voter_id", userId)
      .order("distributed_at", { ascending: false })
      .limit(10);

    // Get rewards distributed for user's ideas
    const { data: rewardsDistributed } = await supabase
      .from("voting_rewards")
      .select(
        `
        *,
        ideas (
          title
        ),
        profiles:voter_id (
          name
        )
      `,
      )
      .eq("ideas.user_id", userId)
      .order("distributed_at", { ascending: false })
      .limit(10);

    // Get top ideas leaderboard (public ideas with high ratings and their rewards)
    const { data: topIdeasRaw } = await supabase
      .from("ideas")
      .select(
        `
        *,
        profiles:user_id (
          name,
          avatar_url
        ),
        votes (
          rating
        ),
        voting_rewards (
          reward_amount
        )
      `,
      )
      .eq("privacy", "public")
      .order("rating", { ascending: false })
      .limit(5);

    // Process top ideas with rewards
    const topIdeas = (topIdeasRaw || [])
      .map((idea) => {
        const ratings = idea.votes?.map((v) => v.rating) || [];
        const averageRating =
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : 0;
        const totalRewards =
          idea.voting_rewards?.reduce((sum, r) => sum + r.reward_amount, 0) ||
          0;
        return {
          ...idea,
          rating: averageRating,
          votes_count: ratings.length,
          reward_amount: totalRewards,
        };
      })
      .sort((a, b) => b.reward_amount - a.reward_amount);

    // Process top ideas with average ratings
    const processedTopIdeas = (topIdeas || []).map((idea) => {
      const ratings = idea.votes?.map((v) => v.rating) || [];
      const averageRating =
        ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : 0;
      return {
        ...idea,
        rating: averageRating,
        votes_count: ratings.length,
      };
    });

    // Get credit transaction history for rewards
    const { data: creditTransactions } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .in("transaction_type", ["reward_earned", "reward_given"])
      .order("created_at", { ascending: false })
      .limit(20);

    // Get recent notifications
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get reward notifications
    const { data: rewardNotifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "reward_earned")
      .order("created_at", { ascending: false })
      .limit(5);

    // Get votable ideas
    const { data: votableIdeas } = await supabase
      .from("ideas")
      .select(
        `
        *,
        profiles:user_id (
          name
        ),
        votes (
          rating
        )
      `,
      )
      .neq("user_id", userId)
      .eq("privacy", "public")
      .order("created_at", { ascending: false })
      .limit(5);

    const processedVotableIdeas = (votableIdeas || []).map((idea) => {
      const ratings = idea.votes?.map((v) => v.rating) || [];
      const averageRating =
        ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : 0;

      return {
        ...idea,
        average_rating: averageRating,
        votes_count: ratings.length,
      };
    });

    // Get voting activity
    const { data: votingActivity } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", userId)
      .in("action_type", ["vote_cast", "reward_earned", "shared_idea_voted"])
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch idea titles for activity
    if (votingActivity && votingActivity.length > 0) {
      for (const item of votingActivity) {
        if (item.details?.idea_id) {
          const { data: idea } = await supabase
            .from("ideas")
            .select("title")
            .eq("id", item.details.idea_id)
            .single();
          item.ideas = idea
            ? { title: idea.title }
            : { title: "Idea no longer available" };
        }
      }
    }

    // Calculate success rate
    const successfulIdeas =
      userIdeas?.filter((idea) => idea.validation_threshold_met).length || 0;
    const successRate =
      processedIdeas.length > 0
        ? Math.round((successfulIdeas / processedIdeas.length) * 100)
        : 0;

    // Get rewarding votes count
    const { count: rewardingVotes } = await supabase
      .from("voting_rewards")
      .select("*", { count: "exact", head: true })
      .eq("voter_id", userId);

    // Calculate stats for dashboard cards
    const totalRewardsEarned = (rewardsEarned || []).reduce(
      (sum, r) => sum + r.reward_amount,
      0,
    );
    const totalRewardsDistributed = (rewardsDistributed || []).reduce(
      (sum, r) => sum + r.reward_amount,
      0,
    );
    const averageRating =
      processedIdeas.length > 0
        ? (
            processedIdeas.reduce(
              (sum, idea) => sum + parseFloat(idea.rating),
              0,
            ) / processedIdeas.length
          ).toFixed(1)
        : 0;

    // Get current credit balance
    const currentCredits = profile?.credit_balance || 0;

    // Mock some additional stats for the template
    const monthlyVotingGoal = 50;
    const currentMonthVotes = (userVotes || []).filter((vote) => {
      const voteDate = new Date(vote.created_at);
      const now = new Date();
      return (
        voteDate.getMonth() === now.getMonth() &&
        voteDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const monthlyCreditGoal = 100;
    const currentMonthCredits = (creditTransactions || [])
      .filter((tx) => {
        const txDate = new Date(tx.created_at);
        const now = new Date();
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear() &&
          tx.transaction_type === "reward_earned"
        );
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    res.render("notifications/voting-reward", {
      title: "Voting & Rewards Dashboard - Accelerator",
      bodyClass: "voting-reward-page",
      lng: req.lng,
      user: req.user,
      profile,
      ideas: processedIdeas,
      recentVotes: userVotes || [],
      rewardsEarned: rewardsEarned || [],
      rewardsDistributed: rewardsDistributed || [],
      topIdeas: processedTopIdeas,
      creditTransactions: creditTransactions || [],
      notifications: notifications || [],
      rewardNotifications: rewardNotifications || [],
      votableIdeas: processedVotableIdeas,
      votingActivity: votingActivity || [],
      stats: {
        rewardsEarned: totalRewardsEarned,
        currentCredits,
        overallRating: averageRating,
        rewardsReceived: totalRewardsEarned, // Same as earned for display
        rewardsDistributed: totalRewardsDistributed,
        monthlyVotingGoal,
        currentMonthVotes,
        monthlyCreditGoal,
        currentMonthCredits,
        ideasCount: processedIdeas.length,
        successRate,
        votesGiven: userVotes?.length || 0,
        rewardingVotes: rewardingVotes || 0,
        earned30d: currentMonthCredits,
      },
      flash: res.locals.flash,
      activeNav: "voting",
      unreadCount: notifications
        ? notifications.filter((n) => !n.is_read).length
        : 0,
    });
  } catch (error) {
    logger.error("Voting reward page error:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load voting rewards dashboard",
    });
  }
});

export default router;
