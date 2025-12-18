import express from "express";
import { optionalAuth } from "../session.js";
import auth from "./auth/index.js";
import dashboard from "./dashboard/index.js";
import ideas from "./ideas/index.js";
import models from "./models/index.js";
import reports from "./reports/index.js";
import payment from "./payment/index.js";
import projects from "./projects/index.js";
import settings from "./settings/index.js";
import onboarding from "./onboarding/index.js";
import notifications from "./notifications/index.js";
import portfolios from "./portfolios/index.js";
import api from "./api/index.js";

const router = express.Router();

// Home page
router.get("/", optionalAuth, (req, res) => {
  res.render("dashboard/home", {
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
router.use("/", notifications);
router.use("/portfolios", portfolios);
router.use("/api", api);

export default router;
