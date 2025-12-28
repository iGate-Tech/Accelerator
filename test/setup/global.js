import { beforeAll, afterAll } from "vitest";
import { createTestDb } from "./database.js";
import { migrateTestDb } from "./migrate.js";
import { seedTestData } from "./seed.js";

let pool;

beforeAll(async () => {
  pool = createTestDb();
  const client = await pool.connect();
  try {
    await migrateTestDb(client);
    await seedTestData(client);
  } finally {
    client.release();
  }
}, 120000); // 2 minute timeout for migration

afterAll(async () => {
  if (pool) {
    await pool.end();
  }
});
