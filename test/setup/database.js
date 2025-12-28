import { Pool } from "pg";
import { config } from "dotenv";

// Load environment variables
config();

// Test database connection
export const createTestDb = () => {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    max: 5,
    idleTimeoutMillis: 30000,
  });
  return pool;
};

// Transaction wrapper for test isolation
export const withTransaction = async (pool, callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("ROLLBACK");
    return result;
  } finally {
    client.release();
  }
};
