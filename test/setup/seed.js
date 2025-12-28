export const seedTestData = async (client) => {
  // Create test user
  const userResult = await client.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('11111111-1111-1111-1111-111111111111', 'test@example.com')
    ON CONFLICT (id) DO NOTHING
  `);

  // Create test profile
  await client.query(`
    INSERT INTO profiles (user_id, name, credit_balance)
    VALUES ('11111111-1111-1111-1111-111111111111', 'Test User', 1000)
    ON CONFLICT (user_id) DO NOTHING
  `);

  // Create test idea
  await client.query(`
    INSERT INTO ideas (id, user_id, title, description, privacy)
    VALUES (
      '22222222-2222-2222-2222-222222222222',
      '11111111-1111-1111-1111-111111111111',
      'Test Idea',
      'A test business idea',
      'public'
    )
    ON CONFLICT (id) DO NOTHING
  `);
};
