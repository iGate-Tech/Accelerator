import express from "express";
import { createClient } from "@supabase/supabase-js";
import config from "../../config.js";
import logger from "../../utils/logger.js";
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
      logger.error("Login error:", error);
      const errorMsg = error.message.includes("Invalid login credentials")
        ? "Invalid email or password"
        : "Login failed. Please try again.";
      if (req.isHtmx) {
        return res.send(`
           <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="12" x2="12" y1="8" y2="12"></line>
               <line x1="12" x2="12.01" y1="16" y2="16"></line>
             </svg>
             <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.login_failed")}</div>
             <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${errorMsg}</div>
             <div class="col-start-2 mt-2">
               <button onclick="document.querySelector('form').submit()" class="btn btn-sm btn-outline">Retry</button>
             </div>
           </div>
           <script>hideLoading();</script>
         `);
      }
      return res.render("auth/login", {
        title: "Login - Accelerator",
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

    req.session.save(async (err) => {
      if (err) {
        logger.error("Session save error:", err);
        return res.status(500).send("Session error");
      }

      // Check if user has completed onboarding
      let onboardingComplete = false;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("user_id", data.user.id)
          .single();

        onboardingComplete = profile?.preferences?.onboarding_complete === true;
      } catch (error) {
        logger.error("Error checking onboarding status:", error);
        // Default to false if we can't check
      }

      const redirectUrl = onboardingComplete ? "/new-idea" : "/onboarding/plan";

      if (req.isHtmx) {
        // For HTMX requests, send success message and redirect via JavaScript
        // This ensures the session cookie is established before redirect
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.login_successful")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${req.t("alert.login_success_description")}</div>
          </div>
          <script>
            // Small delay to ensure session is established
            setTimeout(() => {
              window.location.href = '${redirectUrl}';
            }, 500);
          </script>
        `);
      }

      // Redirect based on onboarding completion
      res.redirect(redirectUrl);
    });
  } catch {
    const errorMsg = "Login failed. Please try again.";

    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Login Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${errorMsg}</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    return res.render("auth/login", {
      title: "Login - Accelerator",
    });
  }
});

// Signup page
router.get("/auth/signup", guestOnly, (req, res) => {
  res.render("auth/signup", {
    title: "Sign Up - Accelerator",
    bodyClass: "auth-page",
    layout: "auth",
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
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Terms Required</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">You must accept the Terms of Service and Privacy Policy to continue.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.render("auth/signup", {
        title: "Sign Up - Accelerator",
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { firstName, lastName } },
    });

    if (error) {
      logger.error("Signup error:", error);
      const errorMsg = error.message.includes("User already registered")
        ? "An account with this email already exists"
        : "Signup failed. Please try again.";
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.signup_failed")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${errorMsg}</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.render("auth/signup", {
        title: "Sign Up - Accelerator",
      });
    }

    // Create user profile with default settings (will be updated during onboarding)
    const profileResult = await initializeUserProfile(data.user.id);
    if (!profileResult.success) {
      logger.error("Failed to create user profile:", profileResult.error);
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
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-info grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Check Your Email</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Account created! Please check your email to confirm your account before logging in.</div>
          </div>
          <script>window.location.href = '/auth/login';</script>
        `);
      }
      return res.redirect("/auth/login");
    }

    // Set session
    req.session.userId = data.user.id;
    req.session.supabaseAccessToken = data.session.access_token;
    req.session.supabaseRefreshToken = data.session.refresh_token;

    // Check if user has completed onboarding (new signups won't have)
    let onboardingComplete = false;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("user_id", data.user.id)
        .single();

      onboardingComplete = profile?.preferences?.onboarding_complete === true;
    } catch (error) {
      logger.error("Error checking onboarding status:", error);
      // Default to false if we can't check
    }

    const redirectUrl = onboardingComplete ? "/new-idea" : "/onboarding/plan";

    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.signup_successful")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${req.t("alert.signup_success_description")}</div>
        </div>
        <script>setTimeout(() => window.location.href = '${redirectUrl}', 2000);</script>
      `);
    }

    res.redirect(redirectUrl);
  } catch {
    const errorMsg = "Signup failed. Please try again.";
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Signup Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${errorMsg}</div>
        </div>
        <script>hideLoading();</script>
      `);
    }

    res.render("auth/signup", {
      title: "Sign Up - Accelerator",
    });
  }
});

// Logout
router.post("/auth/logout", async (req, res) => {
  try {
    await supabase.auth.signOut();

    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    if (req.isHtmx) {
      return res.send(`
        <div class="flex items-center justify-center min-h-screen bg-background">
          <div class="text-center">
            <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 class="text-xl font-semibold text-foreground mb-2">Logging out...</h2>
            <p class="text-muted-foreground">Please wait while we securely log you out.</p>
          </div>
        </div>
        <script>setTimeout(() => window.location.href = '/', 8000);</script>
      `);
    }

    res.redirect("/");
  } catch (error) {
    logger.error("Logout error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Logout Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please try again or refresh the page.</div>
        </div>
      `);
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
      logger.error("Login error:", error);
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
    logger.error("API login error:", error);
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
      logger.error("Signup error:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Create user profile with default settings
    const profileResult = await initializeUserProfile(data.user.id);
    if (!profileResult.success) {
      logger.error("Failed to create user profile:", profileResult.error);
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
    logger.error("API signup error:", error);
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
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("API logout error:", error);
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
