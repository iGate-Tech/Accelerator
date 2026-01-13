import { v4 as uuidv4 } from 'uuid';
import { dbInstance, updateEntity } from './db-core.js';

// User management functions
export async function _createUser({ email, passwordHash, profile = {}, userId = null }) {
  if (!email) {
    throw new Error('Email is required for user creation');
  }
  try {
    const id = userId || uuidv4();
    const query = "INSERT INTO users (id, email, password_hash, preferences, created_at, last_modified, synced_at, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
    const params = [
      id,
      email,
      passwordHash || '',
      JSON.stringify(profile || {}),
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      'local',
      null,
      1
    ];
    console.debug('Executing createUser query:', query, 'params:', params);
    const res = await dbInstance.query(query, params);
    return { id, email };
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
}

export async function _getUserById({ id }) {
  if (!id) {
    console.error('getUserById: id parameter is required');
    return null;
  }
  try {
    const res = await dbInstance.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
  } catch (err) {
    console.error('Error getting user by id:', err);
    return null;
  }
}

export async function _getUserByEmail({ email }) {
  try {
    const res = await dbInstance.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  } catch (err) {
    console.error('Error getting user by email:', err);
    return null;
  }
}

export async function _updateUser({ id, updates }) {
  try {
    const processedUpdates = { ...updates };
    if (updates.profile !== undefined) {
      processedUpdates.profile = JSON.stringify(updates.profile);
    }
    const result = await updateEntity({ table: 'users', idField: 'id', id, updates: processedUpdates, options: {
      alwaysUpdate: { 'updated_at': 'CURRENT_TIMESTAMP' }
    }});
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (err) {
    console.error('Error updating user:', err);
    throw err;
  }
}

export async function _deleteUser({ id }) {
  try {
    await dbInstance.query('DELETE FROM users WHERE id = $1', [id]);
    return { success: true };
  } catch (err) {
    console.error('Error deleting user:', err);
    throw err;
  }
}

export async function _createUserProfile({ userId, profileData = {} }) {
  try {
      const res = await dbInstance.query(
        `INSERT INTO profiles
        (user_id, avatar, bio, preferences, synced_at, last_modified, sync_status, deleted_at, version)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (user_id) DO NOTHING RETURNING *`,
          [
            userId,
            String(profileData.avatar || '/src/assets/avatar.png'),
            String(profileData.bio || ''),
            JSON.stringify(profileData.preferences || {
              notifications: { email: true, browser: false, projectUpdates: true },
              privacy: { profileVisibility: 'private', dataSharing: false }
            }),
            new Date().toISOString(),
            new Date().toISOString(),
            'local',
            null,
            1
          ]
      );
    return res.rows[0];
  } catch (err) {
    console.error('Error creating user profile:', err);
    throw err;
  }
}

export async function _getUserProfile({ userId }) {
  try {
    const res = await dbInstance.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error getting user profile:', err);
    return null;
  }
}