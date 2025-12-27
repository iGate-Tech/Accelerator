import express from "express";
import { createClient } from "@supabase/supabase-js";
import config from "../../config.js";
import { requireAuth } from "../../session.js";
import logger from "../../utils/logger.js";

const router = express.Router();
const supabase = createClient(config.supabase.url, config.supabase.key);

// GET /api/credits - Get current user's credit balance and recent transactions
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Use DB function for credit info
    const { data: creditData, error } = await supabase.rpc(
      "get_user_credit_info",
      { p_user_id: userId },
    );

    if (error) {
      logger.error("Error fetching credit info:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch credit information",
      });
    }

    // Handle case where user doesn't have a profile yet
    const profileData = creditData?.profile || {
      credit_balance: 0,
      total_spent: 0,
      total_earned: 0,
      last_credit_update: null,
    };

    const transactions = creditData?.transactions || [];

    res.json({
      success: true,
      balance: profileData.credit_balance,
      total_spent: profileData.total_spent,
      total_earned: profileData.total_earned,
      last_update: profileData.last_credit_update,
      recent_transactions: transactions || [],
    });
  } catch (error) {
    logger.error("Get credits error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/credits/purchase - Purchase credits
router.post("/purchase", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { package_id } = req.body;

    if (!package_id) {
      return res.status(400).json({
        success: false,
        error: "Package ID is required",
      });
    }

    // Get credit package details
    const { data: creditPackage, error: pkgError } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("id", package_id)
      .single();

    if (pkgError || !creditPackage) {
      return res.status(404).json({
        success: false,
        error: "Credit package not found",
      });
    }

    // For now, assume credits are granted immediately (in a real implementation,
    // this would integrate with a payment processor like Stripe)

    // Get current user credit info using database function
    const { data: creditInfo, error: profileError } = await supabase.rpc(
      "get_user_credit_info",
      {
        p_user_id: userId,
      },
    );

    if (profileError || !creditInfo) {
      logger.error("Error fetching credit info:", profileError);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch credit information",
      });
    }

    // Add credits using database function
    const { data: creditResult, error: updateError } = await supabase.rpc(
      "process_credit_transaction",
      {
        p_user_id: userId,
        p_type: "credit_purchase",
        p_amount: creditPackage.credits,
        p_metadata: {
          package_id: creditPackage.id,
          package_name: creditPackage.name,
        },
      },
    );

    if (updateError || !creditResult?.success) {
      logger.error(
        "Error processing credit transaction:",
        updateError || creditResult?.error,
      );
      return res.status(500).json({
        success: false,
        error: "Failed to process credit purchase",
      });
    }

    // Transaction and activity logging handled by database function

    res.json({
      success: true,
      message: `Successfully purchased ${creditPackage.credits} credits`,
      credits_added: creditPackage.credits,
      new_balance: creditResult.new_balance,
      package: {
        id: creditPackage.id,
        name: creditPackage.name,
        credits: creditPackage.credits,
        price: creditPackage.price,
      },
    });
  } catch (error) {
    logger.error("Purchase credits error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/credits/transactions - Get paginated credit transaction history
router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, type, start_date, end_date } = req.query;

    // Use database function for credit history with pagination
    const filters = {};
    if (type) filters.type = type;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const { data: historyData, error } = await supabase.rpc(
      "get_credit_history",
      {
        p_user_id: userId,
        p_limit: parseInt(limit),
        p_offset: parseInt(offset),
      },
    );

    if (error || !historyData) {
      logger.error("Error fetching credit history:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch credit history",
      });
    }

    res.json({
      success: true,
      transactions: historyData.transactions || [],
      summary: historyData.summary,
      pagination: historyData.pagination,
    });
  } catch (error) {
    logger.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/credits/summary - Get credit usage summary
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    // Get transactions in date range
    const { data: transactions, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching transaction summary:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch credit summary",
      });
    }

    // Calculate summary statistics
    const summary = {
      total_earned: 0,
      total_spent: 0,
      ai_generations: 0,
      rewards_earned: 0,
      purchases: 0,
      by_type: {},
    };

    transactions?.forEach((tx) => {
      // Initialize type counter if not exists
      if (!summary.by_type[tx.transaction_type]) {
        summary.by_type[tx.transaction_type] = 0;
      }

      if (tx.amount > 0) {
        summary.total_earned += tx.amount;
        summary.by_type[tx.transaction_type] += tx.amount;

        if (tx.transaction_type === "reward_earned") {
          summary.rewards_earned += tx.amount;
        } else if (tx.transaction_type === "credit_purchase") {
          summary.purchases += tx.amount;
        }
      } else {
        summary.total_spent += Math.abs(tx.amount);
        summary.by_type[tx.transaction_type] += Math.abs(tx.amount);

        if (tx.transaction_type === "ai_generation") {
          summary.ai_generations += Math.abs(tx.amount);
        }
      }
    });

    // Get current balance using database function
    const { data: creditInfo } = await supabase.rpc("get_user_credit_info", {
      p_user_id: userId,
    });

    res.json({
      success: true,
      period_days: parseInt(days),
      current_balance: creditInfo?.profile?.credit_balance || 0,
      summary,
      transaction_count: transactions?.length || 0,
    });
  } catch (error) {
    logger.error("Get summary error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
