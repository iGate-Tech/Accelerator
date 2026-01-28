import { v4 as uuidv4 } from 'uuid';
import { dbInstance } from './core.js';
import { _seedPackages } from './packages.js';

// Seeding and session management functions
export async function _seedSampleNotifications({ userId }) {
  try {
    // Ensure database is initialized before querying
    if (!dbInstance) {
      const { ensureDatabaseReady } = await import('./core.js');
      await ensureDatabaseReady();
    }

    const existingNotifications = await dbInstance.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
      [userId]
    );
    if (existingNotifications.rows[0].count > 0) {
      return { message: 'User already has notifications' };
    }

    const sampleNotifications = [
      {
        type: 'system',
        title: 'Welcome to Accelerator Platform',
        message:
          'Your account has been successfully created. Complete your profile to unlock all features.',
        created_at: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        type: 'credits',
        title: 'Welcome Credits Added',
        message: "You've received 50 free AI credits to explore our platform.",
        created_at: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        type: 'system',
        title: 'Account Verification Complete',
        message: 'Your email has been verified.',
        created_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        type: 'update',
        title: 'Platform Update',
        message: 'Enhanced AI models available.',
        created_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        type: 'system',
        title: 'Getting Started Guide',
        message: 'Check out our guide.',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const notification of sampleNotifications) {
      await dbInstance.query(
        'INSERT INTO notifications (id, user_id, type, title, message, read, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [
          uuidv4(),
          userId,
          notification.type,
          notification.title,
          notification.message,
          0,
          notification.created_at,
          new Date().toISOString(),
          new Date().toISOString(),
          'local',
          null,
          1,
        ]
      );
    }

    return { message: 'Sample notifications seeded successfully' };
  } catch (err) {
    console.debug('Error creating sample notifications:', err.message);
    throw err;
  }
}

export async function _seedInitialData() {
  try {
    // Seed packages if not already seeded
    await _seedPackages();
    return { success: true };
  } catch (error) {
    console.error('Error seeding initial data:', error);
    throw error;
  }
}

export async function _isSeeded() {
  try {
    // Ensure database is initialized before querying
    if (!dbInstance) {
      const { ensureDatabaseReady } = await import('./core.js');
      await ensureDatabaseReady();
    }

    const packages = await dbInstance.query(
      'SELECT COUNT(*) as count FROM packages'
    );
    return packages.rows[0].count > 0;
  } catch (err) {
    console.error('Error checking if seeded:', err);
    return false;
  }
}

export async function _createSession({ userId, token, expiresAt }) {
  try {
    // Ensure database is initialized before querying
    if (!dbInstance) {
      const { ensureDatabaseReady } = await import('./core.js');
      await ensureDatabaseReady();
    }

    const id = uuidv4();
    const res = await dbInstance.query(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [
        id,
        userId,
        token,
        expiresAt,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        'local',
        null,
        1,
      ]
    );
    return res.rows[0];
  } catch (err) {
    console.debug('Error creating session:', err);
    throw err;
  }
}

export async function _getSessionByToken({ token }) {
  try {
    // Ensure database is initialized before querying
    if (!dbInstance) {
      const { ensureDatabaseReady } = await import('./core.js');
      await ensureDatabaseReady();
    }

    const res = await dbInstance.query(
      'SELECT * FROM sessions WHERE token = $1',
      [token]
    );
    return res.rows[0];
  } catch (err) {
    console.debug('Error getting session by token:', err);
    throw err;
  }
}

export async function _deleteSession({ token }) {
  // Ensure database is initialized before querying
  if (!dbInstance) {
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();
  }

  await dbInstance.query('DELETE FROM sessions WHERE token = $1', [token]);
}

export async function _deleteExpiredSessions() {
  // Ensure database is initialized before querying
  if (!dbInstance) {
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();
  }

  await dbInstance.query('DELETE FROM sessions WHERE expires_at < $1', [
    new Date().toISOString(),
  ]);
}
