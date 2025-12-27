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
    const { data, error } = await supabase.rpc("get_user_credit_info", {
      p_user_id: userId,
    });

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

    return { balance: data?.profile?.credit_balance || 0, error: null };
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
 * @param {string} transactionType - Type of transaction
 * @param {object} metadata - Additional metadata
 * @returns {Promise<{success: boolean, newBalance: number, error: any}>}
 */
export async function deductCredits(userId, amount, metadata = {}) {
  try {
    const { data, error } = await supabase.rpc("process_ai_generation", {
      p_user_id: userId,
      p_cost: amount,
      p_metadata: metadata,
    });

    if (error) {
      logger.error("Error deducting credits:", error);
      return { success: false, newBalance: 0, error };
    }

    if (!data.success) {
      return { success: false, newBalance: 0, error: new Error(data.error) };
    }

    return {
      success: true,
      newBalance: data.new_balance,
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

      // Deduct credits (DB function handles transaction logging)
      const { success, error: deductError } = await deductCredits(
        userId,
        amount,
        { endpoint: req.originalUrl },
      );
      if (deductError || !success) {
        logger.error("Error deducting credits:", deductError);
        return res.status(500).json({ error: "Failed to deduct credits" });
      }

      // Continue to next middleware
      next();
    } catch (error) {
      logger.error("Error in checkAndDeductCredits middleware:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
