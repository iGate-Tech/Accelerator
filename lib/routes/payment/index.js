import express from "express";
import { createClient } from "@supabase/supabase-js";
import config from "../../config.js";
import logger from "../../utils/logger.js";
import { requireAuth } from "../../session.js";

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.key);

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
    const { cardType, cardNumber } = req.body;

    // In a real application, this would integrate with a payment processor like Stripe
    // For now, we'll just store a reference and redirect

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    // In a real implementation, you'd store payment method securely
    // For demo purposes, we'll just redirect

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
    logger.error("Add payment method error:", error);
    res.redirect("/add-payment-method");
  }
});

// Buy Credits page
router.get("/buy-credits", requireAuth, async (req, res) => {
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
    logger.error("Error fetching credit packages:", error);
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

    // Get the credit package
    const { data: creditPackage, error: packageError } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("id", package_id)
      .single();

    if (packageError || !creditPackage) {
      return res.redirect("/buy-credits");
    }

    // Get current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("user_id", userId)
      .single();

    const currentBalance = profile?.credit_balance || 0;
    const newBalance = currentBalance + creditPackage.credits;

    // Update balance
    await supabase
      .from("profiles")
      .update({
        credit_balance: newBalance,
        last_credit_update: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Record transaction
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      transaction_type: "credit_purchase",
      amount: creditPackage.credits,
      amount_paid: creditPackage.price,
    });

    res.redirect("/processing");
  } catch (error) {
    logger.error("Credit purchase error:", error);
    res.redirect("/buy-credits");
  }
});

// Billing page
router.get("/billing", requireAuth, async (req, res) => {
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

    // Note: Package info query removed as it was unused

    // Calculate billing stats
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    const { data: monthlyTransactions } = await supabase
      .from("credit_transactions")
      .select("amount")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    // Calculate spent this month
    const spentThisMonth =
      monthlyTransactions?.reduce((total, transaction) => {
        return total + (transaction.amount || 0);
      }, 0) || 0;

    // Get pending payments (simulated)
    const pendingPayments = 0; // In real app, query pending invoices

    // Next billing date (simulated)
    const nextBillingDate =
      profile?.package_type === "enterprise"
        ? new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;

    // Render the page
    res.render("payments/billing", {
      title: "Billing - Accelerator",
      bodyClass: "billing-page",
      layout: "main",
      user: req.user,
      billingStats: {
        currentBalance: profile?.credit_balance || 0,
        spentThisMonth,
        pendingPayments,
        nextBillingDate,
      },
      transactions: transactions || [],
      profile: profile || {},
    });
  } catch (error) {
    logger.error("Billing page error:", error);
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

// Upgrade Package page
router.get("/upgrade-package", requireAuth, async (req, res) => {
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
      logger.error("Error fetching packages:", error);
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
    logger.error("Upgrade package page error:", error);
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
    logger.error("Package upgrade error:", error);
    res.redirect("/upgrade-package");
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

export default router;
