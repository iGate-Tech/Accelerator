import { describe, it, expect } from "vitest";
import { createTestDb, withTransaction } from "../setup/database.js";
import { createTestUser, createTestIdea } from "../utils/test-helpers.js";

const pool = createTestDb();

describe("Core Functions", () => {
  it("should calculate completion percentage correctly", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);
      const ideaId = await createTestIdea(client, userId);

      // Create model instance
      await client.query(
        `
        INSERT INTO model_instances (idea_id, user_id, model_type, status)
        VALUES ($1, $2, 'business', 'completed')
      `,
        [ideaId, userId],
      );

      // Create sections
      const modelResult = await client.query(
        `
        SELECT id FROM model_instances WHERE idea_id = $1
      `,
        [ideaId],
      );
      const modelId = modelResult.rows[0].id;

      await client.query(
        `
        INSERT INTO model_sections (model_instance_id, section_name, is_completed)
        VALUES
        ($1, 'Section 1', true),
        ($1, 'Section 2', false)
      `,
        [modelId],
      );

      // Test completion percentage calculation
      const result = await client.query(
        `
        SELECT calculate_completion_percentage($1) as percentage
      `,
        [ideaId],
      );

      expect(result.rows[0].percentage).toBe(50);
    });
  });

  it("should cast vote and update ratings", async () => {
    await withTransaction(pool, async (client) => {
      const userId1 = await createTestUser(client);
      const userId2 = await createTestUser(client);
      const ideaId = await createTestIdea(client, userId1);

      // Cast vote
      await client.query(`SELECT cast_vote($1, $2, $3)`, [ideaId, userId2, 4]);

      // Check vote was recorded
      const voteResult = await client.query(
        `
        SELECT rating FROM votes WHERE idea_id = $1 AND user_id = $2
      `,
        [ideaId, userId2],
      );
      expect(voteResult.rows[0].rating).toBe(4);

      // Check rating was updated
      const ideaResult = await client.query(
        `
        SELECT rating FROM ideas WHERE id = $1
      `,
        [ideaId],
      );
      expect(ideaResult.rows[0].rating).toBe(4.0);
    });
  });

  it("should validate user permissions", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);
      const ideaId = await createTestIdea(client, userId);

      // Test permission check
      const result = await client.query(
        `
        SELECT check_user_permission($1, $2, 'edit')
      `,
        [userId, ideaId],
      );

      expect(result.rows[0].check_user_permission).toBe(true);
    });
  });
});
