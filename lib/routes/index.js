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

    // Get simplified voting dashboard data
    const { data: votingData, error } = await supabase.rpc(
      "get_voting_dashboard_data",
      { p_user_id: userId },
    );

    if (error) {
      logger.error("Voting dashboard data fetch error:", error);
      return res.status(500).render("error", {
        title: "Error",
        message: "Failed to load voting dashboard data",
      });
    }

    // Get leaderboard from view
    const { data: topIdeasRaw } = await supabase
      .from("leaderboard")
      .select("*")
      .limit(10);

    // Get recent notifications
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    res.render("notifications/voting-reward", {
      title: "Voting & Rewards Dashboard - Accelerator",
      bodyClass: "voting-reward-page",
      lng: req.lng,
      user: req.user,
      profile: { ...req.user.profile, ...votingData.stats },
      ideas: votingData.ideas || [],
      recentVotes: votingData.stats?.user_votes || [],
      rewardsEarned: votingData.stats?.rewards_earned || [],
      rewardsDistributed: [],
      topIdeas: topIdeasRaw || [],
      creditTransactions: [],
      notifications: notifications || [],
      rewardNotifications: [],
      votableIdeas: votingData.votable_ideas || [],
      votingActivity: [],
      stats: votingData.stats || {},
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
