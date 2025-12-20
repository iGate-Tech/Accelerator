import express from "express";
import exphbs from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import config from "./config.js";
import { sessionMiddleware } from "./session.js";
import routes from "./routes/index.js";
import helpers from "./utils/helpers.js";
import fileUpload from "express-fileupload";
import i18next from "i18next";
import i18nextMiddleware from "i18next-http-middleware";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load translations synchronously with error handling
let enTranslations = {};
let arTranslations = {};
try {
  const enContent = fs
    .readFileSync(
      path.join(__dirname, "../locales/en/translation.json"),
      "utf8",
    )
    .replace(/^\ufeff/, ""); // Remove BOM if present
  enTranslations = JSON.parse(enContent);
  console.log(
    "Loaded English translations with",
    Object.keys(enTranslations).length,
    "keys",
  );
} catch (error) {
  console.error("Error loading English translations:", error.message);
  enTranslations = {};
}
try {
  const arContent = fs
    .readFileSync(
      path.join(__dirname, "../locales/ar/translation.json"),
      "utf8",
    )
    .replace(/^\ufeff/, ""); // Remove BOM if present
  arTranslations = JSON.parse(arContent);
  console.log(
    "Loaded Arabic translations with",
    Object.keys(arTranslations).length,
    "keys",
  );
} catch (error) {
  console.error("Error loading Arabic translations:", error.message);
  arTranslations = {};
}

// Initialize i18n
i18next.use(i18nextMiddleware.LanguageDetector).init({
  resources: {
    en: { translation: enTranslations },
    ar: { translation: arTranslations },
  },
  fallbackLng: "en",
  supportedLngs: ["en", "ar"],
  ns: ["translation"],
  defaultNS: "translation",
  detection: {
    order: ["querystring", "session", "profile", "cookie", "header"],
    caches: ["cookie"],
    lookupSession: (req) => req.session?.language,
    lookupProfile: (req) => req.user?.profile?.preferences?.language,
  },
});

// Create Express app
const app = express();

// Configure Handlebars
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "layout"),
    partialsDir: [
      path.join(__dirname, "components"),
      path.join(__dirname, "pages"),
      { dir: path.join(__dirname, "pages", "landing"), namespace: "landing" },
    ],
    helpers: {
      ...helpers,
      t: (key, options) =>
        i18next.t(key, { lng: options.data.root.lng, ...options.hash }),
    },
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "pages"));

// Session middleware
app.use(sessionMiddleware);

// Custom middleware to fetch user profile before i18n detection
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const supabase = createClient(config.supabase.url, config.supabase.key);
      if (req.session.supabaseAccessToken) {
        supabase.auth.setSession({
          access_token: req.session.supabaseAccessToken,
          refresh_token: req.session.supabaseRefreshToken,
        });
      }
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        req.user = userData.user;
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", req.user.id)
          .single();
        if (profile) {
          req.user.profile = profile;
        }
      }
    } catch (error) {
      console.error("Error fetching user in middleware:", error);
    }
  }
  next();
});

// i18n middleware
app.use(i18nextMiddleware.handle(i18next));

// Debug middleware to log detected language
app.use((req, res, next) => {
  console.log(
    `i18n: Detected language: ${req.language}, Session: ${req.session?.language}, Profile: ${req.user?.profile?.preferences?.language}`,
  );
  res.locals.lng = req.language;
  next();
});

// Custom flash middleware
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || {
    success: [],
    error: [],
    info: [],
    warning: [],
  };
  req.session.flash = { success: [], error: [], info: [], warning: [] };
  next();
});

// Attach user profile info for authenticated users
app.use(async (req, res, next) => {
  if (req.user && !req.user.profile) {
    try {
      const supabase = createClient(
        config.supabase.url,
        config.supabase.serviceKey || config.supabase.key,
      );
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", req.user.id)
        .single();
      if (profile) {
        req.user.profile = profile;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }
  next();
});

// Make user available in templates
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.lng = req.language;
  res.locals.t = req.t;
  next();
});

// Set active nav based on path
app.use((req, res, next) => {
  let activeNav = "";
  if (req.path.startsWith("/dashboard")) activeNav = "dashboard";
  else if (req.path === "/new-idea") activeNav = "projects";
  else if (req.path.startsWith("/portfolios")) activeNav = "portfolios";
  else if (req.path === "/voting-reward") activeNav = "voting";
  res.locals.activeNav = activeNav;
  next();
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    abortOnLimit: true,
    useTempFiles: false,
    createParentPath: true,
  }),
);

// Static files (if any)
app.use(express.static("public"));

// Routes
app.use("/", routes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: "1.0.0",
  });
});

export default app;
