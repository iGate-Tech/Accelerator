import { v4 as uuidv4 } from 'uuid';
import { dbInstance, getPg } from './core.js';

// Credit and billing management functions
export async function _addCreditTransaction({ userId, type, amount, description }) {
  try {
    await getPg();
    if (!dbInstance) {
      console.debug('Database not initialized, transaction saved locally');
      return { id: uuidv4(), user_id: userId, type, amount, description, balance_after: amount, date: new Date().toISOString() };
    }
    
    amount = parseFloat(amount);
    const balanceResult = await dbInstance.query('SELECT SUM(amount) as balance FROM credits WHERE user_id = $1', [userId]);
    const currentBalance = parseFloat(balanceResult.rows[0]?.balance || 0);
    const balance_after = currentBalance + amount;
    const id = uuidv4();
    await dbInstance.query(
      'INSERT INTO credits (id, user_id, type, amount, description, balance_after, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
      [id, userId, type, amount, description, balance_after, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
    );
    return { id, user_id: userId, type, amount, description, balance_after, date: new Date().toISOString() };
  } catch (err) {
    console.error('Error adding credit transaction:', err);
    throw err;
  }
}

export async function _getUserCredits({ userId }) {
  try {
    await getPg();
    if (!dbInstance) return [];
    const result = await dbInstance.query('SELECT * FROM credits WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  } catch (err) {
    console.error('Error getting user credits:', err);
    return [];
  }
}

export async function _getCreditTransactions({ userId }) {
  try {
    await getPg();
    if (!dbInstance) return [];
    const result = await dbInstance.query('SELECT * FROM credits WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  } catch (err) {
    console.error('Error getting credit transactions:', err);
    return [];
  }
}

export async function _getCreditBalance({ userId }) {
  try {
    await getPg();
    if (!dbInstance) {
      console.debug('Database not initialized, returning null balance');
      return null;
    }
    const result = await dbInstance.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE user_id = $1',
      [userId]
    );
    return parseFloat(result.rows[0]?.balance || 0);
  } catch (err) {
    console.error('Error getting credit balance:', err);
    return null;
  }
}

export async function _getUserCreditBalance({ userId }) {
  try {
    await getPg();
    if (!dbInstance) return null;
    const result = await dbInstance.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE user_id = $1',
      [userId]
    );
    return parseFloat(result.rows[0]?.balance || 0);
  } catch (err) {
    console.error('Error getting user credit balance:', err);
    return null;
  }
}

export async function _consumeCredits({ userId, amount, description }) {
  try {
    await _addCreditTransaction({ userId, type: 'usage', amount: -amount, description });
    return true;
  } catch (err) {
    console.error('Error consuming credits:', err);
    throw err;
  }
}

export async function _addBillingRecord({ userId, type, amount, description, dueDate = null }) {
  try {
    const id = uuidv4();
      const res = await dbInstance.query(
        'INSERT INTO billing (id, user_id, type, amount, status, description, due_date, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id',
          [id, userId, type, amount, 'pending', description, dueDate, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
      );
    return res.rows[0];
  } catch (err) {
    console.debug('Error adding billing record:', err);
    throw err;
  }
}

export async function _getUserBilling({ userId }) {
  try {
     const res = await dbInstance.query(
       'SELECT * FROM billing WHERE user_id = $1 ORDER BY last_modified DESC',
       [userId]
     );
    return res.rows;
  } catch (err) {
    console.debug('Error getting user billing:', err);
    return [];
  }
}

export async function _updateBillingStatus({ id, status }) {
  try {
     await dbInstance.query('UPDATE billing SET status = $1, last_modified = $2 WHERE id = $3', [status, new Date().toISOString(), id]);
    return { success: true };
  } catch (err) {
    console.debug('Error updating billing status:', err);
    throw err;
  }
}