import express from "express";
import { createClient } from "@supabase/supabase-js";
import config from "../../config.js";
import { guestOnly } from "../../session.js";
import { initializeUserProfile } from "../../utils/profile-init.js";

const supabase = createClient(config.supabase.url, config.supabase.key);
const router = express.Router();

// Login page
router.get("/auth/login", guestOnly, (req, res) => {
  res.render("auth/login", {
    title: "Login - Accelerator",
    bodyClass: "auth-page",
    layout: "auth",
    flash: res.locals.flash,
  });
});

// Login action
router.post("/auth/login", async (req, res) => {
  const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceKey || config.supabase.key,
  );

  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      const errorMsg = error.message.includes("Invalid login credentials")
        ? "Invalid email or password"
        : "Login failed. Please try again.";
      if (req.isHtmx) {
        res.set(
          "HX-Trigger",
          `{"show-toast": {"message": "${errorMsg.replace(/"/g, '\\"')}", "type": "error"}}`,
        );
        return res.send("");
      }
      req.session.flash.error.push(errorMsg);
      return res.render("auth/login", {
        title: "Login - Accelerator",
        flash: res.locals.flash,
      });
    }

    // Log activity
    await supabaseAdmin.from("activity_log").insert({
      user_id: data.user.id,
      action_type: "login",
      entity_type: "account",
      details: {
        description: `Successful login from ${req.headers["user-agent"]?.split(" ")[0] || "Unknown"}`,
      },
    });

    // Set session
    req.session.userId = data.user.id;
    req.session.supabaseAccessToken = data.session.access_token;
    req.session.supabaseRefreshToken = data.session.refresh_token;

    req.session.flash.success.push(
      "Login successful! Welcome back.".replace(/[\x00-\x1F\x7F]/g, ""),
    );

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Session error");
      }
      if (req.isHtmx) {
        return res.send(
          `<script>showToast('Login successful! Welcome back.', 'success'); setTimeout(() => window.location.href = '/new-idea', 1000);</script>`,
        );
      }
      req.session.flash.success.push(
        "Login successful! Welcome back.".replace(/[\x00-\x1F\x7F]/g, ""),
      );
      // Redirect to package selection for new users
      res.redirect("/onboarding/package");
    });
  } catch {
    const errorMsg = "Login failed. Please try again.".replace(
      /[\x00-\x1F\x7F]/g,
      "",
    );

    req.session.flash.error.push(errorMsg);
    if (req.isHtmx) {
      return res.send(
        `<script>showToast('${errorMsg.replace(/'/g, "\\'")}', 'error');</script>`,
      );
    }
    return res.render("auth/login", {
      title: "Login - Accelerator",
      flash: res.locals.flash,
    });
  }
});

// Signup page
router.get("/auth/signup", guestOnly, (req, res) => {
  res.render("auth/signup", {
    title: "Sign Up - Accelerator",
    bodyClass: "auth-page",
    layout: "auth",
    flash: res.locals.flash,
  });
});

// Signup action
router.post("/auth/signup", async (req, res) => {
  const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceKey || config.supabase.key,
  );

  try {
    const { email, password, firstName, lastName, terms } = req.body;

    // Server-side validation
    if (!terms) {
      if (req.isHtmx) {
        res.set(
          "HX-Trigger",
          '{"show-toast": {"message": "You must accept the Terms of Service and Privacy Policy.", "type": "error"}}',
        );
        return res.send("");
      }
      req.session.flash.error.push(
        "You must accept the Terms of Service and Privacy Policy.",
      );
      return res.render("auth/signup", {
        title: "Sign Up - Accelerator",
        flash: res.locals.flash,
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { firstName, lastName } },
    });

    if (error) {
      console.error("Signup error:", error);
      const errorMsg = error.message.includes("User already registered")
        ? "An account with this email already exists"
        : "Signup failed. Please try again.";
      if (req.isHtmx) {
        res.set(
          "HX-Trigger",
          `{"show-toast": {"message": "${errorMsg.replace(/"/g, '\\"')}", "type": "error"}}`,
        );
        return res.send("");
      }
      req.session.flash.error.push(errorMsg);
      return res.render("auth/signup", {
        title: "Sign Up - Accelerator",
        flash: res.locals.flash,
      });
    }

    // Create user profile with default settings (will be updated during onboarding)
    const profileResult = await initializeUserProfile(data.user.id);
    if (!profileResult.success) {
      console.error("Failed to create user profile:", profileResult.error);
      // Continue anyway - profile can be created later if needed
    }

    // Update profile with name from user metadata
    const name =
      `${data.user.user_metadata?.firstName || ""} ${data.user.user_metadata?.lastName || ""}`.trim();
    if (name) {
      await supabaseAdmin
        .from("profiles")
        .update({ name })
        .eq("user_id", data.user.id);
    }

    // Log signup activity
    await supabaseAdmin.from("activity_log").insert({
      user_id: data.user.id,
      action_type: "create",
      entity_type: "account",
      details: {
        description: "Account created successfully",
      },
    });

    // Create welcome notifications for new user
    const welcomeNotifications = [
      {
        user_id: data.user.id,
        type: "welcome",
        message:
          "🎉 Welcome to Accelerator! Your entrepreneurial journey starts here. Complete your profile to unlock all features.",
        is_read: false,
      },
      {
        user_id: data.user.id,
        type: "getting_started",
        message:
          '🚀 Ready to build? Start by creating your first idea. Click "New Project" to begin turning your vision into reality.',
        is_read: false,
      },
      {
        user_id: data.user.id,
        type: "tip",
        message:
          "💡 Pro tip: Share your ideas publicly to get community feedback and earn credits for reaching validation milestones!",
        is_read: false,
      },
    ];

    await supabaseAdmin.from("notifications").insert(welcomeNotifications);

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import("../../services/email.js");
      const firstName = data.user.user_metadata?.firstName || "there";
      await sendWelcomeEmail(data.user.email, firstName);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail signup if email fails
    }

    if (!data.session) {
      // Email confirmation required
      if (req.isHtmx) {
        res.set(
          "HX-Trigger",
          '{"show-toast": {"message": "Account created! Please check your email to confirm your account.", "type": "info"}}',
        );
        res.set("HX-Redirect", "/auth/login");
        return res.send("");
      }
      req.session.flash.info.push(
        "Account created! Please check your email to confirm your account.",
      );
      return res.redirect("/auth/login");
    }

    // Set session
    req.session.userId = data.user.id;
    req.session.supabaseAccessToken = data.session.access_token;
    req.session.supabaseRefreshToken = data.session.refresh_token;

    if (req.isHtmx) {
      return res.send(
        `<script>showToast('Account created successfully! Welcome to Accelerator.', 'success'); setTimeout(() => window.location.href = '/onboarding/package', 1000);</script>`,
      );
    }

    req.session.flash.success.push(
      "Account created successfully! Welcome to Accelerator.".replace(
        /[\x00-\x1F\x7F]/g,
        "",
      ),
    );
    res.redirect("/onboarding/package");
  } catch {
    const errorMsg = "Signup failed. Please try again.";
    req.session.flash.error.push(errorMsg);

    if (req.isHtmx) {
      return res.send(`<div class="error">${errorMsg}</div>`);
    }

    res.render("auth/signup", {
      title: "Sign Up - Accelerator",
      flash: res.locals.flash,
    });
  }
});

// Logout
router.post("/auth/logout", async (req, res) => {
  try {
    await supabase.auth.signOut();

    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (req.isHtmx) {
      res.set(
        "HX-Trigger",
        '{"show-toast": {"message": "Logged out successfully", "type": "success"}}',
      );
      res.set("HX-Redirect", "/");
      return res.send("");
    }

    res.redirect("/");
  } catch (error) {
    console.error("Logout error:", error);
    if (req.isHtmx) {
      return res.send(
        `<script>showToast('Logout failed. Please try again.'.replace(/[\x00-\x1F\x7F]/g, ''), 'error');</script>`,
      );
    }
    res.redirect("/");
  }
});

// API endpoints for authentication

// Login API endpoint
router.post("/api/auth/login", async (req, res) => {
  const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceKey || config.supabase.key,
  );

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Log activity
    await supabaseAdmin.from("activity_log").insert({
      user_id: data.user.id,
      action_type: "login",
      entity_type: "account",
      details: {
        description: `API login from ${req.headers["user-agent"]?.split(" ")[0] || "Unknown"}`,
      },
    });

    // Set session
    req.session.userId = data.user.id;
    req.session.supabaseAccessToken = data.session.access_token;
    req.session.supabaseRefreshToken = data.session.refresh_token;

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error("API login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Signup API endpoint
router.post("/api/auth/signup", async (req, res) => {
  const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceKey || config.supabase.key,
  );

  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { firstName, lastName } },
    });

    if (error) {
      console.error("Signup error:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Create user profile with default settings
    const profileResult = await initializeUserProfile(data.user.id);
    if (!profileResult.success) {
      console.error("Failed to create user profile:", profileResult.error);
    }

    // Update profile with name from user metadata
    const name =
      `${data.user.user_metadata?.firstName || ""} ${data.user.user_metadata?.lastName || ""}`.trim();
    if (name) {
      await supabaseAdmin
        .from("profiles")
        .update({ name })
        .eq("user_id", data.user.id);
    }

    // Log signup activity
    await supabaseAdmin.from("activity_log").insert({
      user_id: data.user.id,
      action_type: "create",
      entity_type: "account",
      details: {
        description: "Account created via API",
      },
    });

    // Create welcome notifications
    const welcomeNotifications = [
      {
        user_id: data.user.id,
        type: "welcome",
        message:
          "🎉 Welcome to Accelerator! Your entrepreneurial journey starts here. Complete your profile to unlock all features.",
        is_read: false,
      },
      {
        user_id: data.user.id,
        type: "getting_started",
        message:
          '🚀 Ready to build? Start by creating your first idea. Click "New Project" to begin turning your vision into reality.',
        is_read: false,
      },
      {
        user_id: data.user.id,
        type: "tip",
        message:
          "💡 Pro tip: Share your ideas publicly to get community feedback and earn credits for reaching validation milestones!",
        is_read: false,
      },
    ];

    await supabaseAdmin.from("notifications").insert(welcomeNotifications);

    if (!data.session) {
      // Email confirmation required
      return res.json({
        success: true,
        message:
          "Account created! Please check your email to confirm your account.",
        requiresConfirmation: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      });
    }

    // Set session for confirmed users
    req.session.userId = data.user.id;
    req.session.supabaseAccessToken = data.session.access_token;
    req.session.supabaseRefreshToken = data.session.refresh_token;

    res.json({
      success: true,
      message: "Account created successfully! Welcome to Accelerator.",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error("API signup error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Logout API endpoint
router.post("/api/auth/logout", async (req, res) => {
  try {
    await supabase.auth.signOut();

    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("API logout error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Get current session/user info
router.get("/api/auth/session", (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated",
      authenticated: false,
    });
  }

  res.json({
    success: true,
    authenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatar_url: req.user.avatar_url,
      package_type: req.user.package_type,
      credit_balance: req.user.credit_balance,
    },
  });
});

// Validate session endpoint
router.get("/api/auth/validate", (req, res) => {
  res.json({
    success: true,
    authenticated: !!req.user,
    user: req.user
      ? {
          id: req.user.id,
          email: req.user.email,
        }
      : null,
  });
});

export default router;
