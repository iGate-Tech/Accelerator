import { createClient } from "@supabase/supabase-js";
import config from "../config.js";
import logger from "./logger.js";

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey || config.supabase.key,
);

/**
 * Initialize user credits record if it doesn't exist
 * @param {string} userId - Supabase user ID
 */
export async function initializeUserProfile(userId) {
  try {
    // Use database function to create profile with defaults
    const { data, error } = await supabase.rpc("manage_user_profile", {
      p_user_id: userId,
      p_action: "create",
      p_data: {
        initial_credits: 1000,
        package_type: "free",
      },
    });

    if (error) {
      logger.error("Error initializing user profile:", error);
      return { success: false, error };
    }

    if (!data.success) {
      logger.error("Profile creation failed:", data.error);
      return { success: false, error: new Error(data.error) };
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error("Error in initializeUserProfile:", error);
    return { success: false, error };
  }
}
