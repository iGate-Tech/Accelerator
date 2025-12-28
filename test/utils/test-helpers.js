import { v4 as uuidv4 } from "uuid";

export const createTestUser = async (client, overrides = {}) => {
  const userId = uuidv4();
  await client.query(
    `
    INSERT INTO auth.users (id, email)
    VALUES ($1, $2)
  `,
    [userId, overrides.email || `test-${userId}@example.com`],
  );

  await client.query(
    `
    INSERT INTO profiles (user_id, name, credit_balance)
    VALUES ($1, $2, $3)
  `,
    [userId, overrides.name || "Test User", overrides.credits || 1000],
  );

  return userId;
};

export const createTestIdea = async (client, userId, overrides = {}) => {
  const ideaId = uuidv4();
  await client.query(
    `
    INSERT INTO ideas (id, user_id, title, description, privacy)
    VALUES ($1, $2, $3, $4, $5)
  `,
    [
      ideaId,
      userId,
      overrides.title || "Test Idea",
      overrides.description || "Test description",
      overrides.privacy || "public",
    ],
  );
  return ideaId;
};

export const expectDatabaseError = async (promise, errorCode) => {
  try {
    await promise;
    throw new Error("Expected database error but none was thrown");
  } catch (error) {
    if (error.code !== errorCode) {
      throw new Error(`Expected error code ${errorCode}, got ${error.code}`);
    }
  }
};
