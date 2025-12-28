import { describe, it, expect } from "vitest";
import { createTestDb, withTransaction } from "../../setup/database.js";
import { createTestUser, createTestIdea } from "../../utils/test-helpers.js";

const pool = createTestDb();

describe("Database Views", () => {
  it("should return correct user dashboard summary", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client, { name: "Test User" });
      await createTestIdea(client, userId);

      const result = await client.query(
        `
        SELECT * FROM user_dashboard_summary WHERE user_id = $1
      `,
        [userId],
      );

      expect(result.rows[0].name).toBe("Test User");
      expect(result.rows[0].total_ideas).toBe(1);
    });
  });

  it("should calculate leaderboard correctly", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);
      const ideaId = await createTestIdea(client, userId);

      // Add votes
      const voterId = await createTestUser(client);
      await client.query(
        `
        INSERT INTO votes (idea_id, user_id, rating) VALUES ($1, $2, 5)
      `,
        [ideaId, voterId],
      );

      const result = await client.query(`
        SELECT title, vote_count FROM leaderboard LIMIT 1
      `);

      expect(result.rows[0].vote_count).toBe(1);
    });
  });

  it("should aggregate credit statistics properly", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);

      // Add transactions
      await client.query(
        `
        INSERT INTO credit_transactions (user_id, transaction_type, amount)
        VALUES ($1, 'credit_purchase', 200)
      `,
        [userId],
      );

      const result = await client.query(
        `
        SELECT total_credits_earned FROM credit_statistics WHERE user_id = $1
      `,
        [userId],
      );

      expect(result.rows[0].total_credits_earned).toBe(200);
    });
  });
});
