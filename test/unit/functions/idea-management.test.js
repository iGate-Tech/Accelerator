import { describe, it, expect } from "vitest";
import { createTestDb, withTransaction } from "../../setup/database.js";
import { createTestUser, createTestIdea } from "../../utils/test-helpers.js";

const pool = createTestDb();

describe("Idea Management", () => {
  it("should create idea with validation", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);

      const result = await client.query(
        `
        SELECT manage_idea($1, 'create', '{"title": "New Idea", "description": "Description"}')
      `,
        [userId],
      );

      expect(result.rows[0].manage_idea.success).toBe(true);

      // Check idea was created
      const ideaResult = await client.query(
        `
        SELECT title, description FROM ideas WHERE user_id = $1
      `,
        [userId],
      );
      expect(ideaResult.rows[0].title).toBe("New Idea");
    });
  });

  it("should reject idea creation without title", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);

      const result = await client.query(
        `
        SELECT manage_idea($1, 'create', '{"description": "No title"}')
      `,
        [userId],
      );

      expect(result.rows[0].manage_idea.success).toBe(false);
      expect(result.rows[0].manage_idea.error).toContain("Title is required");
    });
  });

  it("should update idea successfully", async () => {
    await withTransaction(pool, async (client) => {
      const userId = await createTestUser(client);
      const ideaId = await createTestIdea(client, userId);

      const result = await client.query(
        `
        SELECT manage_idea($1, 'update', '{"id": $2, "title": "Updated Title"}')
      `,
        [userId, ideaId],
      );

      expect(result.rows[0].manage_idea.success).toBe(true);

      // Check idea was updated
      const ideaResult = await client.query(
        `
        SELECT title FROM ideas WHERE id = $1
      `,
        [ideaId],
      );
      expect(ideaResult.rows[0].title).toBe("Updated Title");
    });
  });
});
