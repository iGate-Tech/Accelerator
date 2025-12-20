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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    helpers: helpers,
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "pages"));

// Session middleware
app.use(sessionMiddleware);

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
