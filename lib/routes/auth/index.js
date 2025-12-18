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
      const errorMsg = `Login failed: ${error.message}`.replace(
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
        return res.send(`<script>window.location.href = '/new-idea';</script>`);
      }
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
    const { email, password, firstName, lastName } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { firstName, lastName } },
    });

    if (error) {
      req.session.flash.error.push(`Signup failed: ${error.message}`);
      if (req.isHtmx) {
        return res.send(
          `<script>showToast('${`Signup failed: ${error.message}`.replace(/[\x00-\x1F\x7F]/g, "").replace(/'/g, "\\'")}', 'error');</script>`,
        );
      }
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

    if (!data.session) {
      // Email confirmation required
      req.session.flash.info.push(
        "Account created! Please check your email to confirm your account.",
      );
      if (req.isHtmx) {
        res.set("HX-Redirect", "/auth/login");
        return res.send("");
      }
      return res.redirect("/auth/login");
    }

    // Set session
    req.session.userId = data.user.id;
    req.session.supabaseAccessToken = data.session.access_token;
    req.session.supabaseRefreshToken = data.session.refresh_token;

    req.session.flash.success.push(
      "Account created successfully! Welcome to Accelerator.".replace(
        /[\x00-\x1F\x7F]/g,
        "",
      ),
    );

    if (req.isHtmx) {
      res.set("HX-Redirect", "/onboarding/package");
      return res.send("");
    }

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
      return res.send(
        `<script>showToast('Logged out successfully', 'success'); setTimeout(() => window.location.href = '/', 1000);</script>`,
      );
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

export default router;
