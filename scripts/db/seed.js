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

// Cleanup and seed files in order
const cleanupFile = "db/data/cleanup-seeds.sql";
const seedFiles = ["db/data/seeds.sql", "db/data/seeds_ideas.sql"];

console.log("🧹 Cleaning up existing seed data...");
console.log(`📄 Applying ${cleanupFile}...`);
execSync(`psql "${SUPABASE_DB_URL}" -f ${cleanupFile}`, {
  stdio: "inherit",
  cwd: join(__dirname, "../.."),
});

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
