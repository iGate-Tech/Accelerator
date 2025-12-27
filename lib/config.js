import dotenv from "dotenv";
import fs from "fs";

// Only load .env if it exists and we're not in production (where env vars are set by Docker)
if (fs.existsSync(".env") && process.env.NODE_ENV !== "production") {
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
    provider: process.env.AI_PROVIDER || "openrouter", // openrouter, openai, anthropic
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "google/gemma-3n-e2b-it:free",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4",
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
    },
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || "sendgrid", // sendgrid, mailgun, smtp
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
    },
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.EMAIL_FROM || "noreply@accelerator.ai",
    fromName: process.env.EMAIL_FROM_NAME || "Accelerator AI",
  },
};

export default config;
