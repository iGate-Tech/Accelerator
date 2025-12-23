import express from "express";
import { requireAuth } from "../../session.js";

const router = express.Router();

// Buy Credits page
router.get("/buy-credits", requireAuth, async (req, res) => {
  const { createClient } = await import("@supabase/supabase-js");
  const config = (await import("../../config.js")).default;
  const supabase = createClient(config.supabase.url, config.supabase.key);

  if (req.session.supabaseAccessToken) {
    await supabase.auth.setSession({
      access_token: req.session.supabaseAccessToken,
      refresh_token: req.session.supabaseRefreshToken,
    });
  }

  // Get available credit packages
  const { data: creditPackages, error } = await supabase
    .from("credit_packages")
    .select("*")
    .order("price");

  if (error) {
    console.error("Error fetching credit packages:", error);
  }

  // Translate package names
  if (creditPackages) {
    creditPackages.forEach((pkg) => {
      pkg.name = req.t("buy-credits.credits_count", {
        count: pkg.credits,
      });
    });
  }

  // Get user's current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("credit_balance")
    .eq("user_id", req.user.id)
    .single();

  res.render("payments/buy-credits", {
    title: "Buy Credits - Accelerator",
    bodyClass: "buy-credits-page",
    layout: "main",
    user: req.user,
    creditPackages: creditPackages || [],
    currentBalance: profile?.credit_balance || 0,
  });
});

// Process credit purchase
router.post("/buy-credits", requireAuth, async (req, res) => {
  try {
    const { package_id } = req.body;
    const userId = req.user.id;

    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey || config.supabase.key,
    );

    // Get package details
    const { data: creditPackage, error: packageError } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("id", package_id)
      .single();

    if (packageError || !creditPackage) {
      return res.redirect("/buy-credits");
    }

    // Direct credit allocation for testing - no payment processing

    // Add credits to user account
    const { data: profile } = await supabase
      .from("profiles")
      .select("credit_balance, total_earned")
      .eq("user_id", userId)
      .single();

    const newBalance = (profile?.credit_balance || 0) + creditPackage.credits;
    const newTotalEarned = (profile?.total_earned || 0) + creditPackage.credits;

    await supabase
      .from("profiles")
      .update({
        credit_balance: newBalance,
        total_earned: newTotalEarned,
        last_credit_update: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Record the transaction
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      transaction_type: "credit_purchase",
      amount: creditPackage.credits,
      metadata: {
        package_id: creditPackage.id,
        package_name: creditPackage.name,
        price: creditPackage.price,
      },
    });

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "credits_purchased",
      entity_type: "credit_package",
      entity_id: creditPackage.id,
      details: {
        package_name: creditPackage.name,
        credits_added: creditPackage.credits,
        amount_paid: creditPackage.price,
      },
    });

    res.redirect("/processing");
  } catch (error) {
    console.error("Credit purchase error:", error);
    res.redirect("/buy-credits");
  }
});

// Billing page
router.get("/billing", requireAuth, async (req, res) => {
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
    const userId = req.user.id;

    // Get user profile for current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("user_id", userId)
      .single();

    // Get billing history (credit transactions)
    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Get package/subscription info
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("package_type, package_status, package_started, package_expires")
      .eq("user_id", userId)
      .single();

    // Get package details if userProfile exists
    let packageDetails = null;
    if (userProfile && userProfile.package_type) {
      const { data: pkgData } = await supabase
        .from("packages")
        .select("name")
        .eq("type", userProfile.package_type)
        .single();
      packageDetails = pkgData;
    }

    // Calculate billing stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions =
      transactions?.filter((t) => new Date(t.created_at) >= thirtyDaysAgo) ||
      [];

    const spentThisMonth = recentTransactions
      .filter(
        (t) =>
          t.transaction_type !== "reward_earned" &&
          t.transaction_type !== "credit_purchase",
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const pendingPayments =
      transactions?.filter((t) => t.status === "pending").length || 0;

    // Mock some data for the template (in a real app, this would come from payment processor)
    const billingStats = {
      currentBalance: profile?.credit_balance || 0,
      spentThisMonth,
      pendingPayments,
      nextBillingDate: userProfile?.package_expires
        ? new Date(userProfile.package_expires).toLocaleDateString()
        : null,
    };

    res.render("payments/billing", {
      title: "Billing - Accelerator",
      bodyClass: "billing-page",
      layout: "main",
      user: req.user,
      billingStats,
      transactions: transactions || [],
      profile: userProfile,
      packageDetails: packageDetails,
    });
  } catch (error) {
    console.error("Billing page error:", error);
    res.render("payments/billing", {
      title: "Billing - Accelerator",
      bodyClass: "billing-page",
      layout: "main",
      user: req.user,
      billingStats: {
        currentBalance: 0,
        spentThisMonth: 0,
        pendingPayments: 0,
        nextBillingDate: null,
      },
      transactions: [],
      profile: {},
    });
  }
});

// Add Payment Method page
router.get("/add-payment-method", requireAuth, (req, res) => {
  res.render("payments/add-payment-method", {
    title: "Add Payment Method - Accelerator",
    bodyClass: "add-payment-method-page",
    layout: "main",
    user: req.user,
  });
});

// Process Add Payment Method
router.post("/add-payment-method", requireAuth, async (req, res) => {
  try {
    const {
      cardType,
      cardNumber,
      expiryDate,
      cardholderName,
      address,
      city,
      zipCode,
      country,
      state,
    } = req.body;

    // In a real application, this would integrate with a payment processor like Stripe
    // For now, we'll just store a reference and redirect

    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    // Store payment method reference (in real app, store tokenized card info)
    const paymentMethodData = {
      type: cardType,
      last4: cardNumber.slice(-4),
      expiry: expiryDate,
      cardholder_name: cardholderName,
      billing_address: {
        address,
        city,
        zipCode,
        country,
        state,
      },
    };

    // In a real implementation, you'd store this securely
    // For demo purposes, we'll just log it and redirect
    console.log("Payment method added:", {
      userId: req.user.id,
      ...paymentMethodData,
    });

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: req.user.id,
      action_type: "payment_method_added",
      entity_type: "payment_method",
      entity_id: null,
      details: { type: cardType, last4: cardNumber.slice(-4) },
    });

    res.redirect("/billing");
  } catch (error) {
    console.error("Add payment method error:", error);
    res.redirect("/add-payment-method");
  }
});

// Processing page
router.get("/processing", requireAuth, (req, res) => {
  res.render("payments/processing", {
    title: "Processing Payment - Accelerator",
    bodyClass: "processing-page",
    layout: false, // No layout for clean processing page
    user: req.user,
  });
});

// Upgrade Package page
router.get("/upgrade-package", requireAuth, async (req, res) => {
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
    // Fetch available packages
    const { data: packages, error } = await supabase
      .from("packages")
      .select("*")
      .order("price_monthly");

    if (error) {
      console.error("Error fetching packages:", error);
    }

    // Get current user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("package_type")
      .eq("user_id", req.user.id)
      .single();

    res.render("payments/upgrade-package", {
      title: "Upgrade Package - Accelerator",
      bodyClass: "upgrade-package-page",
      layout: "main",
      user: req.user,
      packages: packages || [],
      currentPackage: profile?.package_type || "free",
    });
  } catch (error) {
    console.error("Upgrade package page error:", error);
    res.render("payments/upgrade-package", {
      title: "Upgrade Package - Accelerator",
      bodyClass: "upgrade-package-page",
      layout: "main",
      user: req.user,
      packages: [],
      currentPackage: "free",
    });
  }
});

// Process package upgrade
router.post("/upgrade-package", requireAuth, async (req, res) => {
  try {
    const { package_type } = req.body;
    const userId = req.user.id;

    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../../config.js")).default;
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey || config.supabase.key,
    );

    // Validate package type
    const validPackages = ["free", "student", "enterprise"];
    if (!validPackages.includes(package_type)) {
      return res.redirect("/upgrade-package");
    }

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("package_type, credit_balance")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return res.redirect("/upgrade-package");
    }

    // Set credits based on package
    let creditsToAdd = 0;
    if (package_type === "student" && profile.package_type !== "student") {
      creditsToAdd = 100; // Student bonus credits
    } else if (
      package_type === "enterprise" &&
      profile.package_type !== "enterprise"
    ) {
      creditsToAdd = 500; // Enterprise bonus credits
    }

    // Update package and credits
    const newBalance = profile.credit_balance + creditsToAdd;

    await supabase
      .from("profiles")
      .update({
        package_type: package_type,
        credit_balance: newBalance,
        last_credit_update: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Record the transaction if credits were added
    if (creditsToAdd > 0) {
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        transaction_type: "package_upgrade",
        amount: creditsToAdd,
        metadata: {
          package_type: package_type,
          previous_package: profile.package_type,
        },
      });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action_type: "package_upgraded",
      entity_type: "package",
      entity_id: null,
      details: {
        new_package: package_type,
        previous_package: profile.package_type,
        credits_added: creditsToAdd,
      },
    });

    res.redirect("/processing");
  } catch (error) {
    console.error("Package upgrade error:", error);
    res.redirect("/upgrade-package");
  }
});

export default router;
