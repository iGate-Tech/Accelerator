import { v4 as uuidv4 } from 'uuid';
import { dbInstance, ensureDatabaseReady } from './core.js';

// Activity and notification management functions
export async function _logActivity({ userId, actionType, entityType, entityId, description, metadata = {} }) {
  try {
    const id = uuidv4();
      const res = await dbInstance.query(
        'INSERT INTO user_activities (id, user_id, action_type, entity_type, entity_id, description, metadata, ip_address, user_agent, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
        [id, userId, actionType, entityType, entityId, description, JSON.stringify(metadata), null, null, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
      );
     return res.rows[0];
  } catch (err) {
    console.error('Error logging activity:', err);
    throw err;
  }
}

export async function _getUserActivities({ userId, limit = 50, offset = 0 }) {
  try {
      const res = await dbInstance.query(
        'SELECT * FROM user_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );
    return res.rows;
  } catch (err) {
    console.error('Error getting user activities:', err);
    return [];
  }
}

export async function _createNotification({ userId, type, title, message }) {
  try {
    const id = uuidv4();
    await dbInstance.query(
      `INSERT INTO notifications (id,user_id,type,title,message,read,created_at,synced_at,last_modified,sync_status,deleted_at,version)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id, userId, type, title, message, 0, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
    );
    return { id };
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
}

export async function _getUserNotifications({ userId }) {
  if (!dbInstance) {
    console.debug('Database not initialized, returning empty notifications');
    return [];
  }
  try {
    const res = await dbInstance.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

export async function _markNotificationRead({ notificationId, userId }) {
  await dbInstance.query('UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2', [notificationId, userId]);
}