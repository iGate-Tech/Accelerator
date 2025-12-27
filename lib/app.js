import express from "express";
import exphbs from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import config from "./config.js";
import { sessionMiddleware } from "./session.js";
import routes from "./routes.js";
import { logger } from "./utils.js";
import fileUpload from "express-fileupload";
import i18next from "i18next";
import i18nextMiddleware from "i18next-http-middleware";
import fs from "fs";
import * as icons from "lucide-static";
import moment from "moment";
import { marked } from "marked";
import Handlebars from "handlebars";

Handlebars.registerHelper("eq", function (a, b, options) {
  const result = a === b;
  if (options && typeof options.fn === "function") {
    return result ? options.fn(this) : options.inverse(this);
  } else {
    return result;
  }
});

let loggedIcons = false;

Handlebars.registerHelper("icon", function (name, options) {
  if (!loggedIcons) {
    console.log("Icons loaded, sample keys:", Object.keys(icons).slice(0, 10));
    loggedIcons = true;
  }
  if (!icons) {
    console.error("Icons not loaded");
    return `<!-- Icon ${name} not loaded -->`;
  }
  // Convert kebab-case to PascalCase
  const pascalName = name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  const iconData = icons[pascalName];
  if (!iconData) {
    console.warn("Icon not found:", name, "(tried:", pascalName, ")");
    return `<!-- Icon ${name} not found -->`;
  }
  const cls = (options && options.hash && options.hash.class) || "";
  const size = (options && options.hash && options.hash.size) || 24;
  // iconData is a full SVG string, modify it
  let svg = iconData;
  svg = svg.replace(/class="[^"]*"/, `class="${cls}"`);
  svg = svg.replace(/width="[^"]*"/, `width="${size}"`);
  svg = svg.replace(/height="[^"]*"/, `height="${size}"`);
  return svg;
});

Handlebars.registerHelper("cond", function (condition, trueVal, falseVal) {
  return condition ? trueVal : falseVal;
});

Handlebars.registerHelper("gte", function (a, b) {
  return a >= b;
});

Handlebars.registerHelper("ne", function (a, b, options) {
  const result = a !== b;
  if (options && typeof options.fn === "function") {
    return result ? options.fn(this) : options.inverse(this);
  } else {
    return result;
  }
});

Handlebars.registerHelper("formatDate", function (date) {
  return moment(date).format("MMM D, YYYY");
});

Handlebars.registerHelper("markdown", function (text) {
  return marked(text);
});

Handlebars.registerHelper("capitalize", function (str) {
  if (!str) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load all translations into a single flat structure
function loadTranslations(lang) {
  const translations = {};
  const localesDir = path.join(__dirname, "../locales", lang);

  try {
    const files = fs.readdirSync(localesDir);

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
            const fileTranslations = JSON.parse(content);

            // Flatten the structure: {namespace}.{key} = value
            for (const [key, value] of Object.entries(fileTranslations)) {
              if (typeof value === "object" && value !== null) {
                // Handle nested objects
                for (const [subKey, subValue] of Object.entries(value)) {
                  translations[`${namespace}.${key}.${subKey}`] = subValue;
                }
              } else {
                translations[`${namespace}.${key}`] = value;
              }
            }
          }
        } catch (error) {
          logger.error(`Error loading ${lang}/${file}:`, error.message);
        }
      }
    }
  } catch (error) {
    logger.error(`Error reading ${lang} locales directory:`, error.message);
  }

  return { translation: translations };
}

const enTranslations = loadTranslations("en");
const arTranslations = loadTranslations("ar");

// Initialize i18n with flat structure
i18next.use(i18nextMiddleware.LanguageDetector).init({
  resources: {
    en: enTranslations,
    ar: arTranslations,
  },
  fallbackLng: "en",
  supportedLngs: ["en", "ar"],
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
const helpers = {
  t: function (key, options) {
    // Use the language from res.locals which is set by middleware
    const lng =
      options.hash?.lng || options.data?.root?.lng || this?.lng || "en";

    // Use the full dotted key directly (e.g., 'sidebar.new_idea')
    return i18next.t(key, { lng, ...options.hash });
  },
  eq: function (a, b, options) {
    const result = a === b;
    if (options && typeof options.fn === "function") {
      return result ? options.fn(this) : options.inverse(this);
    } else {
      return result;
    }
  },
  icon: function (name, options) {
    if (!icons) {
      console.error("Icons not loaded");
      return `<!-- Icon ${name} not loaded -->`;
    }
    // Convert kebab-case to PascalCase
    const pascalName = name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
    const iconData = icons[pascalName];
    if (!iconData) {
      console.warn("Icon not found:", name, "(tried:", pascalName, ")");
      return `<!-- Icon ${name} not found -->`;
    }
    const cls = (options && options.hash && options.hash.class) || "";
    const id = (options && options.hash && options.hash.id) || "";
    const size = (options && options.hash && options.hash.size) || 24;
    // iconData is a full SVG string, modify it
    let svg = iconData;
    svg = svg.replace(/class="[^"]*"/, `class="${cls}"`);
    if (id) {
      svg = svg.replace(/<svg/, `<svg id="${id}"`);
    }
    svg = svg.replace(/width="[^"]*"/, `width="${size}"`);
    svg = svg.replace(/height="[^"]*"/, `height="${size}"`);
    return svg;
  },
  cond: function (condition, trueVal, falseVal) {
    return condition ? trueVal : falseVal;
  },
  gte: function (a, b) {
    return a >= b;
  },
  len: function (arr) {
    return arr ? arr.length : 0;
  },
  firstName: function (name) {
    if (!name) {return "";}
    return name.split(" ")[0];
  },
  or: function (a, b) {
    return a || b;
  },
  not: function (a) {
    return !a;
  },
  formatDate: function (date) {
    return moment(date).format("MMM D, YYYY");
  },
  markdown: function (text) {
    return marked(text);
  },
  ne: function (a, b, options) {
    const result = a !== b;
    if (options && typeof options.fn === "function") {
      return result ? options.fn(this) : options.inverse(this);
    } else {
      return result;
    }
  },
  capitalize: function (str) {
    if (!str) {
      return "";
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
};

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
    helpers,
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "pages"));
app.set("view cache", false); // Disable cache for debugging

// Session middleware
app.use(sessionMiddleware);

// HTMX detection middleware
app.use((req, res, next) => {
  req.isHtmx = req.get("HX-Request") === "true";
  next();
});

// Load user context using database function
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
        // Load complete user context with single DB call
        const { data: context } = await supabase.rpc("load_user_context", {
          p_user_id: req.user.id,
        });
        if (context?.user) {
          req.user.profile = context.user;
          res.locals.projects = context.projects || [];
          res.locals.userStats = context.stats;
        }
      }
    } catch (error) {
      logger.error("Error loading user context:", error);
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

// Make user available in templates
app.use((req, res, next) => {
  res.locals.lng = req.language;
  res.locals.t = req.t;
  res.locals.user = req.user;
  next();
});

// Set active nav based on path
app.use((req, res, next) => {
  let activeNav = "";
  if (req.path.startsWith("/dashboard")) {
    activeNav = "dashboard";
  } else if (req.path === "/new-idea") {
    activeNav = "projects";
  } else if (req.path.startsWith("/portfolios")) {
    activeNav = "portfolios";
  } else if (req.path === "/voting-reward") {
    activeNav = "voting";
  }
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

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  logger.error("Unhandled error:", err);
  if (!res.headersSent) {
    res.status(500).json({
      error:
        config.nodeEnv === "development"
          ? err.message
          : "Internal server error",
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found - Accelerator",
    error: { status: 404, message: "Page not found" },
    lng: req.language || "en",
  });
});

export default app;
