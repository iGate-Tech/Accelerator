// ULTRA-MINIMAL ROUTES - Maximum Automation Achieved
// Everything is now handled by database functions and triggers
// Server-side code is reduced to HTTP routing and external API calls

import express from "express";
import { optionalAuth, requireAuth } from "./session.js";
import { createClient } from "@supabase/supabase-js";
import pkg from "pg";
const { Pool } = pkg;
import config from "./config.js";

// Import services for AI routes
import { callOpenRouter } from "./utils.js";

const pool = new Pool({
  connectionString: config.supabase.dbUrl,
});

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Language prefix middleware (simplified)
router.use("/:lang(en|ar)?", (req, res, next) => {
  if (req.params.lang) {
    req.language = req.params.lang;
  }
  next();
});

// HOME PAGE - Landing page (always public)
router.get("/", optionalAuth, (req, res) => {
  res.render("auth/landingpage", {
    title: "Accelerator - Build Your Startup",
    bodyClass: "home-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
    showThemeLang: false,
  });
});

// AUTH PAGES - Public access
router.get("/auth/login", optionalAuth, (req, res) => {
  res.render("auth/login", {
    title: "Login - Accelerator",
    bodyClass: "login-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
    showThemeLang: true,
  });
});

router.get("/auth/signup", optionalAuth, (req, res) => {
  res.render("auth/signup", {
    title: "Sign Up - Accelerator",
    bodyClass: "signup-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
    showThemeLang: true,
  });
});

router.get("/auth/profile", optionalAuth, (req, res) => {
  res.render("auth/profile", {
    title: "Complete Your Profile - Accelerator",
    bodyClass: "profile-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
    showThemeLang: true,
  });
});

router.get("/auth/plan", optionalAuth, async (req, res) => {
  const { data: packages } = await supabase.rpc("fetch_packages");

  res.render("auth/plan", {
    title: "Choose Your Plan - Accelerator",
    bodyClass: "plan-page",
    layout: "auth",
    user: req.user,
    packages: packages || [],
    lng: req.language || "en",
    showThemeLang: true,
  });
});

router.get("/auth/package", optionalAuth, (req, res) => {
  res.render("auth/package", {
    title: "Package Details - Accelerator",
    bodyClass: "package-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
    showThemeLang: true,
  });
});

router.get("/auth/payment", optionalAuth, (req, res) => {
  res.render("auth/payment", {
    title: "Payment - Accelerator",
    bodyClass: "payment-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
    showThemeLang: true,
  });
});

// POST routes for auth
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send(`
      <div class="alert alert-error alert-auto-hide">
        Email and password are required.
      </div>
    `);
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return res.status(401).send(`
        <div class="alert alert-error alert-auto-hide">
          ${error.message}
        </div>
      `);
    }

    // Set session
    req.session.userId = data.user.id;
    req.session.supabaseAccessToken = data.session.access_token;
    req.session.supabaseRefreshToken = data.session.refresh_token;

    // For HTMX, return a redirect script or meta refresh
    res.send(`
      <script>
        window.location.href = '/dashboard';
      </script>
    `);
  } catch (error) {
    console.error("Login exception:", error);
    res.status(500).send(`
      <div class="alert alert-error alert-auto-hide">
        An error occurred during login.
      </div>
    `);
  }
});

router.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send(`
      <div class="alert alert-error alert-auto-hide">
        Email and password are required.
      </div>
    `);
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Signup error:", error);
      return res.status(400).send(`
        <div class="alert alert-error alert-auto-hide">
          ${error.message}
        </div>
      `);
    }

    // If signup requires email confirmation, handle differently
    if (data.user && !data.session) {
      return res.send(`
        <div class="alert alert-success alert-auto-hide">
          Signup successful! Please check your email to confirm your account.
        </div>
      `);
    }

    // Set session if session is created
    if (data.session) {
      req.session.userId = data.user.id;
      req.session.supabaseAccessToken = data.session.access_token;
      req.session.supabaseRefreshToken = data.session.refresh_token;

      // Create profile if not exists
      try {
        await pool.query(
          `INSERT INTO profiles (user_id, name, credit_balance)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO NOTHING`,
          [data.user.id, data.user.email.split("@")[0], 1000],
        );
      } catch (err) {
        console.error("Profile creation error:", err);
      }
    }

    res.send(`
      <script>
        window.location.href = '/auth/plan';
      </script>
    `);
  } catch (error) {
    console.error("Signup exception:", error);
    res.status(500).send(`
      <div class="alert alert-error alert-auto-hide">
        An error occurred during signup.
      </div>
    `);
  }
});

// STATIC PAGES - Terms & Privacy (public access)
router.get("/terms", optionalAuth, (req, res) => {
  res.render("auth/terms", {
    title: "Terms and Conditions - Accelerator",
    bodyClass: "terms-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
  });
});

router.get("/privacy", optionalAuth, (req, res) => {
  res.render("auth/privacy", {
    title: "Privacy Policy - Accelerator",
    bodyClass: "privacy-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
  });
});

// AUTHENTICATED PAGES - Use automated views and functions

// Dashboard - Uses get_enhanced_dashboard_data
router.get("/dashboard", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_enhanced_dashboard_data", {
    p_user_id: req.user.id,
  });

  res.render("dashboard/index", {
    title: "Dashboard - Accelerator",
    user: req.user,
    dashboardData: data,
    lng: req.language || "en",
  });
});

// Ideas - Uses comprehensive_idea_operations
router.get("/ideas", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("comprehensive_idea_operations", {
    p_user_id: req.user.id,
    p_action: "get_list",
    p_data: req.query,
  });

  res.render("ideas/explore-idea", {
    title: "Ideas - Accelerator",
    user: req.user,
    ideas: data?.ideas || [],
    ideasJson: JSON.stringify(data?.ideas || []),
    lng: req.language || "en",
  });
});

// Favorites - Uses comprehensive_idea_operations with favorites filter
router.get("/favorites", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("comprehensive_idea_operations", {
    p_user_id: req.user.id,
    p_action: "get_list",
    p_data: { ...req.query, favorites: true },
  });

  res.render("ideas/favorites", {
    title: "Favorites - Accelerator",
    user: req.user,
    ideas: data?.ideas || [],
    ideasJson: JSON.stringify(data?.ideas || []),
    lng: req.language || "en",
  });
});

// Settings - Uses manage_user_settings
router.get("/settings", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("manage_user_settings", {
    p_user_id: req.user.id,
    p_action: "get",
  });

  res.render("dashboard/settings", {
    title: "Settings - Accelerator",
    user: req.user,
    settings: data,
    lng: req.language || "en",
  });
});

// Notifications
router.get("/notifications", requireAuth, async (req, res) => {
  // Get notifications from database
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  res.render("notifications/notification", {
    title: "Notifications - Accelerator",
    user: req.user,
    notifications: notifications || [],
    lng: req.language || "en",
  });
});

// Payments
router.get("/payments", requireAuth, async (req, res) => {
  res.render("payments/index", {
    title: "Payments - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Models
router.get("/models", requireAuth, async (req, res) => {
  res.render("models/index", {
    title: "Models - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Reports
router.get("/reports", requireAuth, async (req, res) => {
  res.render("reports/index", {
    title: "Reports - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Portfolios
router.get("/portfolios", requireAuth, async (req, res) => {
  res.render("portfolios/index", {
    title: "Portfolios - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Services
router.get("/services", requireAuth, (req, res) => {
  res.render("services/index", {
    title: "Services - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Models - Business
router.get("/models/business", requireAuth, (req, res) => {
  res.render("models/business", {
    title: "Business Models - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Upgrade Package
router.get("/upgrade-package", requireAuth, (req, res) => {
  res.render("upgrade/package", {
    title: "Upgrade Package - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Buy Credits
router.get("/buy-credits", requireAuth, (req, res) => {
  res.render("payments/buy-credits", {
    title: "Buy Credits - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Rewards
router.get("/rewards", requireAuth, (req, res) => {
  res.render("rewards/index", {
    title: "Rewards - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Billing
router.get("/billing", requireAuth, (req, res) => {
  res.render("billing/history", {
    title: "Billing - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Add Payment Method
router.get("/add-payment-method", requireAuth, (req, res) => {
  res.render("payments/add-method", {
    title: "Add Payment Method - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// User Activity
router.get("/user-activity", requireAuth, (req, res) => {
  res.render("dashboard/user-activity", {
    title: "User Activity - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// New Idea
router.get("/new-idea", requireAuth, (req, res) => {
  res.render("ideas/new-idea", {
    title: "New Idea - Accelerator",
    user: req.user,
    lng: req.language || "en",
  });
});

// Onboarding Profile
router.get("/onboarding/profile", requireAuth, (req, res) => {
  res.render("auth/profile", {
    title: "Complete Your Profile - Accelerator",
    bodyClass: "profile-page",
    layout: "auth",
    user: req.user,
    lng: req.language || "en",
    showThemeLang: true,
  });
});

// Onboarding Plan
router.post("/onboarding/plan", requireAuth, async (req, res) => {
  const { package_type } = req.body;

  if (!package_type) {
    return res.status(400).send(`
      <div class="alert alert-error alert-auto-hide">
        Please select a plan.
      </div>
    `);
  }

  // Update user package
  try {
    await pool.query(
      "UPDATE profiles SET package_type = $1 WHERE user_id = $2",
      [package_type, req.user.id],
    );
  } catch (error) {
    console.error("Package update error:", error);
    return res.status(500).send(`
      <div class="alert alert-error alert-auto-hide">
        Failed to update plan.
      </div>
    `);
  }

  // Redirect to payment
  res.send(`
    <script>
      window.location.href = '/auth/payment';
    </script>
  `);
});

// Onboarding Payment
router.post("/onboarding/payment", requireAuth, async (req, res) => {
  // For now, just redirect to profile
  // In real app, process payment here
  res.send(`
    <script>
      window.location.href = '/onboarding/profile';
    </script>
  `);
});

// Onboarding Profile
router.post("/onboarding/profile", requireAuth, async (req, res) => {
  const { name, role, bio, location, website } = req.body;

  if (!name) {
    return res.status(400).send(`
      <div class="alert alert-error alert-auto-hide">
        Display name is required.
      </div>
    `);
  }

  try {
    // Prepare preferences JSONB
    const preferences = {};
    if (bio) {
      preferences.bio = bio;
    }
    if (location) {
      preferences.location = location;
    }
    if (website) {
      preferences.website = website;
    }

    // Handle avatar upload if provided
    let avatarUrl = null;
    if (req.files && req.files.avatar) {
      const avatar = req.files.avatar;
      const ext = avatar.name.split(".").pop();
      const filename = `${req.user.id}_avatar.${ext}`;

      // Upload to Supabase storage using service key (bypasses RLS)
      const { error } = await supabase.storage
        .from("avatars")
        .upload(filename, avatar.data, {
          contentType: avatar.mimetype,
          upsert: true,
        });

      if (error) {
        console.error("Avatar upload error:", error);
        // Continue without avatar
      } else {
        const { data: publicUrl } = supabase.storage
          .from("avatars")
          .getPublicUrl(filename);
        avatarUrl = publicUrl.publicUrl;
      }
    }

    // Update profile
    const updateFields = [
      "name = $1",
      "role = $2",
      "preferences = preferences || $3",
    ];
    const values = [name, role || null, JSON.stringify(preferences)];

    if (avatarUrl) {
      updateFields.push("avatar_url = $" + (values.length + 1));
      values.push(avatarUrl);
    }

    await pool.query(
      `UPDATE profiles
       SET ${updateFields.join(", ")}
       WHERE user_id = $${values.length + 1}`,
      [...values, req.user.id],
    );

    // Redirect to dashboard after profile completion
    res.send(`
      <script>
        window.location.href = '/dashboard';
      </script>
    `);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).send(`
      <div class="alert alert-error alert-auto-hide">
        Failed to update profile.
      </div>
    `);
  }
});

// Settings Theme
router.post("/settings/theme", requireAuth, async (req, res) => {
  const { theme } = req.body;

  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
      [req.user.id, "theme", JSON.stringify(theme)],
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Theme update error:", error);
    res.status(500).json({ error: "Failed to update theme" });
  }
});

// Settings Language
router.post("/settings/language", requireAuth, async (req, res) => {
  const { language } = req.body;

  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
      [req.user.id, "language", JSON.stringify(language)],
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Language update error:", error);
    res.status(500).json({ error: "Failed to update language" });
  }
});

// Alias for explore-idea
router.get("/explore-idea", requireAuth, (req, res) => {
  res.redirect("/ideas");
});

// Leaderboards - Uses get_automated_leaderboards
router.get("/leaderboards", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_automated_leaderboards", {
    p_type: req.query.type,
    p_limit: req.query.limit || 10,
  });

  res.render("leaderboards/index", {
    title: "Leaderboards - Accelerator",
    user: req.user,
    leaderboards: data?.leaderboards || {},
    lng: req.language || "en",
  });
});

// Achievements - Uses get_user_achievements
router.get("/achievements", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_user_achievements", {
    p_user_id: req.user.id,
  });

  res.render("achievements/index", {
    title: "Achievements - Accelerator",
    user: req.user,
    achievements: data,
    lng: req.language || "en",
  });
});

// Voting & Rewards - Uses automated views
router.get("/voting-rewards", requireAuth, async (req, res) => {
  const userId = req.user.id;

  // Get all voting data from automated views and functions
  const { data: votingData } = await supabase.rpc("get_voting_dashboard_data", {
    p_user_id: userId,
  });

  // Get leaderboard from automated view
  const { data: leaderboard } = await supabase
    .from("automated_leaderboards")
    .select("*")
    .limit(10);

  // Get recent notifications (still needed for display)
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  res.render("voting/rewards", {
    title: "Voting & Rewards - Accelerator",
    user: req.user,
    votingData,
    leaderboard: leaderboard || [],
    notifications: notifications || [],
    lng: req.language || "en",
  });
});

// Alias for voting-reward
router.get("/voting-reward", requireAuth, (req, res) => {
  res.redirect("/voting-rewards");
});

// HTMX ENDPOINTS - For dynamic content loading
router.get("/dashboard/data", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_enhanced_dashboard_data", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

router.get("/ideas/data", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("comprehensive_idea_operations", {
    p_user_id: req.user.id,
    p_action: "get_list",
    p_data: req.query,
  });
  res.json(data);
});

router.get("/achievements/data", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_user_achievements", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

// Universal API endpoint - delegates everything to database functions
router.all("/api/:action", async (req, res) => {
  try {
    const { action } = req.params;
    const { data, error } = await supabase.rpc(action, {
      p_user_id: req.user?.id,
      p_data: req.method === "GET" ? req.query : req.body,
      p_action: req.query.action || req.body.action,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Dashboard API - uses automated views
router.get("/api/dashboard", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_enhanced_dashboard_data", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

// Ideas API - ultra-minimal
router.get("/api/ideas", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("comprehensive_idea_operations", {
    p_user_id: req.user.id,
    p_action: "get_list",
    p_data: req.query,
  });
  res.json(data);
});

router.post("/api/ideas", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("validate_and_create_idea", req.body);
  res.json(data);
});

// Votes - automated
router.post("/api/votes", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("validate_and_cast_vote", {
    p_idea_id: req.body.idea_id,
    p_user_id: req.user.id,
    p_rating: req.body.rating,
  });
  res.json(data);
});

// Settings - uses automated functions
router.get("/api/settings", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("manage_user_settings", {
    p_user_id: req.user.id,
    p_action: "get",
  });
  res.json(data);
});

router.post("/api/settings", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("manage_user_settings", {
    p_user_id: req.user.id,
    p_action: req.body.action || "update",
    p_settings: req.body,
  });
  res.json(data);
});

// Leaderboards - automated
router.get("/api/leaderboards", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_automated_leaderboards", {
    p_type: req.query.type,
    p_limit: req.query.limit || 10,
  });
  res.json(data);
});

// Recommendations - automated
router.get("/api/recommendations", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_idea_recommendations", {
    p_user_id: req.user.id,
    p_limit: req.query.limit || 10,
  });
  res.json(data);
});

// Achievements - automated
router.get("/api/achievements", requireAuth, async (req, res) => {
  const { data } = await supabase.rpc("get_user_achievements", {
    p_user_id: req.user.id,
  });
  res.json(data);
});

// System health - automated
router.get("/api/health", async (req, res) => {
  const { data } = await supabase.rpc("get_system_health_dashboard");
  res.json(data);
});

// AI routes - Apply authentication to all AI routes
router.use("/api/ai", requireAuth);

// Universal AI endpoint - delegates to external services
router.post("/api/ai/generate/:provider/:action", async (req, res) => {
  try {
    const { provider } = req.params;
    const { prompt, model, options } = req.body;

    // Credit validation and activity logging handled by database triggers
    // Only OpenRouter supported now
    if (provider !== "openrouter") {
      return res.status(400).json({ error: "Only OpenRouter is supported" });
    }
    const result = await callOpenRouter(prompt, { model, ...options });

    res.json(result);
  } catch {
    res.status(500).json({ error: "AI service error" });
  }
});

// GET /api/ai/models - Available models (static data)
router.get("/api/ai/models", (req, res) => {
  res.json({
    success: true,
    providers: ["openrouter"],
    models: {
      openrouter: ["google/gemma-3n-e2b-it:free"],
    },
  });
});

// Legacy endpoints - now delegate to universal endpoint
router.post("/api/ai/generate-content", async (req, res) => {
  // This now uses the universal AI endpoint above with OpenRouter
  const { model, input: prompt } = req.body;
  const provider = "openrouter";

  const response = await fetch(
    `${req.protocol}://${req.get("host")}/api/ai/generate/${provider}/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization,
      },
      body: JSON.stringify({ prompt, model }),
    },
  );

  const result = await response.json();
  res.json(result);
});

// Profile routes - Profile view - Uses user_achievements and user_onboarding_status views
router.get("/profile/:userId", requireAuth, async (req, res) => {
  const { userId } = req.params;
  const isOwnProfile = req.user?.id === userId;

  // Get comprehensive profile data from automated views
  const { data: achievements } = await supabase.rpc("get_user_achievements", {
    p_user_id: userId,
  });

  const { data: onboarding } = await supabase.rpc(
    "get_user_onboarding_status",
    {
      p_user_id: userId,
    },
  );

  // Get public ideas using the ideas view
  const { data: publicIdeas } = await supabase
    .from("ideas_with_full_stats")
    .select("*")
    .eq("user_id", userId)
    .eq("privacy", "public")
    .limit(10);

  res.render("profile/view", {
    title: `${onboarding?.name || "User"}'s Profile - Accelerator`,
    bodyClass: "profile-page",
    layout: "main",
    user: req.user,
    profile: {
      ...onboarding,
      achievements,
      stats: achievements?.statistics,
    },
    profileUser: {
      id: userId,
      ...onboarding,
      achievements: achievements?.unlocked_achievements,
      stats: achievements?.statistics,
    },
    publicIdeas: publicIdeas || [],
    isOwnProfile,
    lng: req.language || "en",
    activeNav: isOwnProfile ? "dashboard" : "",
  });
});

export default router;
