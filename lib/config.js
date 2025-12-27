import dotenv from "dotenv";
import fs from "fs";

// Only load .env if running locally (not in Docker where env vars are set externally)
if (!process.env.SUPABASE_DB_URL && fs.existsSync(".env")) {
  dotenv.config();
}

const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_PUBLIC_KEY || process.env.SUPABASE_KEY, // Use anon key for client auth
    serviceKey: process.env.SUPABASE_KEY, // Service role key for admin operations
    dbUrl: process.env.SUPABASE_DB_URL, // PostgreSQL connection string for sessions
  },
  ai: {
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "google/gemma-3n-e2b-it:free",
    },
  },
};

export default config;
