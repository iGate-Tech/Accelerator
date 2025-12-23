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

// Load all translations from separate files
function loadTranslations(lang) {
  const translations = {};
  const localesDir = path.join(__dirname, "../locales", lang);

  try {
    const files = fs.readdirSync(localesDir);
    let totalKeys = 0;

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(localesDir, file);
        const namespace = file.replace(".json", "");

        try {
          const content = fs
            .readFileSync(filePath, "utf8")
            .replace(/\ufeff/g, "") // Remove BOM if present
            .trim();

          if (content) {
            translations[namespace] = JSON.parse(content);
            totalKeys += Object.keys(translations[namespace]).length;
          }
        } catch (error) {
          console.error(`Error loading ${lang}/${file}:`, error.message);
        }
      }
    }

    console.log(
      `Loaded ${lang} translations with ${totalKeys} keys from ${files.length} files`,
    );
  } catch (error) {
    console.error(`Error reading ${lang} locales directory:`, error.message);
  }

  return translations;
}

const enTranslations = loadTranslations("en");
const arTranslations = loadTranslations("ar");

// Initialize i18n
const allNamespaces = Object.keys(enTranslations);
i18next.use(i18nextMiddleware.LanguageDetector).init({
  resources: {
    en: enTranslations,
    ar: arTranslations,
  },
  fallbackLng: "en",
  supportedLngs: ["en", "ar"],
  ns: allNamespaces,
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
      t: function (key, options) {
        // Use the language from res.locals which is set by middleware
        const lng =
          options.hash?.lng || options.data?.root?.lng || this?.lng || "en";

        // Handle namespaced keys like 'sidebar.new_idea'
        if (key.includes(".")) {
          const [namespace, actualKey] = key.split(".", 2);
          return i18next.t(actualKey, { lng, ns: namespace, ...options.hash });
        }

        return i18next.t(key, { lng, ...options.hash });
      },
    },
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "pages"));

// Session middleware
app.use(sessionMiddleware);

// HTMX detection middleware
app.use((req, res, next) => {
  req.isHtmx = req.get("HX-Request") === "true";
  next();
});

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
  res.locals.lng = req.language;
  res.locals.t = req.t;
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
  console.log(
    `i18n: Detected language: ${req.language}, Session: ${req.session?.language}, Profile: ${req.user?.profile?.preferences?.language}`,
  );
  res.locals.lng = req.language;
  res.locals.t = req.t;
  console.log("i18n: res.locals.lng set to:", res.locals.lng);
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
