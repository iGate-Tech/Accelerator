import session from "express-session";
import { createClient } from "@supabase/supabase-js";
import config from "./config.js";
import { createClient as createRedisClient } from "redis";
import RedisStore from "connect-redis";
import NodeCache from "node-cache";

const supabase = createClient(config.supabase.url, config.supabase.key);

const redisClient = createRedisClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

redisClient
  .connect()
  .then(() => console.log("Redis connected"))
  .catch((err) => console.error("Redis connection failed", err));

// In-memory cache for profiles (fallback if Redis unavailable)
const profileCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 min TTL

const RedisStoreSession = RedisStore(session);

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  store: new RedisStoreSession({
    client: redisClient,
    ttl: 24 * 60 * 60, // 24 hours in seconds
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
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
    // Fetch user profile with caching
    const cacheKey = `profile_${req.user.id}`;
    let profile = profileCache.get(cacheKey);
    if (!profile) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", req.user.id)
        .single();
      profile = profileData || {};
      profileCache.set(cacheKey, profile);
    }
    req.user.profile = profile;
    res.locals.user = req.user;
    next();
  } catch (error) {
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
    } catch (error) {
      req.user = null;
    }
  }
  res.locals.user = req.user;
  next();
};
