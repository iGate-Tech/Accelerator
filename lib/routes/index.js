import express from "express";
import { optionalAuth } from "../session.js";
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
import ai from "./ai/index.js";
import api from "./api/index.js";

const router = express.Router();

// Home page - different for authenticated vs non-authenticated users
router.get("/", optionalAuth, async (req, res) => {
  if (req.user) {
    // Authenticated user - redirect to dashboard home
    return res.redirect("/dashboard/home");
  }

  // Non-authenticated user - show landing page
  res.render("landingpage", {
    title: "Accelerator - Build Your Startup",
    bodyClass: "home-page",
    layout: "landingpage",
    user: req.user,
    flash: res.locals.flash,
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
router.use("/api/ai", ai);
router.use("/api", api);

export default router;
