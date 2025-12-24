import session from "express-session";
import { createClient } from "@supabase/supabase-js";
import config from "./config.js";
import NodeCache from "node-cache";
import FileStore from "session-file-store";
import { initializeUserProfile } from "./utils/profile-init.js";
import fs from "fs";
import path from "path";

const supabase = createClient(config.supabase.url, config.supabase.key);

// In-memory cache for profiles
const profileCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 min TTL

// Ensure sessions directory exists
const sessionsPath = path.resolve("./sessions");
try {
  if (!fs.existsSync(sessionsPath)) {
    fs.mkdirSync(sessionsPath, { recursive: true });
    console.log("Created sessions directory:", sessionsPath);
  }
} catch (error) {
  console.error("Failed to create sessions directory:", error);
}

// Custom file-based session store for persistence
class FileSessionStore {
  constructor(options = {}) {
    this.path = options.path || sessionsPath;
    this.ttl = options.ttl || 86400; // 24 hours
    this.sessions = new Map();

    // Load existing sessions from disk
    this.loadSessions();

    // Clean up expired sessions periodically
    setInterval(() => this.reap(), (options.reapInterval || 3600) * 1000);
  }

  // Required by express-session
  createSession(req, sess) {
    const sessionId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const session = { ...sess };
    this.sessions.set(sessionId, session);
    return session;
  }

  // Event emitter compatibility for express-session
  on(event, callback) {
    // We don't need to handle events for this simple implementation
    return this;
  }

  loadSessions() {
    try {
      const files = fs
        .readdirSync(this.path)
        .filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const sessionId = file.replace(".json", "");
          const filePath = path.join(this.path, file);
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

          // Check if session is expired
          if (
            data.cookie &&
            data.cookie.expires &&
            new Date(data.cookie.expires) > new Date()
          ) {
            this.sessions.set(sessionId, data);
          } else {
            // Remove expired session file
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error loading session file:", file, err);
        }
      }
      console.log(`Loaded ${this.sessions.size} sessions from disk`);
    } catch (err) {
      console.error("Error loading sessions from disk:", err);
    }
  }

  reap() {
    const now = new Date();
    for (const [sid, data] of this.sessions) {
      if (
        data.cookie &&
        data.cookie.expires &&
        new Date(data.cookie.expires) <= now
      ) {
        this.sessions.delete(sid);
        const filePath = path.join(this.path, `${sid}.json`);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error removing expired session file:", err);
        }
      }
    }
  }

  get(sid, callback) {
    const data = this.sessions.get(sid);
    callback(null, data);
  }

  set(sid, session, callback) {
    this.sessions.set(sid, session);
    const filePath = path.join(this.path, `${sid}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
      callback(null);
    } catch (err) {
      console.error("Error saving session to file:", err);
      callback(err);
    }
  }

  destroy(sid, callback) {
    this.sessions.delete(sid);
    const filePath = path.join(this.path, `${sid}.json`);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      callback(null);
    } catch (err) {
      console.error("Error destroying session file:", err);
      callback(err);
    }
  }
}

console.log("Using memory session store (simplified)");
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
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
        // Initialize profile if it doesn't exist
        console.log(`User ${req.user.id} has no profile, initializing...`);
        const initResult = await initializeUserProfile(req.user.id);
        if (initResult.success) {
          // Fetch the newly created profile
          const { data: newProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", req.user.id)
            .single();
          req.user.profile = newProfile || {};
          // Fetch package name for new profile
          if (newProfile && newProfile.package_type) {
            const { data: pkgData } = await supabase
              .from("packages")
              .select("name")
              .eq("type", newProfile.package_type)
              .single();
            if (pkgData) {
              req.user.profile.packageName = pkgData.name;
            }
          }
        } else {
          console.error("Failed to initialize profile for user:", req.user.id);
          req.user.profile = {};
        }
      } else {
        req.user.profile = profileData;
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
      console.error("Exception fetching profile in requireAuth:", error);
      req.user.profile = {};
    }
    res.locals.user = req.user;
    next();
  } catch {
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
    } catch {
      req.user = null;
    }
  }
  res.locals.user = req.user;
  next();
};
