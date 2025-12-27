import express from "express";
import { requireAuth } from "../../session.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// Settings page
router.get("/settings", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Get user profile and package details using database function
  const { data: profileResult, error: profileError } = await supabase.rpc(
    "manage_user_profile",
    {
      p_user_id: req.user.id,
      p_action: "get",
    },
  );

  const profile = profileResult?.profile;
  const packageDetails = profileResult?.package;

  if (profileError || !profileResult?.success) {
    logger.error(
      "Error fetching profile:",
      profileError || profileResult?.error,
    );
  }

  // Get settings from profile preferences
  const settingsObj = profile?.preferences || {};

  // Set default theme if not set
  if (!settingsObj.theme) {
    settingsObj.theme = "light";
  }

  // Set default language if not set
  if (!settingsObj.language) {
    settingsObj.language = "en";
  }

  // Prepare form data
  const formData = {
    bio: settingsObj.bio || "",
    location: settingsObj.location || "",
    role: profile?.role || "",
  };

  // Get notification settings
  // Get user settings using database function
  const { data: userSettings, error: settingsError } = await supabase.rpc(
    "manage_user_settings",
    {
      p_user_id: req.user.id,
      p_action: "get",
    },
  );

  if (settingsError) {
    logger.error("Error fetching user settings:", settingsError);
  }

  const notificationsObj = userSettings?.notifications || {
    email: true,
    push: true,
  };

  // Populate user name for form display
  req.user.name =
    req.user.user_metadata?.name ||
    req.user.profile?.name ||
    req.user.email?.split("@")[0] ||
    "";

  res.render("dashboard/settings", {
    title: "Settings - Accelerator",
    bodyClass: "settings-page",
    layout: "main",
    user: req.user,
    profile: profile || {},
    settings: settingsObj,
    notifications: notificationsObj,
    packageDetails: packageDetails,
    currentBalance: profile?.credit_balance || 0,
    formData: formData,
    lng: req.i18n.language,
    projects: res.locals.projects,
  });
});

// Update profile settings
router.post("/settings/profile", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);
    const supabaseAdmin = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
    );

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { name, role, bio, location, website, social_links } = req.body;
    const updateData = { name, role };

    let avatarError = null;

    // Handle avatar upload
    if (req.files && req.files.avatar) {
      const avatarFile = req.files.avatar;

      // Validate file type and size
      if (!avatarFile.mimetype.startsWith("image/")) {
        avatarError = "Invalid file type. Please select an image.";
        logger.error("Invalid file type for avatar:", avatarFile.mimetype);
      } else if (avatarFile.size > 5 * 1024 * 1024) {
        avatarError = "File size must be less than 5MB.";
        logger.error("Avatar file too large:", avatarFile.size);
      } else {
        const fileName = `${req.user.id}_${Date.now()}_${avatarFile.name}`;
        const filePath = `avatar/${fileName}`;

        logger.info(
          "Starting avatar upload for user:",
          req.user.id,
          "file:",
          avatarFile.name,
        );
        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
          .from("avatars")
          .upload(filePath, avatarFile.data, {
            contentType: avatarFile.mimetype,
            upsert: false,
          });

        if (uploadError) {
          avatarError = "Failed to upload avatar. Please try again.";
          logger.error("Error uploading avatar:", uploadError);
          logger.error("File details:", {
            name: avatarFile.name,
            size: avatarFile.size,
            type: avatarFile.mimetype,
            path: filePath,
          });
        } else {
          logger.info("Avatar uploaded successfully:", filePath);
          // Get public URL
          const {
            data: { publicUrl },
          } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);

          logger.info("Avatar public URL generated:", publicUrl);
          updateData.avatar_url = publicUrl;
          // Log avatar upload
          await supabase.from("activity_log").insert({
            user_id: req.user.id,
            action_type: "avatar_uploaded",
            entity_type: "file",
            entity_id: null,
            details: { file_path: filePath, avatar_url: publicUrl },
          });
          logger.info("Avatar upload activity logged");
        }
      }
    }

    if (avatarError) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Avatar Upload Failed</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${avatarError}</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      res.redirect("/settings");
      return;
    }

    // Build preferences object
    const preferences = {};
    if (bio !== undefined) {
      preferences.bio = bio;
    }
    if (location !== undefined) {
      preferences.location = location;
    }
    if (website !== undefined) {
      preferences.website = website;
    }
    if (social_links !== undefined) {
      try {
        preferences.social_links = JSON.parse(social_links);
      } catch {
        preferences.social_links = social_links;
      }
    }

    if (Object.keys(preferences).length > 0) {
      updateData.preferences = preferences;
    }

    const { data: updateResult, error } = await supabase.rpc(
      "update_user_profile_safe",
      {
        p_user_id: req.user.id,
        p_updates: updateData,
      },
    );

    if (error || !updateResult?.success) {
      logger.error("Error updating profile:", error || updateResult?.error);
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.profile_update_failed")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to update profile. Please try again.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      res.redirect("/settings");
    } else {
      // Activity logging handled by database function
      if (req.isHtmx) {
        const isAvatarUpdate = updateData.avatar_url !== undefined;
        const title = isAvatarUpdate
          ? "Avatar Updated Successfully"
          : req.t("alert.profile_updated");
        const description = isAvatarUpdate
          ? "Your profile picture has been updated."
          : req.t("alert.profile_update_success_description");

        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${title}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${description}</div>
          </div>
          <script>
            // Small delay to ensure alert is shown
            setTimeout(() => {
              window.location.href = '/settings';
            }, 1000);
          </script>
        `);
      }
      res.redirect("/settings");
    }
  } catch (error) {
    logger.error("Profile update error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Profile Update Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">An error occurred. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    res.redirect("/settings");
  }
});

// Notification page
router.get("/notifications", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", req.user.id)
    .eq("is_read", false);

  // Get notifications for SSR
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Set for nav dropdown SSR
  res.locals.notifications = notifications || [];
  res.locals.unreadCount = unreadCount || 0;

  res.render("notifications/notification", {
    title: "Notifications - Accelerator",
    bodyClass: "notification-page",
    layout: "main",
    user: req.user,
    unreadCount: unreadCount || 0,
    notifications: notifications || [],
  });
});

// User Activity page
router.get("/user-activity", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Fetch user activity
  const { data: activities, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Error fetching user activity:", error);
  }

  // Group activities by date
  const groupedActivities = new Map();
  (activities || []).forEach((activity) => {
    const date = new Date(activity.created_at).toDateString();
    if (!groupedActivities.has(date)) {
      groupedActivities.set(date, []);
    }
    groupedActivities.get(date).push(activity);
  });

  res.render("dashboard/user-activity", {
    title: "User Activity - Accelerator",
    bodyClass: "user-activity-page",
    layout: "main",
    user: req.user,
    activities: activities || [],
    groupedActivities,
  });
});

// Billing History page
router.get("/billing-history", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Fetch billing history
  const { data: billingHistory, error } = await supabase
    .from("billing_history")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching billing history:", error);
  }

  res.render("dashboard/billing-history", {
    title: "Billing History - Accelerator",
    bodyClass: "billing-history-page",
    layout: "main",
    user: req.user,
    billingHistory: billingHistory || [],
    projects: res.locals.projects,
  });
});

// Payment Methods page
router.get("/payment-methods", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Fetch saved payment methods from user_settings (mock for now)
  const { data: paymentMethods, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", req.user.id)
    .in("key", ["payment_card_last4", "payment_card_brand"]);

  if (error) {
    logger.error("Error fetching payment methods:", error);
  }

  // Group by card (assuming multiple keys per card, but simplified)
  const cards = [];
  if (paymentMethods) {
    // Mock: assume one card for now
    const last4 = paymentMethods.find(
      (m) => m.key === "payment_card_last4",
    )?.value;
    const brand = paymentMethods.find(
      (m) => m.key === "payment_card_brand",
    )?.value;
    if (last4) {
      cards.push({ last4, brand: brand || "Visa" });
    }
  }

  res.render("dashboard/payment-methods", {
    title: "Payment Methods - Accelerator",
    bodyClass: "payment-methods-page",
    layout: "main",
    user: req.user,
    paymentMethods: cards,
    projects: res.locals.projects,
  });
});

// Add payment method
router.post("/payment-methods", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { card_number } = req.body;

    // Mock: Store last4 and brand (don't store real card data)
    const last4 = card_number.slice(-4);
    const brand = "Visa"; // Mock brand detection

    // Delete existing
    await supabase
      .from("user_settings")
      .delete()
      .eq("user_id", req.user.id)
      .in("key", ["payment_card_last4", "payment_card_brand"]);

    // Insert new
    const { error } = await supabase.from("user_settings").insert([
      { user_id: req.user.id, key: "payment_card_last4", value: last4 },
      { user_id: req.user.id, key: "payment_card_brand", value: brand },
    ]);

    if (error) {
      logger.error("Error saving payment method:", error);
    }

    res.redirect("/payment-methods");
  } catch (error) {
    logger.error("Add payment method error:", error);
    res.redirect("/payment-methods");
  }
});

// Update package
router.post("/settings/package", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { package_type } = req.body;

    // Validate package type
    if (!["free", "student", "enterprise"].includes(package_type)) {
      return res.redirect("/settings");
    }

    // Get current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    if (fetchError) {
      logger.error("Error fetching current profile:", fetchError);
      return res.redirect("/settings");
    }

    // Update package using database function
    const { data: packageResult, error: updateError } = await supabase.rpc(
      "update_user_package",
      {
        p_user_id: req.user.id,
        p_package_type: package_type,
      },
    );

    if (updateError || !packageResult?.success) {
      logger.error(
        "Error updating package:",
        updateError || packageResult?.error,
      );
      // Continue anyway, redirect will show current state
    }
    // Package update, credit transaction, and activity logging handled by database function

    res.redirect("/settings");
  } catch (error) {
    logger.error("Package update error:", error);
    res.redirect("/settings");
  }
});

// Update password
router.post("/settings/password", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { current_password, new_password, confirm_password } = req.body;

    // Validate passwords
    if (!current_password || !new_password || !confirm_password) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.missing_fields")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">All fields are required.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/settings");
    }

    if (new_password !== confirm_password) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.passwords_mismatch")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">New passwords do not match.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/settings");
    }

    if (new_password.length < 8) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.password_too_short")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Password must be at least 8 characters long.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/settings");
    }

    // Update password using Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (error) {
      logger.error("Error updating password:", error);
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.password_update_failed")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to update password. Please try again.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      res.redirect("/settings");
    } else {
      // Log password change
      await supabase.from("activity_log").insert({
        user_id: req.user.id,
        action_type: "password_changed",
        entity_type: "user",
        entity_id: req.user.id,
        details: { method: "settings" },
      });

      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.password_updated")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">${req.t("alert.password_update_success_description")}</div>
          </div>
          <script>
            // Small delay to ensure alert is shown
            setTimeout(() => {
              window.location.href = '/settings';
            }, 1000);
          </script>
        `);
      }
      res.redirect("/settings");
    }
  } catch (error) {
    logger.error("Password update error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Password Update Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">An error occurred. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    res.redirect("/settings");
  }
});

// Update theme setting
router.post("/settings/theme", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { theme } = req.body;

    // Validate theme
    if (!["light", "dark"].includes(theme)) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.invalid_theme")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Invalid theme selected.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/settings");
    }

    // Get current profile preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("user_id", req.user.id)
      .single();

    const currentPreferences = profile?.preferences || {};

    // Update theme in preferences
    const updatedPreferences = {
      ...currentPreferences,
      theme: theme,
    };

    const { error } = await supabase
      .from("profiles")
      .update({ preferences: updatedPreferences })
      .eq("user_id", req.user.id);

    if (error) {
      logger.error("Error updating theme:", error);
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.theme_update_failed")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to update theme. Please try again.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      res.redirect("/settings");
    } else {
      // Update session
      req.session.theme = theme;
      // Log theme change
      await supabase.from("activity_log").insert({
        user_id: req.user.id,
        action_type: "theme_changed",
        entity_type: "user",
        entity_id: req.user.id,
        details: { new_theme: theme },
      });

      // Update or insert theme setting
      await supabase
        .from("user_settings")
        .delete()
        .eq("user_id", req.user.id)
        .eq("key", "theme");

      const { error: insertError } = await supabase
        .from("user_settings")
        .insert({
          user_id: req.user.id,
          key: "theme",
          value: theme,
        });

      if (insertError) {
        logger.error("Error updating theme in user_settings:", insertError);
        // Still consider success for main update
      }

      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.theme_updated")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Theme updated to ${theme}.</div>
          </div>
          <script>
            // Small delay to ensure alert is shown
            setTimeout(() => {
              window.location.reload(); // Reload to apply theme
            }, 1000);
          </script>
        `);
      }
      res.redirect("/settings");
    }
  } catch (error) {
    logger.error("Theme update error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Theme Update Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">An error occurred. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    res.redirect("/settings");
  }
});

// Update language setting
router.post("/settings/language", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { language } = req.body;

    // Validate language
    if (!["en", "ar"].includes(language)) {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.invalid_language")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Invalid language selected.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/settings");
    }

    // Get current profile preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("user_id", req.user.id)
      .single();

    const currentPreferences = profile?.preferences || {};

    // Update language in preferences
    const updatedPreferences = {
      ...currentPreferences,
      language: language,
    };

    const { error } = await supabase
      .from("profiles")
      .update({ preferences: updatedPreferences })
      .eq("user_id", req.user.id);

    if (error) {
      logger.error("Error updating language:", error);
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.language_update_failed")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to update language. Please try again.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      res.redirect("/settings");
    } else {
      // Update session
      req.session.language = language;
      // Log language change
      await supabase.from("activity_log").insert({
        user_id: req.user.id,
        action_type: "language_changed",
        entity_type: "user",
        entity_id: req.user.id,
        details: { new_language: language },
      });

      // Update or insert language setting
      await supabase
        .from("user_settings")
        .delete()
        .eq("user_id", req.user.id)
        .eq("key", "language");

      const { error: insertError } = await supabase
        .from("user_settings")
        .insert({
          user_id: req.user.id,
          key: "language",
          value: language,
        });

      if (insertError) {
        logger.error("Error updating language in user_settings:", insertError);
        // Still success for main
      }

      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.language_updated")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Language updated to ${language === "en" ? "English" : "العربية"}.</div>
          </div>
          <script>
            // Small delay to ensure alert is shown
            setTimeout(() => {
              window.location.reload(); // Reload to apply language
            }, 1000);
          </script>
        `);
      }
      res.redirect("/settings");
    }
  } catch (error) {
    logger.error("Language update error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Language Update Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">An error occurred. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    res.redirect("/settings");
  }
});

// Update notification settings
router.post("/settings/notifications", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    // Extract notification preferences
    const notificationSettings = {
      email: {
        project_updates: req.body.email_project_updates !== undefined,
        billing: req.body.email_billing !== undefined,
        marketing: req.body.email_marketing !== undefined,
      },
      push: {
        messages: req.body.push_messages !== undefined,
        reminders: req.body.push_reminders !== undefined,
      },
    };

    // Update notification settings using database function
    const { data: settingsResult, error } = await supabase.rpc(
      "manage_user_settings",
      {
        p_user_id: req.user.id,
        p_action: "update_notifications",
        p_settings: notificationSettings,
      },
    );

    if (error || !settingsResult?.success) {
      logger.error(
        "Error updating notification settings:",
        error || settingsResult?.error,
      );
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.notifications_update_failed")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to update notification settings. Please try again.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      res.redirect("/settings");
    } else {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.notifications_updated")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Notification settings updated successfully.</div>
          </div>
          <script>
            // Small delay to ensure alert is shown
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          </script>
        `);
      }
      res.redirect("/settings");
    }
  } catch (error) {
    logger.error("Notification settings update error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Notification Settings Update Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">An error occurred. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    res.redirect("/settings");
  }
});

// Delete account
router.post("/settings/delete", requireAuth, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { confirm_delete } = req.body;

    // Check confirmation
    if (confirm_delete !== "DELETE") {
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.confirmation_required")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Please type 'DELETE' to confirm account deletion.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/settings");
    }

    // Soft delete: Set package status to cancelled and anonymize data
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        package_status: "cancelled",
        name: "[Deleted User]",
        avatar_url: null,
        role: null,
        preferences: {},
      })
      .eq("user_id", req.user.id);

    if (profileError) {
      logger.error("Error updating profile for deletion:", profileError);
      if (req.isHtmx) {
        return res.send(`
          <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.account_deletion_failed")}</div>
            <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Failed to delete account. Please try again.</div>
          </div>
          <script>hideLoading();</script>
        `);
      }
      return res.redirect("/settings");
    }

    // Delete related data (ideas, votes, etc. will cascade via FK)
    // For demonstration, we'll just mark as cancelled. In production, consider hard delete or archive.

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: req.user.id,
      action_type: "account_deleted",
      entity_type: "user",
      entity_id: req.user.id,
      details: { reason: "user_requested_deletion" },
    });

    // Sign out user
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-success grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">${req.t("alert.account_deleted")}</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">Your account has been deleted successfully.</div>
        </div>
        <script>
          // Small delay to ensure alert is shown, then redirect
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        </script>
      `);
    }
    req.session.destroy((err) => {
      if (err) {
        logger.error("Error destroying session:", err);
      }
      res.redirect("/");
    });
  } catch (error) {
    logger.error("Account deletion error:", error);
    if (req.isHtmx) {
      return res.send(`
        <div data-slot="alert" role="alert" class="w-full rounded-lg border px-4 py-3 text-sm alert-destructive grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current alert-auto-hide alert-sticky">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">Account Deletion Failed</div>
          <div data-slot="alert-description" class="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">An error occurred. Please try again.</div>
        </div>
        <script>hideLoading();</script>
      `);
    }
    res.redirect("/settings");
  }
});

export default router;
