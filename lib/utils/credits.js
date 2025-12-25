import { createClient } from "@supabase/supabase-js";
import config from "../config.js";
import logger from "./logger.js";
import { initializeUserProfile } from "./profile-init.js";

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey || config.supabase.key,
);

/**
 * Get user credits balance
 * @param {string} userId - Supabase user ID
 * @returns {Promise<{balance: number, error: any}>}
 */
export async function getUserCredits(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If user doesn't have profile record, initialize with default credits
      if (
        error.code === "PGRST116" ||
        error.message?.includes("No rows found")
      ) {
        const initResult = await initializeUserProfile(userId);
        if (initResult.success) {
          return { balance: 1000, error: null }; // Default starting credits
        }
      }
      logger.error("Error fetching user credits:", error);
      return { balance: 0, error };
    }

    return { balance: data?.credit_balance || 0, error: null };
  } catch (error) {
    logger.error("Error in getUserCredits:", error);
    return { balance: 0, error };
  }
}

/**
 * Check if user has enough credits
 * @param {string} userId - Supabase user ID
 * @param {number} amount - Required credits
 * @returns {Promise<{hasEnough: boolean, currentBalance: number, error: any}>}
 */
export async function hasEnoughCredits(userId, amount) {
  const { balance, error } = await getUserCredits(userId);
  return {
    hasEnough: balance >= amount,
    currentBalance: balance,
    error,
  };
}

/**
 * Deduct credits from user balance
 * @param {string} userId - Supabase user ID
 * @param {number} amount - Credits to deduct
 * @returns {Promise<{success: boolean, newBalance: number, error: any}>}
 */
export async function deductCredits(userId, amount) {
  try {
    // First get current balance
    const { balance: currentBalance, error: fetchError } =
      await getUserCredits(userId);
    if (fetchError) {
      return { success: false, newBalance: 0, error: fetchError };
    }

    if (currentBalance < amount) {
      return {
        success: false,
        newBalance: currentBalance,
        error: new Error("Insufficient credits"),
      };
    }

    const newBalance = currentBalance - amount;

    // Get current total_spent
    const { data: currentData, error: fetchSpentError } = await supabase
      .from("profiles")
      .select("total_spent")
      .eq("user_id", userId)
      .single();

    if (fetchSpentError) {
      logger.error("Error fetching current total_spent:", fetchSpentError);
      return {
        success: false,
        newBalance: currentBalance,
        error: fetchSpentError,
      };
    }

    const newTotalSpent = (currentData?.total_spent || 0) + amount;

    // Update balance and total_spent
    const { data, error } = await supabase
      .from("profiles")
      .update({
        credit_balance: newBalance,
        total_spent: newTotalSpent,
        last_credit_update: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("credit_balance")
      .single();

    if (error) {
      logger.error("Error deducting credits:", error);
      return { success: false, newBalance: currentBalance, error };
    }

    return {
      success: true,
      newBalance: data?.balance || newBalance,
      error: null,
    };
  } catch (error) {
    logger.error("Error in deductCredits:", error);
    return { success: false, newBalance: 0, error };
  }
}

/**
 * Middleware to check and deduct credits for AI operations
 * @param {number} amount - Credits to deduct (default 10 for AI)
 * @returns {function} Express middleware
 */
export function checkAndDeductCredits(amount = 10) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Check if user has enough credits
      const {
        hasEnough,
        currentBalance,
        error: checkError,
      } = await hasEnoughCredits(userId, amount);
      if (checkError) {
        logger.error("Error checking credits:", checkError);
        return res.status(500).json({ error: "Failed to check credits" });
      }

      if (!hasEnough) {
        return res.status(402).json({
          error: "Insufficient credits",
          required: amount,
          current: currentBalance,
        });
      }

      // Deduct credits
      const { success, error: deductError } = await deductCredits(
        userId,
        amount,
      );
      if (deductError || !success) {
        logger.error("Error deducting credits:", deductError);
        return res.status(500).json({ error: "Failed to deduct credits" });
      }

      // Log the transaction
      const { createClient } = await import("@supabase/supabase-js");
      const config = (await import("../config.js")).default;
      const supabase = createClient(
        config.supabase.url,
        config.supabase.serviceKey || config.supabase.key,
      );

      await supabase.from("credit_transactions").insert({
        user_id: userId,
        transaction_type: "ai_generation",
        amount: amount,
        metadata: { endpoint: req.originalUrl },
      });

      // Continue to next middleware
      next();
    } catch (error) {
      logger.error("Error in checkAndDeductCredits middleware:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
