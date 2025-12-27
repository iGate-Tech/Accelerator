import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { createClient } from "@supabase/supabase-js";
import config from "./config.js";
import { logger } from "./utils.js";

const supabase = createClient(config.supabase.url, config.supabase.key);

const PostgreSQLStore = connectPgSimple(session);
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  store: new PostgreSQLStore({
    conString: config.supabase.dbUrl,
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Disable secure for localhost development
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

export const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    if (req.isHtmx) {
      return res.redirect("/auth/login");
    }
    return res.redirect("/auth/login");
  }

  try {
    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw error;
    }

    req.user = data.user;
    // Fetch user profile (always fresh for package_type accuracy)
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", req.user.id)
        .maybeSingle();
      if (profileError || !profileData) {
        req.user.profile = {};
      } else {
        req.user.profile = profileData;
        // Update profile name and avatar if missing
        const needsUpdate = {};
        if (
          (!profileData.name || profileData.name === "User") &&
          req.user.user_metadata
        ) {
          const updatedName =
            req.user.user_metadata.firstName && req.user.user_metadata.lastName
              ? `${req.user.user_metadata.firstName} ${req.user.user_metadata.lastName}`
              : req.user.email?.split("@")[0] || "User";
          if (updatedName && updatedName !== profileData.name) {
            needsUpdate.name = updatedName;
            req.user.profile.name = updatedName;
          }
        }
        if (!profileData.avatar_url && req.user.user_metadata?.avatar_url) {
          needsUpdate.avatar_url = req.user.user_metadata.avatar_url;
          req.user.profile.avatar_url = req.user.user_metadata.avatar_url;
        }
        if (Object.keys(needsUpdate).length > 0) {
          await supabase
            .from("profiles")
            .update(needsUpdate)
            .eq("user_id", req.user.id);
        }
        // Fetch package name
        if (profileData.package_type) {
          const { data: pkgData } = await supabase
            .from("packages")
            .select("name")
            .eq("type", profileData.package_type)
            .single();
          if (pkgData) {
            req.user.profile.packageName = pkgData.name;
          }
        }
      }
    } catch (error) {
      logger.error("Exception fetching profile in requireAuth:", error);
      req.user.profile = {};
    }
    res.locals.user = req.user;
    next();
  } catch (error) {
    logger.error("Auth error:", error);
    req.session.destroy();
    if (req.isHtmx) {
      return res.redirect("/auth/login");
    }
    res.redirect("/auth/login");
  }
};

export const guestOnly = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect("/new-idea");
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  if (req.session.userId) {
    try {
      if (req.session.supabaseAccessToken) {
        await supabase.auth.setSession({
          access_token: req.session.supabaseAccessToken,
          refresh_token: req.session.supabaseRefreshToken,
        });
      }
      const { data } = await supabase.auth.getUser();
      req.user = data.user || null;

      if (req.user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", req.user.id)
            .maybeSingle();
          if (profileError || !profileData) {
            req.user.profile = {};
          } else {
            req.user.profile = profileData;
            const needsUpdate = {};
            if (
              (!profileData.name || profileData.name === "User") &&
              req.user.user_metadata
            ) {
              const updatedName =
                req.user.user_metadata.firstName &&
                req.user.user_metadata.lastName
                  ? `${req.user.user_metadata.firstName} ${req.user.user_metadata.lastName}`
                  : req.user.email?.split("@")[0] || "User";
              if (updatedName && updatedName !== profileData.name) {
                needsUpdate.name = updatedName;
                req.user.profile.name = updatedName;
              }
            }
            if (!profileData.avatar_url && req.user.user_metadata?.avatar_url) {
              needsUpdate.avatar_url = req.user.user_metadata.avatar_url;
              req.user.profile.avatar_url = req.user.user_metadata.avatar_url;
            }
            if (Object.keys(needsUpdate).length > 0) {
              await supabase
                .from("profiles")
                .update(needsUpdate)
                .eq("user_id", req.user.id);
            }
            if (profileData.package_type) {
              const { data: pkgData } = await supabase
                .from("packages")
                .select("name")
                .eq("type", profileData.package_type)
                .single();
              if (pkgData) {
                req.user.profile.packageName = pkgData.name;
              }
            }
          }
        } catch (error) {
          logger.error("Profile update error:", error);
          req.user.profile = {};
        }
      }
    } catch (error) {
      logger.error("User context error:", error);
      req.user = null;
    }
  }
  res.locals.user = req.user;
  next();
};
