#!/usr/bin/env node

/**
 * Database Seeding Script
 * Populates the database with initial sample data
 */

import { execSync } from "child_process";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error("❌ Error: SUPABASE_DB_URL environment variable is not set");
  process.exit(1);
}

// Seed files in application order
const seedFiles = ["db/data/seeds.sql"];

console.log("🌱 Starting database seeding...");

try {
  seedFiles.forEach((file) => {
    console.log(`📄 Applying ${file}...`);
    execSync(`psql "${SUPABASE_DB_URL}" -f ${file}`, {
      stdio: "inherit",
      cwd: join(__dirname, "../.."),
    });
  });

  console.log("✅ Database seeding complete!");
} catch (error) {
  console.error("❌ Database seeding failed:", error.message);
  process.exit(1);
}
