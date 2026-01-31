import { v4 as uuidv4 } from 'uuid';
import { getDbInstance } from './core.js';
import { updateEntity } from './operations.js';

// User management functions
export async function _createUser({
  email,
  passwordHash,
  profile = {},
  userId = null,
}) {
  if (!dbInstance) {
    return { id: userId || 'local-user', email };
  }
  if (!email) {
    throw new Error('Email is required for user creation');
  }
  try {
    // Import security functions dynamically to avoid circular dependencies
    const { validateAndSanitizeDbInput, isValidEmail } =
      await import('../auth/security.js');

    // Validate email
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Sanitize email for database
    const emailValidation = validateAndSanitizeDbInput(email, 'email');
    if (!emailValidation.valid) {
      throw new Error(`Email validation failed: ${emailValidation.reason}`);
    }

    const id = userId || uuidv4();
    const query =
      'INSERT INTO users (id, email, password_hash, preferences, created_at, last_modified, synced_at, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
    const params = [
      id,
      emailValidation.sanitized,
      passwordHash || '',
      JSON.stringify(profile || {}),
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      'local',
      null,
      1,
    ];
    const db = await getDbInstance();
    const res = await db.query(query, params);
    return { id, email };
  } catch (err) {
    console.debug('Error creating user:', err.message);
    return { id: userId || 'local-user', email };
  }
}

export async function _getUserById({ id }) {
  if (!id) {
    return null;
  }
  try {
    const db = await getDbInstance();
    const res = await db.query('SELECT * FROM users WHERE id = $1', [
      id,
    ]);
    return res.rows[0];
  } catch (err) {
    console.debug('Error getting user by id:', err.message);
    return null;
  }
}

export async function _getUserByEmail({ email }) {
  if (!dbInstance) return null;
  try {
    const res = await dbInstance.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    return res.rows[0];
  } catch (err) {
    console.debug('Error getting user by email:', err.message);
    return null;
  }
}

export async function _updateUser({ id, updates }) {
  if (!dbInstance) return null;
  try {
    const processedUpdates = { ...updates };
    if (updates.profile !== undefined) {
      processedUpdates.profile = JSON.stringify(updates.profile);
    }
    const result = await updateEntity({
      table: 'users',
      idField: 'id',
      id,
      updates: processedUpdates,
      options: {
        alwaysUpdate: { updated_at: 'CURRENT_TIMESTAMP' },
      },
    });
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (err) {
    console.debug('Error updating user:', err.message);
    return null;
  }
}

export async function _deleteUser({ id }) {
  if (!dbInstance) return { success: true };
  try {
    await dbInstance.query('DELETE FROM users WHERE id = $1', [id]);
    return { success: true };
  } catch (err) {
    console.debug('Error deleting user:', err.message);
    return { success: true };
  }
}

export async function _createUserProfile({ userId, profileData = {} }) {
  if (!dbInstance) {
    return { user_id: userId, ...profileData };
  }
  try {
    const id = uuidv4();
    const res = await dbInstance.query(
      `INSERT INTO profiles
      (id, user_id, name, email, avatar, bio, preferences, synced_at, last_modified, sync_status, deleted_at, version)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (user_id) DO NOTHING RETURNING *`,
      [
        id,
        userId,
        String(profileData.name || ''),
        String(profileData.email || ''),
        String(profileData.avatar || ''),
        String(profileData.bio || ''),
        JSON.stringify(
          profileData.preferences || {
            notifications: {
              email: true,
              browser: false,
              projectUpdates: true,
            },
            privacy: { profileVisibility: 'private', dataSharing: false },
          }
        ),
        new Date().toISOString(),
        new Date().toISOString(),
        'local',
        null,
        1,
      ]
    );
    return res.rows[0] || { id, user_id: userId, ...profileData };
  } catch (err) {
    console.debug('Error creating user profile:', err.message);
    return { user_id: userId, ...profileData };
  }
}

export async function _getUserProfile({ userId }) {
  if (!dbInstance) return null;
  try {
    const res = await dbInstance.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.debug('Error getting user profile:', err.message);
    return null;
  }
}

export async function _updateUserProfile({ userId, updates }) {
  if (!dbInstance) return null;
  try {
    const allowedFields = ['avatar', 'bio', 'name', 'email', 'preferences'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key === 'preferences' ? 'preferences' : key;
      if (allowedFields.includes(dbKey)) {
        setClauses.push(`${dbKey} = $${paramIndex}`);
        values.push(dbKey === 'preferences' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return null;
    }

    setClauses.push(`last_modified = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;

    setClauses.push(`synced_at = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;

    values.push(userId);

    const query = `
      UPDATE profiles 
      SET ${setClauses.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const res = await dbInstance.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.debug('Error updating user profile:', err.message);
    return null;
  }
}

export async function _updateUserPassword({ userId, newPasswordHash }) {
  if (!dbInstance) return null;
  try {
    const res = await dbInstance.query(
      'UPDATE users SET password_hash = $1, last_modified = $2 WHERE id = $3 RETURNING *',
      [newPasswordHash, new Date().toISOString(), userId]
    );
    return res.rows[0];
  } catch (err) {
    console.debug('Error updating user password:', err.message);
    return null;
  }
}
