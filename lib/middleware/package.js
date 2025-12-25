import { createClient } from "@supabase/supabase-js";
import config from "../config.js";
import logger from "../utils/logger.js";

/**
 * Middleware to check package permissions
 * @param {string[]} allowedPackages - Array of allowed package types
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export function requirePackage(allowedPackages = [], options = {}) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        if (options.redirectToLogin) {
          return res.redirect("/auth/login");
        }
        return res.status(401).json({ error: "Authentication required" });
      }

      const supabase = createClient(config.supabase.url, config.supabase.key);

      // Get user profile
      const { data, error } = await supabase
        .from("profiles")
        .select("package_type, package_status")
        .eq("user_id", req.user.id)
        .single();
      let profile = data;

      // If no profile exists, create one with default free package
      if (error && error.code === "PGRST116") {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            user_id: req.user.id,
            package_type: "free",
            package_status: "active",
            credit_balance: 1000,
            total_earned: 1000,
            total_spent: 0,
          })
          .select("package_type, package_status")
          .single();

        if (createError) {
          logger.error("Error creating default profile:", createError);
          if (options.redirectTo) {
            req.session.flash.error.push(
              "Unable to set up account permissions. Please try again.",
            );
            return res.redirect(options.redirectTo);
          }
          if (options.redirectToLogin) {
            req.session.flash.error.push(
              "Unable to set up account permissions",
            );
            return res.redirect("/auth/login");
          }
          return res
            .status(500)
            .json({ error: "Unable to set up permissions" });
        }

        profile = newProfile;
      } else if (error) {
        logger.error("Error fetching profile for package check:", error);
        if (options.redirectTo) {
          req.session.flash.error.push(
            "Unable to verify account permissions. Please try again.",
          );
          return res.redirect(options.redirectTo);
        }
        if (options.redirectToLogin) {
          req.session.flash.error.push("Unable to verify account permissions");
          return res.redirect("/auth/login");
        }
        return res.status(500).json({ error: "Unable to verify permissions" });
      }

      // Check if package is active
      if (profile.package_status !== "active") {
        if (options.redirectToLogin) {
          req.session.flash.error.push(
            "Your account is not active. Please contact support.",
          );
          return res.redirect("/auth/login");
        }
        return res.status(403).json({ error: "Account not active" });
      }

      // Check if package type is allowed
      if (
        allowedPackages.length > 0 &&
        !allowedPackages.includes(profile.package_type)
      ) {
        if (options.redirectTo) {
          req.session.flash.error.push(
            "This feature requires a premium package. Please upgrade to access it.",
          );
          return res.redirect(options.redirectTo);
        }
        return res.status(403).json({ error: "Package upgrade required" });
      }

      // Add package info to request for use in routes
      req.user.package = profile;

      next();
    } catch (error) {
      logger.error("Package middleware error:", error);
      if (options.redirectToLogin) {
        req.session.flash.error.push(
          "An error occurred while checking permissions",
        );
        return res.redirect("/auth/login");
      }
      return res.status(500).json({ error: "Server error" });
    }
  };
}

/**
 * Middleware for free package users (limits certain features)
 */
export function freePackageLimits(req, res, next) {
  if (req.user && req.user.package) {
    // Free users can only vote on ideas, not create them
    if (req.user.package.package_type === "free") {
      req.user.canCreateIdeas = false;
      req.user.canUseAI = false;
      req.user.canGenerateReports = false;
    } else {
      req.user.canCreateIdeas = true;
      req.user.canUseAI = true;
      req.user.canGenerateReports = true;
    }
  }
  next();
}
