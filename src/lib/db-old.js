import { toastManager } from './feedback';

import { PGlite } from '@electric-sql/pglite';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

// PGLite singleton instance
let dbInstance = null;
let dbReady = false;

// Local user management for PGLite only
const getCurrentUser = async () => {
  return { id: 1 };
};

// Initialize PGLite database
async function initDatabase() {
  if (dbReady) return dbInstance;

  const options = { dataDir: 'idb://accelerator-db-v22' };

  // Test IndexedDB access before attempting PGLite
  let indexedDBAvailable = false;
  try {
    console.log('Testing IndexedDB access...');
    const testDB = indexedDB.open('test-db-access', 1);
    await new Promise((resolve, reject) => {
      testDB.onsuccess = () => {
        testDB.result.close();
        indexedDB.deleteDatabase('test-db-access');
        console.log('IndexedDB access test: PASSED');
        indexedDBAvailable = true;
        resolve();
      };
      testDB.onerror = () => {
        console.log('IndexedDB access test: FAILED');
        reject(new Error('IndexedDB not accessible'));
      };
      testDB.onblocked = () => {
        console.log('IndexedDB access test: BLOCKED');
        reject(new Error('IndexedDB blocked'));
      };
    });
  } catch (testError) {
    console.warn('IndexedDB test failed:', testError.message);
  }

  try {
    if (indexedDBAvailable) {
      console.log('Creating PGLite database instance with persistence...');
      dbInstance = new PGlite(options.dataDir, { relaxedDurability: true });
      console.log('PGLite database instance created successfully');
      await createSchema();
    } else {
      throw new Error('IndexedDB not available');
    }
  } catch (error) {
    console.error('Failed to initialize database with persistence:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    console.warn('IndexedDB not available, falling back to in-memory database');
    try {
      console.log('Creating PGLite database instance in-memory...');
      dbInstance = new PGlite();
      console.log('PGLite in-memory database instance created successfully');
      await createSchema();
    } catch (fallbackError) {
      console.error('Failed to initialize in-memory database:', fallbackError);
      throw fallbackError;
    }
  }

  dbReady = true;
  console.log(`Database initialized successfully (${indexedDBAvailable ? 'persistent' : 'in-memory'})`);
  return dbInstance;
}

// Create database schema
async function createSchema() {
  console.log('Creating database schema...');
  // Create db_version table first
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY
    );
  `);
  // Create tables one by one
  console.log('Creating users table...');
  await dbInstance.exec("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT, avatar TEXT DEFAULT '/src/assets/avatar.png', bio TEXT, preferences TEXT, synced_at TEXT, last_modified TEXT, sync_status TEXT DEFAULT 'local', deleted_at TEXT, version INTEGER DEFAULT 1)");
  console.log('Users table created');
  await dbInstance.exec(`
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_step TEXT,
  completed_steps INTEGER,
  step_name TEXT,
  current_model TEXT,
  current_section TEXT,
  ui_progress REAL,
  ui_message TEXT,
  ui_status TEXT,
  total_credits REAL DEFAULT 0,
  consumed_credits REAL DEFAULT 0,
  total_time REAL DEFAULT 0,
  consumed_time REAL DEFAULT 0,
  total_steps INTEGER,
  public INTEGER DEFAULT 0,
  current_prompt TEXT,
  llm_response TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  content TEXT,
  prompt TEXT,
  llm_response TEXT,
  model TEXT,
  section TEXT,
  step_name TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Project Groups table
CREATE TABLE IF NOT EXISTS project_groups (
  project_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1,
  PRIMARY KEY (project_id, group_id)
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  balance_after REAL,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  due_date TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  credits_included INTEGER NOT NULL,
  features TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TEXT DEFAULT CURRENT_TIMESTAMP,
  end_date TEXT,
  auto_renew INTEGER DEFAULT 1,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  avatar TEXT,
  bio TEXT,
  preferences TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Portfolio Collaborators table
CREATE TABLE IF NOT EXISTS portfolio_collaborators (
  id TEXT PRIMARY KEY,
  portfolio_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Portfolio Invitations table
CREATE TABLE IF NOT EXISTS portfolio_invitations (
  id TEXT PRIMARY KEY,
  portfolio_id INTEGER NOT NULL,
  inviter_id TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  status TEXT DEFAULT 'pending',
  message TEXT,
  invited_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  responded_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- User Activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Project Votes table
CREATE TABLE IF NOT EXISTS project_votes (
  id TEXT PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
  `);
  console.log('Database schema created successfully');
  console.debug('Database schema initialized successfully');
}

// Database operation functions
export async function query(sql, params = []) {
  const db = await getPg();
  const result = await db.query(sql, params);
  return { rows: result.rows, rowCount: result.rowCount };
}

export async function exec(sql) {
  const db = await getPg();
  await db.exec(sql);
  return { success: true };
}

export async function transaction(operations) {
  const db = await getPg();
  const results = [];
  await db.transaction(async (tx) => {
    for (const op of operations) {
      const res = await tx.query(op.sql, op.params || []);
      results.push({ rows: res.rows, rowCount: res.rowCount });
    }
  });
  return { results };
}

export async function close() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    dbReady = false;
  }
  return { success: true };
}

export async function getEntities({ table, selectFields = '*', whereClause = '', orderBy = '', params = [] }) {
  try {
    const query = `SELECT ${selectFields} FROM ${table} ${whereClause} ${orderBy}`;
    const res = await dbInstance.query(query, params);
    return res;
  } catch (err) {
    console.error(`DB error in getEntities for ${table}:`, err);
    return [];
  }
}

export async function updateEntity({ table, idField, id, updates, options = {} }) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (options.beforeUpdate) options.beforeUpdate(updates);

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const dbField = options.fieldMappings?.[key] || key;
      const processedValue = (typeof value === 'object' && value !== null && !(value instanceof Date)) ? JSON.stringify(value) : (value instanceof Date ? value.toISOString() : value);
      fields.push(`${dbField} = $${paramIndex}`);
      values.push(processedValue);
      paramIndex++;
    }
  }

  if (!updates.last_modified) fields.push(`last_modified = CURRENT_TIMESTAMP`);
  if (!updates.sync_status) fields.push(`sync_status = 'local'`);

  if (options.alwaysUpdate) {
    for (const [field, value] of Object.entries(options.alwaysUpdate)) {
      if (!updates.hasOwnProperty(field)) fields.push(`${field} = ${value}`);
    }
  }

  if (!fields.length) return { success: false, error: 'No fields to update' };

  values.push(id);
  const query = `UPDATE ${table} SET ${fields.join(', ')} WHERE ${Array.isArray(idField) ? idField.map((f,i)=>`${f}=$${paramIndex+i}`).join(' AND ') : `${idField}=$${paramIndex}`}`;

  try {
    const res = await dbInstance.query(query, values);
    return { success: true, data: res.rows[0] };
  } catch (err) {
    console.error(`DB error in updateEntity for ${table}:`, err);
    return { success: false, error: err.message };
  }
}

// Database operation functions (migrated from worker)
export async function createSchema() {
  console.log('Creating database schema...');
  // Create db_version table first
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY
    );
  `);
  // Create tables one by one
  console.log('Creating users table...');
  await dbInstance.exec("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT, avatar TEXT DEFAULT '/src/assets/avatar.png', bio TEXT, preferences TEXT, synced_at TEXT, last_modified TEXT, sync_status TEXT DEFAULT 'local', deleted_at TEXT, version INTEGER DEFAULT 1)");
  console.log('Users table created');
  await dbInstance.exec(`
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_step TEXT,
  completed_steps INTEGER,
  step_name TEXT,
  current_model TEXT,
  current_section TEXT,
  ui_progress REAL,
  ui_message TEXT,
  ui_status TEXT,
  total_credits REAL DEFAULT 0,
  consumed_credits REAL DEFAULT 0,
  total_time REAL DEFAULT 0,
  consumed_time REAL DEFAULT 0,
  total_steps INTEGER,
  public INTEGER DEFAULT 0,
  current_prompt TEXT,
  llm_response TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  content TEXT,
  prompt TEXT,
  llm_response TEXT,
  model TEXT,
  section TEXT,
  step_name TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Project Groups table
CREATE TABLE IF NOT EXISTS project_groups (
  project_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1,
  PRIMARY KEY (project_id, group_id)
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  balance_after REAL,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  due_date TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  credits_included INTEGER NOT NULL,
  features TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TEXT DEFAULT CURRENT_TIMESTAMP,
  end_date TEXT,
  auto_renew INTEGER DEFAULT 1,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  avatar TEXT,
  bio TEXT,
  preferences TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Portfolio Collaborators table
CREATE TABLE IF NOT EXISTS portfolio_collaborators (
  id TEXT PRIMARY KEY,
  portfolio_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Portfolio Invitations table
CREATE TABLE IF NOT EXISTS portfolio_invitations (
  id TEXT PRIMARY KEY,
  portfolio_id INTEGER NOT NULL,
  inviter_id TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  status TEXT DEFAULT 'pending',
  message TEXT,
  invited_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  responded_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- User Activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Project Votes table
CREATE TABLE IF NOT EXISTS project_votes (
  id TEXT PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
  `);
  console.log('Database schema created successfully');
  console.debug('Database schema initialized successfully');
}

export async function initDatabase(options = {}) {
  console.log('initDatabase called with options:', options);

  // Always ensure schema exists (CREATE IF NOT EXISTS will handle duplicates)
  console.debug('[DB Worker] Ensuring database schema exists...');

  let usePersistence = true;

  // Test IndexedDB access before attempting PGLite
  let indexedDBAvailable = false;
  try {
    console.log('Testing IndexedDB access...');
    const testDB = indexedDB.open('test-db-access', 1);
    await new Promise((resolve, reject) => {
      testDB.onsuccess = () => {
        testDB.result.close();
        indexedDB.deleteDatabase('test-db-access');
        console.log('IndexedDB access test: PASSED');
        indexedDBAvailable = true;
        resolve();
      };
      testDB.onerror = () => {
        console.log('IndexedDB access test: FAILED');
        reject(new Error('IndexedDB not accessible'));
      };
      testDB.onblocked = () => {
        console.log('IndexedDB access test: BLOCKED');
        reject(new Error('IndexedDB blocked'));
      };
    });
  } catch (testError) {
    console.warn('IndexedDB test failed:', testError.message);
  }

  try {
    if (indexedDBAvailable) {
      console.log('Creating PGLite database instance with persistence...');
      dbInstance = new PGlite(options.dataDir, { relaxedDurability: true });
      console.log('PGLite database instance created successfully');
      await createSchema();
      usePersistence = true;
    } else {
      throw new Error('IndexedDB not available');
    }
  } catch (error) {
    console.error('Failed to initialize database with persistence:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    console.warn('IndexedDB not available, falling back to in-memory database');
    usePersistence = false;
    try {
      console.log('Creating PGLite database instance in-memory...');
      dbInstance = new PGlite();
      console.log('PGLite in-memory database instance created successfully');
      await createSchema();
    } catch (fallbackError) {
      console.error('Failed to initialize in-memory database:', fallbackError);
      throw fallbackError;
    }
  }

  console.log(`Database initialized successfully (${usePersistence ? 'persistent' : 'in-memory'})`);
  return { success: true, persistent: usePersistence };
}

export async function getEntities({ table, selectFields = '*', whereClause = '', orderBy = '', params = [] }) {
  try {
    const query = `SELECT ${selectFields} FROM ${table} ${whereClause} ${orderBy}`;
    const res = await dbInstance.query(query, params);
    return res;
  } catch (err) {
    console.error(`DB error in getEntities for ${table}:`, err);
    return [];
  }
}

export async function createUser({ email, passwordHash, profile = {}, userId = null }) {
  if (!email) {
    throw new Error('Email is required for user creation');
  }
  try {
    const id = userId || uuidv4();
    const query = "INSERT INTO users (id, email, password_hash, profile, created_at, last_modified, synced_at, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
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

export async function _createProject({ project, userId }) {
  try {
    const id = uuidv4();
      const totalSteps = parseInt(project.totalSteps, 10);
      const completedSteps = parseInt(project.completedSteps, 10);
      const consumedCredits = parseInt(project.consumedCredits, 10);
      const totalCredits = parseInt(project.totalCredits, 10);
       const values = [
         id,
         project.name,
         project.description,
         userId,
         new Date().toISOString(),
         new Date().toISOString(),
         new Date().toISOString(),
         'local',
         null,
         1,
         project.public ? 1 : 0,
         project.currentModel || null,
         isNaN(totalSteps) ? 51 : totalSteps,
         isNaN(completedSteps) ? 0 : completedSteps,
         isNaN(consumedCredits) ? 0 : consumedCredits,
         isNaN(totalCredits) ? 100 : totalCredits,
         project.uiStatus || 'idle'
       ];
      console.log('Insert values:', values);
        const res = await dbInstance.query(`
          INSERT INTO projects (id, name, description, user_id, created_at, last_modified, synced_at, sync_status, deleted_at, version, public, current_model, total_steps, completed_steps, consumed_credits, total_credits, ui_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING *
        `, values);
     return res.rows[0];
  } catch (err) {
    console.error('DB error in addTask:', err);
    throw err;
  }
}

export async function _getProjectById({ id }) {
  try {
    const result = await dbInstance.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error getting project by id:', err);
    return null;
  }
}

export async function _updateProject({ id, updates }) {
  try {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    values.push(id);
    await dbInstance.query(`UPDATE projects SET ${setClause}, last_modified = CURRENT_TIMESTAMP WHERE id = $${values.length}`, values);
    return { success: true };
  } catch (err) {
    console.error('Error updating project:', err);
    throw err;
  }
}

export async function _deleteProject({ id }) {
  try {
    await dbInstance.query('DELETE FROM projects WHERE id = $1', [id]);
    return { success: true };
  } catch (err) {
    console.error('Error deleting project:', err);
    throw err;
  }
}

export async function deleteAllProjects({ userId }) {
  try {
    await dbInstance.query('DELETE FROM projects WHERE user_id = $1', [userId]);
    return { success: true };
  } catch (err) {
    console.error('Error deleting all projects:', err);
    throw err;
  }
}

export async function toggleProjectPublic({ id }) {
  try {
    await dbInstance.query('UPDATE projects SET public = NOT public WHERE id = $1', [id]);
    return { success: true };
  } catch (err) {
    console.error('Error toggling project public:', err);
    throw err;
  }
}

export async function getTasks({ projectId }) {
  try {
    const result = await dbInstance.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
    return result.rows;
  } catch (err) {
    console.error('Error getting tasks:', err);
    return [];
  }
}

export async function _addTask({ task }) {
  try {
    const id = uuidv4();
    await dbInstance.query(`
      INSERT INTO tasks (id, project_id, content, prompt, llm_response, model, section, step_name, created_at, last_modified, synced_at, sync_status, deleted_at, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      id,
      task.projectId,
      task.content || null,
      task.prompt || null,
      task.llmResponse || null,
      task.model || null,
      task.section || null,
      task.stepName || null,
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      'local',
      null,
      1
    ]);
    return { success: true };
  } catch (err) {
    console.error('Error adding task:', err);
    throw err;
  }
}

export async function getGroups({ userId = null }) {
  const whereClause = userId ? 'WHERE user_id = $1' : '';
  const params = userId ? [userId] : [];
  const query = `SELECT * FROM groups ${whereClause} ORDER BY created_at DESC`;
  const res = await dbInstance.query(query, params);
  return res.rows;
}

export async function getGroupById({ id }) {
  try {
    const res = await dbInstance.query('SELECT * FROM groups WHERE id = $1', [id]);
    return res.rows[0];
  } catch (err) {
    console.debug('Error loading group:', err);
    return null;
  }
}

export async function addGroup({ group, userId }) {
  try {
      const id = uuidv4();
      const res = await dbInstance.query(
        'INSERT INTO groups (id, user_id, name, description, color, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
        [id, userId, group.name, group.description || '', group.color || '#6366f1', group.createdAt || new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
      );
    return res.rows[0];
  } catch (err) {
    console.debug('Error adding group:', err);
    throw err;
  }
}

export async function updateGroup({ id, group }) {
  try {
    const result = await updateEntity({ table: 'groups', idField: 'id', id, updates: group });
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (err) {
    console.debug('Error updating group:', err);
    throw err;
  }
}

export async function deleteGroup({ id }) {
  try {
     await dbInstance.query('DELETE FROM project_groups WHERE group_id = $1', [id]);
     await dbInstance.query('DELETE FROM groups WHERE id = $1', [id]);
    return { success: true };
  } catch (err) {
    console.debug('Error deleting group:', err);
    throw err;
  }
}

export async function addProjectToGroup({ projectId, groupId }) {
  try {
     await dbInstance.query(
       'INSERT INTO project_groups (project_id, group_id, added_at) VALUES ($1, $2, $3) ON CONFLICT (project_id, group_id) DO NOTHING',
       [projectId, groupId, new Date().toISOString()]
     );
    return { success: true };
  } catch (err) {
    console.debug('Error adding project to group:', err);
    throw err;
  }
}

export async function removeProjectFromGroup({ projectId, groupId }) {
  try {
     await dbInstance.query('DELETE FROM project_groups WHERE project_id = $1 AND group_id = $2', [projectId, groupId]);
    return { success: true };
  } catch (err) {
    console.debug('Error removing project from group:', err);
    throw err;
  }
}

export async function getProjectsInGroup({ groupId }) {
  try {
     const res = await dbInstance.query(`
       SELECT p.*, pg.added_at as addedToGroupAt
       FROM projects p
       JOIN project_groups pg ON p.id = pg.project_id
       WHERE pg.group_id = $1
       ORDER BY pg.added_at DESC
     `, [groupId]);
    return res.rows;
  } catch (err) {
    console.debug('Error getting projects in group:', err);
    return [];
  }
}

export async function getUngroupedProjects({ userId = null }) {
  try {
    const result = await dbInstance.query(`
      SELECT p.* FROM projects p
      LEFT JOIN project_groups pg ON p.id = pg.project_id
      WHERE pg.group_id IS NULL AND p.user_id = $1::text
    `, [userId]);
    return result.rows;
  } catch (err) {
    console.error('Error getting ungrouped projects:', err);
    return [];
  }
}

export async function getProjects({ userId }) {
  try {
    const result = await dbInstance.query('SELECT * FROM projects WHERE user_id = $1::text ORDER BY created_at DESC', [userId]);
    return result.rows;
  } catch (err) {
    console.error('Error getting projects:', err);
    return [];
  }
}

export async function getGroupsWithProjects({ userId = null }) {
  try {
    const groups = await getGroups({ userId });
    const groupsWithProjects = await Promise.all(
      groups.map(async (group) => ({
        ...group,
        projects: await getProjectsInGroup({ groupId: group.id })
      }))
    );
    return groupsWithProjects;
  } catch (err) {
    console.debug('Error getting groups with projects:', err);
    return [];
  }
}

export async function getUserCredits({ userId }) {
  try {
    const result = await getEntities({ table: 'credits', selectFields: '*', whereClause: 'WHERE user_id = $1', orderBy: 'ORDER BY created_at DESC', params: [userId] });
    return result.rows;
  } catch (err) {
    console.error('Error getting user credits:', err);
    return [];
  }
}

export async function getCreditTransactions({ userId }) {
  try {
    const result = await getEntities({ table: 'credits', selectFields: '*', whereClause: 'WHERE user_id = $1', orderBy: 'ORDER BY created_at DESC', params: [userId] });
    return result.rows;
  } catch (err) {
    console.error('Error getting credit transactions:', err);
    return [];
  }
}

export async function getCreditBalance({ userId }) {
  try {
    const result = await dbInstance.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE user_id = $1',
      [userId]
    );
    return result.rows[0].balance || 0;
  } catch (err) {
    console.error('Error getting credit balance:', err);
    return 0;
  }
}

export async function getUserCreditBalance({ userId }) {
  try {
    const result = await dbInstance.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE user_id = $1',
      [userId]
    );
    return result.rows[0].balance || 0;
  } catch (err) {
    console.error('Error getting user credit balance:', err);
    return 0;
  }
}

export async function addCreditTransaction({ userId, type, amount, description }) {
  try {
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

export async function consumeCredits({ userId, amount, description }) {
  try {
    await addCreditTransaction({ userId, type: 'usage', amount: -amount, description });
    return true;
  } catch (err) {
    console.error('Error consuming credits:', err);
    throw err;
  }
}

export async function logActivity({ userId, actionType, entityType, entityId, description, metadata = {} }) {
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

export async function getUserActivities({ userId, limit = 50, offset = 0 }) {
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

export async function addBillingRecord({ userId, type, amount, description, dueDate = null }) {
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

export async function getUserBilling({ userId }) {
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

export async function updateBillingStatus({ id, status }) {
  try {
     await dbInstance.query('UPDATE billing SET status = $1, last_modified = $2 WHERE id = $3', [status, new Date().toISOString(), id]);
    return { success: true };
  } catch (err) {
    console.debug('Error updating billing status:', err);
    throw err;
  }
}

export async function createNotification({ userId, type, title, message }) {
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

export async function getUserNotifications({ userId }) {
  const res = await dbInstance.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return res.rows;
}

export async function markNotificationRead({ notificationId, userId }) {
  await dbInstance.query('UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2', [notificationId, userId]);
}

export async function updateUserSubscription({ userId, subscriptionId, updates }) {
  try {
     const result = await updateEntity({ table: 'user_subscriptions', idField: 'id', id: subscriptionId, updates });
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (err) {
    console.error('Error updating user subscription:', err);
    throw err;
  }
}

export async function changeUserSubscription({ userId, newPackageId, currentSubscription }) {
  try {
    // If there's a current subscription, update it or cancel it
    if (currentSubscription) {
       await updateEntity({ table: 'user_subscriptions', idField: 'id', id: currentSubscription.id, updates: {
         status: 'cancelled',
         cancelled_at: new Date().toISOString()
       } });
    }

    // Create new subscription
    const subscriptionData = {
      user_id: userId,
      package_id: newPackageId,
      status: 'active',
      subscribed_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      sync_status: 'local'
    };

    const result = await createUserSubscription({ userId, packageId: newPackageId, subscriptionData });
    return result;
  } catch (err) {
    console.error('Error changing user subscription:', err);
    throw err;
  }
}

export async function voteOnProject({ projectId, userId, voteType }) {
  try {
     const existingVote = await dbInstance.query(
       'SELECT id, vote_type FROM project_votes WHERE project_id = $1 AND user_id = $2',
       [projectId, userId]
     );
     if (existingVote.rows.length > 0) {
       const currentVote = existingVote.rows[0];
       if (currentVote.vote_type === voteType) {
         await dbInstance.query('DELETE FROM project_votes WHERE id = $1', [currentVote.id]);
         return { action: 'removed', voteType: null };
       } else {
         await dbInstance.query('UPDATE project_votes SET vote_type = $1 WHERE id = $2', [voteType, currentVote.id]);
         return { action: 'changed', voteType };
       }
     } else {
        await dbInstance.query(
          'INSERT INTO project_votes (project_id, user_id, vote_type, created_at) VALUES ($1, $2, $3, $4)',
          [projectId, userId, voteType, new Date().toISOString()]
        );
       return { action: 'added', voteType };
     }
  } catch (err) {
    console.debug('Error voting on project:', err);
    throw err;
  }
}

export async function getProjectVotes({ projectId }) {
  try {
     const res = await dbInstance.query(`
       SELECT vote_type, COUNT(*) as count
       FROM project_votes
       WHERE project_id = $1
       GROUP BY vote_type
     `, [projectId]);
    return res.rows;
  } catch (err) {
    console.debug('Error getting project votes:', err);
    return [];
  }
}

export async function getPublicProjectsWithVotes({ currentUserId }) {
  try {
    const res = await dbInstance.query(`
      SELECT
        p.*,
        COALESCE(v.user_vote, null) as user_vote,
        COALESCE(vs.upvotes, 0) as upvotes,
        COALESCE(vs.downvotes, 0) as downvotes
      FROM projects p
      LEFT JOIN (
        SELECT project_id,
               vote_type as user_vote
        FROM project_votes
         WHERE user_id = $1
      ) v ON p.id = v.project_id
      LEFT JOIN (
        SELECT project_id,
             COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
             COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes
        FROM project_votes
        GROUP BY project_id
      ) vs ON p.id = vs.project_id
      WHERE p.public = true
      ORDER BY (COALESCE(vs.upvotes, 0) - COALESCE(vs.downvotes, 0)) DESC, p.last_modified DESC
    `, [currentUserId]);
    return res.rows;
  } catch (err) {
    console.debug('Error getting public projects with votes:', err);
    return [];
  }
}

export async function seedSampleNotifications({ userId }) {
  try {
    const existingNotifications = await dbInstance.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1', [userId]);
    if (existingNotifications.rows[0].count > 0) {
      return { message: 'User already has notifications' };
    }

    const sampleNotifications = [
      {
        type: 'system',
        title: 'Welcome to Accelerator Platform',
        message: 'Your account has been successfully created. Complete your profile to unlock all features.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'credits',
        title: 'Welcome Credits Added',
        message: 'You\'ve received 50 free AI credits to explore our platform.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'system',
        title: 'Account Verification Complete',
        message: 'Your email has been verified.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'update',
        title: 'Platform Update',
        message: 'Enhanced AI models available.',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'system',
        title: 'Getting Started Guide',
        message: 'Check out our guide.',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const notification of sampleNotifications) {
      await createNotification({ userId, ...notification });
    }

    return { message: 'Sample notifications seeded successfully' };
  } catch (err) {
    console.debug('Error creating sample notifications:', err.message);
    throw err;
  }
}

export async function getLocalChanges({ tableName }) {
  // TODO: Implement proper local changes tracking based on sync_status
  // For now, return empty array to prevent sync errors
  return [];
}

export async function createSession({ userId, token, expiresAt }) {
  try {
    const id = uuidv4();
    const res = await dbInstance.query(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [id, userId, token, expiresAt, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
    );
    return res.rows[0];
  } catch (err) {
    console.debug('Error creating session:', err);
    throw err;
  }
}

export async function getSessionByToken({ token }) {
  try {
    const res = await dbInstance.query('SELECT * FROM sessions WHERE token = $1', [token]);
    return res.rows[0];
  } catch (err) {
    console.debug('Error getting session by token:', err);
    throw err;
  }
}

export async function deleteSession({ token }) {
  await dbInstance.query('DELETE FROM sessions WHERE token = $1', [token]);
}

export async function deleteExpiredSessions() {
  await dbInstance.query('DELETE FROM sessions WHERE expires_at < $1', [new Date().toISOString()]);
}

export async function updateBillingStatus2({ userId, status }) {
  await dbInstance.query('UPDATE users SET billing_status = $1 WHERE id = $2', [status, userId]);
}

export async function seedPackages() {
   try {
     console.log('Seeding packages...');
     const packages = [
       {
         id: 'free',
         name: 'Free',
         description: 'Basic plan with limited credits',
         price: 0,
         credits_included: 100,
         features: JSON.stringify(['Basic AI models', 'Limited credits', 'Community support']),
         active: 1
       },
       {
         id: 'pro',
         name: 'Pro',
         description: 'Professional plan with more credits',
         price: 29.99,
         credits_included: 1000,
         features: JSON.stringify(['Advanced AI models', 'Higher credit limits', 'Priority support', 'API access']),
         active: 1
       },
       {
         id: 'enterprise',
         name: 'Enterprise',
         description: 'Enterprise plan for teams',
         price: 99.99,
         credits_included: 5000,
         features: JSON.stringify(['All AI models', 'Unlimited credits', 'Dedicated support', 'Team collaboration', 'Custom integrations']),
         active: 1
       }
     ];

     for (const pkg of packages) {
       await dbInstance.query(`
         INSERT INTO packages (id, name, description, price, credits_included, features, active, created_at, synced_at, last_modified, sync_status, deleted_at, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING
       `, [
         pkg.id,
         pkg.name,
         pkg.description,
         pkg.price,
         pkg.credits_included,
         pkg.features,
         pkg.active,
         new Date().toISOString(),
         new Date().toISOString(),
         new Date().toISOString(),
         'local',
         null,
         1
       ]);
     }

     console.log('Packages seeded successfully');
     return { success: true };
   } catch (error) {
     console.error('Error seeding packages:', error);
     throw error;
   }
 }

export async function getPackages() {
  try {
    const res = await dbInstance.query('SELECT * FROM packages WHERE active = 1 ORDER BY price ASC');
    return res.rows;
  } catch (error) {
    console.error('Error getting packages:', error);
    return [];
  }
}

export async function createUserSubscription({ userId, packageId, subscriptionData = {} }) {
  try {
    const id = uuidv4();
    const res = await dbInstance.query(`
      INSERT INTO user_subscriptions (id, user_id, package_id, status, start_date, end_date, auto_renew, synced_at, last_modified, sync_status, deleted_at, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      id,
      userId,
      packageId,
      subscriptionData.status || 'active',
      subscriptionData.start_date || new Date().toISOString(),
      subscriptionData.end_date || null,
      subscriptionData.auto_renew !== undefined ? subscriptionData.auto_renew : 1,
      new Date().toISOString(),
      new Date().toISOString(),
      'local',
      null,
      1
    ]);
    return res.rows[0];
  } catch (error) {
    console.error('Error creating user subscription:', error);
    throw error;
  }
}

export async function getUserSubscription({ userId }) {
  try {
    const res = await dbInstance.query('SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = \'active\' ORDER BY start_date DESC LIMIT 1', [userId]);
    return res.rows[0];
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

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
    const res = await dbInstance.query("SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL", [id]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error getting user by id:', err);
    return null;
  }
}

export async function _getUserByEmail({ email }) {
  if (!email) {
    console.error('getUserByEmail: email parameter is required');
    return null;
  }
  try {
    const res = await dbInstance.query("SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL", [email]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error getting user by email:', err);
    return null;
  }
}

export async function _updateUser({ id, updates }) {
  return await updateEntity({
    table: 'users',
    idField: 'id',
    id,
    updates,
    options: {
      beforeUpdate: (updates) => {
        if (updates.profile) {
          updates.preferences = JSON.stringify(updates.profile);
          delete updates.profile;
        }
      }
    }
  });
}

export async function _deleteUser({ id }) {
  try {
    const res = await dbInstance.query("UPDATE users SET deleted_at = $1, sync_status = 'local' WHERE id = $2", [new Date().toISOString(), id]);
    return { success: true };
  } catch (err) {
    console.error('Error deleting user:', err);
    return { success: false, error: err.message };
  }
}


let worker = null;
let nextRequestId = 1;
let pendingRequests = new Map();

class DatabaseWorker {
  constructor() {
    this.worker = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      logger.debug('Creating database worker instance');
      this.worker = new PgliteWorker();

  this.worker.onmessage = (e) => {
    const { id, success, result, error, type } = e.data;
    const resolver = pendingRequests.get(id);
    if (resolver) {
      pendingRequests.delete(id);
      if (success) {
        resolver.resolve(result);
      } else {
        resolver.reject(new Error(error));
      }
    }
  };

      this.worker.onerror = (error) => {
        logger.error('Worker error:', error);
        // Reject all pending requests on worker error
        for (const [id, resolver] of pendingRequests) {
          resolver.reject(new Error('Database worker error'));
        }
        pendingRequests.clear();
      };

      // Initialize the database with timeout
      logger.debug('Initializing database...');
       await Promise.race([
          this.sendMessage('init', { dataDir: 'idb://accelerator-db-v22' }),
         new Promise((_, reject) => setTimeout(() => reject(new Error('Database init timeout')), 30000))
       ]);
      this.initialized = true;

      logger.debug('Database worker initialized successfully');
       // Check if database is already seeded
       const alreadySeeded = await isSeeded();
       if (!alreadySeeded) {
         // Seed initial data after database is ready
         await seedInitialData();
       } else {
         logger.debug('Database already seeded, skipping seeding');
       }
     } catch (error) {
       logger.error('Failed to initialize database worker:', error);
       // Set a flag to indicate database is unavailable
       this.dbUnavailable = true;
       logger.warn('Database unavailable, app will work in limited mode');
       // Don't throw error - let app continue with limited functionality
     }
  }

  async sendMessage(type, data) {
    logger.trace('DatabaseWorker: sendMessage called - type:', type, 'data keys:', Object.keys(data || {}));
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      logger.debug('DatabaseWorker: sending message id:', id, 'type:', type);
      pendingRequests.set(id, { resolve, reject });

      // Deep clone data to ensure it's cloneable, handling circular references and non-serializable objects
      const serializableData = this.deepCloneSerializable(data);
      logger.trace('DatabaseWorker: data serialized, posting message');
      this.worker.postMessage({ id, type, payload: serializableData });
      logger.trace('DatabaseWorker: message posted to worker');
    });
  }

  // Helper method to deep clone data while filtering out non-serializable objects
  deepCloneSerializable(obj, seen = new WeakMap()) {
    // Handle primitives
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Handle circular references
    if (seen.has(obj)) {
      return '[Circular]';
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      const result = [];
      seen.set(obj, result);
      for (let i = 0; i < obj.length; i++) {
        result[i] = this.deepCloneSerializable(obj[i], seen);
      }
      return result;
    }

    // Handle objects
    const result = {};
    seen.set(obj, result);

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // Skip functions, DOM elements, and other non-serializable objects
        if (typeof value === 'function' ||
            (typeof value === 'object' && value !== null && (
              value instanceof Element ||
              value instanceof Node ||
              value instanceof Window ||
              value instanceof Document ||
              value instanceof Event ||
              value instanceof EventTarget ||
              value.constructor.name === 'Object' && !Object.getPrototypeOf(value)
            ))) {
          continue; // Skip this property
        }

        result[key] = this.deepCloneSerializable(value, seen);
      }
    }

    return result;
  }

  async isSeeded() {
    return await this.sendMessage('isSeeded', {});
  }

  async query(sql, params = []) {
    return await this.sendMessage('query', { sql, params });
  }

  async exec(sql) {
    return await this.sendMessage('exec', { sql });
  }

  async transaction(operations) {
    return await this.sendMessage('transaction', { operations });
  }

   async close() {
     if (this.worker) {
       await this.sendMessage('close', {});
       this.worker.terminate();
       this.worker = null;
       this.initialized = false;
     }
   }

   // High-level operations
   async getTasks(project_id = null, userId = null) {
     return await this.sendMessage('getTasks', { project_id, userId });
   }

    async addTask(task, project_id, userId = null) {
      return await this.sendMessage('addTask', { task, project_id, userId });
    }

   async clearAllTasks() {
     return await this.sendMessage('clearAllTasks', {});
   }

   async updateTask(id, content) {
     return await this.sendMessage('updateTask', { id, content });
   }

   async getProjects(userId = null) {
     return await this.sendMessage('getProjects', { userId });
   }

   async getPublicProjects() {
     return await this.sendMessage('getPublicProjects', {});
   }

   async getProjectById(id) {
     return await this.sendMessage('getProjectById', { id });
   }

    async addProject(project, userId) {
      return await this.sendMessage('createProject', { project, userId });
    }

   async updateProject(id, project) {
     return await this.sendMessage('updateProject', { id, project });
   }

   async deleteProject(id) {
     return await this.sendMessage('deleteProject', { id });
   }

   async getEntities(table, selectFields = '*', whereClause = '', orderBy = '', params = []) {
     return await this.sendMessage('getEntities', { table, selectFields, whereClause, orderBy, params });
   }

   async updateEntity(table, idField, id, updates, options = {}) {
     return await this.sendMessage('updateEntity', { table, idField, id, updates, options });
   }

   async createUser(email, passwordHash, profile = {}, userId = null) {
     return await this.sendMessage('createUser', { email, passwordHash, profile, userId });
   }

   async getUserByEmail(email) {
     return await this.sendMessage('getUserByEmail', { email });
   }

   async getUserById(id) {
     return await this.sendMessage('getUserById', { id });
   }

   async updateUser(id, updates) {
     return await this.sendMessage('updateUser', { id, updates });
   }

   async getUserCreditBalance(userId) {
     return await this.sendMessage('getUserCreditBalance', { userId });
   }

   async addCreditTransaction(userId, type, amount, description) {
     return await this.sendMessage('addCreditTransaction', { userId, type, amount, description });
   }

   // Groups operations
   async getGroups(userId = null) {
     return await this.sendMessage('getGroups', { userId });
   }

   async getGroupById(id) {
     return await this.sendMessage('getGroupById', { id });
   }

   async addGroup(group, userId) {
     return await this.sendMessage('addGroup', { group, userId });
   }

   async updateGroup(id, group) {
     return await this.sendMessage('updateGroup', { id, group });
   }

   async deleteGroup(id) {
     return await this.sendMessage('deleteGroup', { id });
   }

   // Session operations
   async createSession(userId, token, expiresAt) {
     return await this.sendMessage('createSession', { userId, token, expiresAt });
   }

   async getSessionByToken(token) {
     return await this.sendMessage('getSessionByToken', { token });
   }

   async deleteSession(token) {
     return await this.sendMessage('deleteSession', { token });
   }

   async deleteExpiredSessions() {
     return await this.sendMessage('deleteExpiredSessions', {});
   }

   // User operations (additional)
   async deleteUser(id) {
     return await this.sendMessage('deleteUser', { id });
   }

   // Billing operations
   async addBillingRecord(userId, type, amount, description, dueDate = null) {
     return await this.sendMessage('addBillingRecord', { userId, type, amount, description, dueDate });
   }

   async getUserBilling(userId) {
     return await this.sendMessage('getUserBilling', { userId });
   }

   async updateBillingStatus(id, status) {
     return await this.sendMessage('updateBillingStatus', { id, status });
   }

   // Notification operations
   async createNotification(userId, type, title, message, createdAt = null) {
     return await this.sendMessage('createNotification', { userId, type, title, message, createdAt });
   }

   async getUserNotifications(userId) {
     return await this.sendMessage('getUserNotifications', { userId });
   }

   async markNotificationRead(notificationId, userId) {
     return await this.sendMessage('markNotificationRead', { notificationId, userId });
   }

   // Packages operations
   async getPackages() {
     return await this.sendMessage('getPackages', {});
   }

   async getUserSubscription(userId) {
     return await this.sendMessage('getUserSubscription', { userId });
   }

   async createUserSubscription(userId, packageId, subscriptionData = {}) {
     return await this.sendMessage('createUserSubscription', { userId, packageId, subscriptionData });
   }

   async updateUserSubscription(userId, subscriptionId, updates) {
     return await this.sendMessage('updateUserSubscription', { userId, subscriptionId, updates });
   }

   // Project votes operations
   async voteOnProject(projectId, userId, voteType) {
     return await this.sendMessage('voteOnProject', { projectId, userId, voteType });
   }

   async getProjectVotes(projectId) {
     return await this.sendMessage('getProjectVotes', { projectId });
   }

   // Project groups operations
   async addProjectToGroup(projectId, groupId) {
     return await this.sendMessage('addProjectToGroup', { projectId, groupId });
   }

   async removeProjectFromGroup(projectId, groupId) {
     return await this.sendMessage('removeProjectFromGroup', { projectId, groupId });
   }

   async getProjectsInGroup(groupId) {
     return await this.sendMessage('getProjectsInGroup', { groupId });
   }

   async getUngroupedProjects(userId = null) {
     return await this.sendMessage('getUngroupedProjects', { userId });
   }

   // Complex queries
   async getPublicProjectsWithVotes(currentUserId) {
     return await this.sendMessage('getPublicProjectsWithVotes', { currentUserId });
   }

   async getGroupsWithProjects(userId = null) {
     return await this.sendMessage('getGroupsWithProjects', { userId });
   }

   async getProjectByName(name) {
     return await this.sendMessage('getProjectByName', { name });
   }

   async deleteAllProjects() {
     return await this.sendMessage('deleteAllProjects', {});
   }

   async toggleProjectPublic(projectId, isPublic) {
     return await this.sendMessage('toggleProjectPublic', { projectId, isPublic });
   }

   // Credits helper operations
   async getUserCredits(userId) {
     return await this.sendMessage('getUserCredits', { userId });
   }

   async getCreditTransactions(userId) {
     return await this.sendMessage('getCreditTransactions', { userId });
   }

   async getCreditBalance(userId) {
     return await this.sendMessage('getCreditBalance', { userId });
   }

   async consumeCredits(userId, amount, description) {
     return await this.sendMessage('consumeCredits', { userId, amount, description });
   }

   // Profile operations
   async getUserProfile(userId) {
     return await this.sendMessage('getUserProfile', { userId });
   }

   async createUserProfile(userId, profileData = {}) {
     return await this.sendMessage('createUserProfile', { userId, profileData });
   }

   // Subscription change operations
   async changeUserSubscription(userId, newPackageId, currentSubscription = null) {
     return await this.sendMessage('changeUserSubscription', { userId, newPackageId, currentSubscription });
   }

   // Seeding operations
   async seedPackages() {
     return await this.sendMessage('seedPackages', {});
   }

   async seedSampleNotifications(userId) {
     return await this.sendMessage('seedSampleNotifications', { userId });
   }

   // Portfolio/Collaboration operations
   async inviteCollaborator(portfolioId, inviteeEmail, role = 'editor', message = '', inviterId) {
     return await this.sendMessage('inviteCollaborator', { portfolioId, inviteeEmail, role, message, inviterId });
   }

   async getPortfolioInvitations(portfolioId) {
     return await this.sendMessage('getPortfolioInvitations', { portfolioId });
   }

   async getUserInvitations(userEmail) {
     return await this.sendMessage('getUserInvitations', { userEmail });
   }

   async respondToInvitation(invitationId, status, userId) {
     return await this.sendMessage('respondToInvitation', { invitationId, status, userId });
   }

   async getPortfolioCollaborators(portfolioId) {
     return await this.sendMessage('getPortfolioCollaborators', { portfolioId });
   }

   async removeCollaborator(portfolioId, userId) {
     return await this.sendMessage('removeCollaborator', { portfolioId, userId });
   }

   async updateCollaboratorRole(portfolioId, userId, role) {
     return await this.sendMessage('updateCollaboratorRole', { portfolioId, userId, role });
   }

   // Helper functions
   async getCurrentUserId() {
     return await this.sendMessage('getCurrentUserId', {});
   }

   async getGroupName(groupId) {
     return await this.sendMessage('getGroupName', { groupId });
   }

   // Sync operations
   async getLocalChanges(tableName) {
     return await this.sendMessage('getLocalChanges', { tableName });
   }

   async getLocalItem(tableName, id, idField) {
     return await this.sendMessage('getLocalItem', { tableName, id, idField });
   }

   async insertLocalItem(tableName, data) {
     return await this.sendMessage('insertLocalItem', { tableName, data });
   }

   async deleteLocalItem(tableName, idField, id) {
     return await this.sendMessage('deleteLocalItem', { tableName, idField, id });
   }

   async markItemSynced(tableName, idField, id, version) {
     return await this.sendMessage('markItemSynced', { tableName, idField, id, version });
   }

   async markItemConflict(tableName, idField, id, error, retryCount) {
     return await this.sendMessage('markItemConflict', { tableName, idField, id, error, retryCount });
   }

  async resolveConflict(localItem, remoteItem) {
    return await this.sendMessage('resolveConflict', { localItem, remoteItem });
  }

  // Activity operations
  async logActivity(data) {
    return await this.sendMessage('logActivity', data);
  }

  async getUserActivities(data) {
    return await this.sendMessage('getUserActivities', data);
  }
}

let pgInstance = null;

export const getPg = async () => {
  if (!dbReady) {
    await initDatabase();
  }
  return dbInstance;
};

// Fallback implementations for when database is unavailable
const createFallbackResponse = (message) => ({
  error: 'Database unavailable',
  message,
  fallback: true
});

// Helper to safely call database operations with fallbacks
const safeDbCall = async (operation, fallbackValue = null, operationName = 'database operation') => {
  try {
    const pg = await getPg();
    return await operation(pg);
  } catch (error) {
    if (error.message.includes('Database unavailable')) {
      logger.warn(`Database unavailable, returning fallback for ${operationName}`);
      return fallbackValue;
    }
    logger.error(`Error in ${operationName}:`, error);
    return fallbackValue;
  }
};



export const initDb = async () => {
  // Worker initializes automatically
  await seedInitialData();
};

// Generic helper for SELECT operations
 export const getEntities = async (table, selectFields = '*', whereClause = '', orderBy = '', params = []) => {
   try {
     const pg = await getPg();
     return await pg.getEntities(table, selectFields, whereClause, orderBy, params);
   } catch (error) {
     logger.debug(`DB error in getEntities for ${table}: ${error.message}`);
     return [];
   }
 };

// Generic helper for UPDATE operations
  export const updateEntity = async (table, idField, id, updates, options = { noTrigger: false }) => {
    logger.trace('updateEntity: Starting - table:', table, 'idField:', idField, 'id:', id, 'updates keys:', Object.keys(updates || {}), 'noTrigger:', options.noTrigger);
    try {
      const pg = await getPg();
      logger.debug('updateEntity: PG connection obtained, executing update');
      const result = await pg.updateEntity(table, idField, id, updates, options);
      logger.debug('updateEntity: Update executed successfully, result:', result);

      logger.trace('updateEntity: Completed successfully');
      return result;
    } catch (error) {
      logger.error('updateEntity: Error - table:', table, 'error:', error.message, error.stack);
      return { success: false, error: error.message };
    }
  };

   export const getTasks = async (project_id = null, userId = null) => {
     logger.debug('getTasks called with project_id:', project_id, 'userId:', userId);
     return await _getTasks({ projectId: project_id });
   };

      export const addTask = async (task, project_id) => {
        logger.debug('DB: addTask called with task content length:', task?.content?.length, 'project_id:', project_id);
        const taskWithProjectId = { ...task, projectId: project_id };
        await _addTask({ task: taskWithProjectId });
        logger.debug('DB: Task added successfully');
       };

export const clearAllTasks = async () => {
     try {
       const pg = await getPg();
       await pg.clearAllTasks();
     } catch (e) {
       logger.debug('DB not ready, skipping clearAllTasks');
     }
 };

  export const updateTask = async (id, content) => {
     try {
       const pg = await getPg();
       await pg.updateTask(id, content);
     } catch (e) {
       logger.debug('DB not ready, skipping updateTask');
     }
  };





      export const getProjects = async (userId = null) => {
         try {
       if (!userId || typeof userId !== 'string') {
              const user = await getCurrentUser();
              logger.debug('user from getCurrentUser:', user);
              userId = user && typeof user.id === 'string' ? user.id : null;
            }
          logger.debug('Getting projects for userId:', userId, 'type:', typeof userId);
          if (typeof userId !== 'string') {
            logger.error('Invalid userId type:', typeof userId, 'value:', userId);
            return [];
          }
          const projects = await _getProjects({ userId });
          logger.debug('Projects loaded:', projects);
          return projects;
        } catch (e) {
          logger.debug('Error getting projects:', e);
          return [];
        }
      };

    export const getPublicProjects = async () => {
       const pg = await getPg();
       const projects = await pg.getPublicProjects();
       logger.debug('Public projects loaded:', projects);
       return projects;
     };

    export const getPublicProjectsWithVotes = async (currentUserId) => {
      try {
        const pg = await getPg();
        const projects = await pg.getPublicProjectsWithVotes(currentUserId);
        logger.debug('Public projects with votes loaded:', projects);
        return projects;
      } catch (e) {
        logger.debug('Error getting public projects with votes:', e);
        return [];
      }
    };

    export const getProjectByName = async (name) => {
      try {
        const pg = await getPg();
        return await pg.getProjectByName(name);
      } catch (e) {
        logger.debug('DB not ready, returning null');
        return null;
      }
    };

    export const getProjectById = async (id) => {
      return await _getProjectById({ id });
    };

      export const addProject = async (project) => {
        try {
          const user = await getCurrentUser();
          if (!user) throw new Error('User not authenticated');

          // Ensure public is integer (0 for private)
          project.public = 0;

          const newProject = await _createProject({ project, userId: user.id });
          logger.debug('Added project:', newProject);

          // Log activity
          await logActivity(user.id, 'project_created', 'project', newProject.id, `Created project "${project.name}"`, { projectName: project.name });

          toastManager.success(`Project "${project.name}" created successfully`);
          return newProject.id;
        } catch (e) {
          logger.debug('Error adding project:', e);
          toastManager.error(`Failed to add project "${project.name}" (${project.description?.length || 0} chars description): ${e.message}`);
        }
      };

      export const updateProject = async (id, project) => {
        try {
          // Validate parameters
          if (!id) throw new Error('Project ID is required');
          if (!project || typeof project !== 'object') throw new Error('Project data must be an object');

          const user = await getCurrentUser();
          if (!user) throw new Error('User not authenticated');

          logger.debug('DB: updateProject called with id:', id, 'updates:', Object.keys(project));
          await _updateProject({ id, updates: project });
          logger.debug('DB: Updated project:', id);

          toastManager.success('Project updated successfully');

          // Log activity
          await logActivity(user.id, 'project_updated', 'project', id, `Updated project`, { fields: Object.keys(project) });

        } catch (e) {
         logger.debug('Error updating project:', e);
         toastManager.error(`Failed to update project ${id} (${Object.keys(project).length} fields): ${e.message}`);
       }
   };

    export const deleteProject = async (id) => {
      try {
          const user = await getCurrentUser();
          if (!user) throw new Error('User not authenticated');

          await _deleteProject({ id });
            logger.debug('Deleted project:', id);

            toastManager.success(`Project deleted successfully`);

             // Dispatch event to reset current project if it was deleted
             window.dispatchEvent(new CustomEvent('projectDeleted', { detail: { projectId: id } }));

             // Log activity
             await logActivity(user.id, 'project_deleted', 'project', id, `Deleted project`, {});

          } catch (e) {
           logger.debug('Error deleting project:', e);
           toastManager.error(`Failed to delete project ${id}: ${e.message}`);
         }
    };

   export const deleteAllProjects = async () => {
      try {
        const pg = await getPg();
        await pg.deleteAllProjects();
        logger.debug('Deleted all projects');
      } catch (e) {
        logger.debug('Error deleting all projects:', e);
      }
    };

    export const toggleProjectPublic = async (projectId, isPublic) => {
      try {
        const pg = await getPg();
        const result = await pg.toggleProjectPublic({ projectId, isPublic });
        logger.debug(`Project ${projectId} set to ${isPublic ? 'public' : 'private'}`);
        return result;
      } catch (e) {
        logger.debug('Error toggling project public status:', e);
        toastManager.error(`Failed to update project visibility: ${e.message}`);
        return { success: false, error: e.message };
      }
    };

    export const voteOnProject = async (projectId, userId, voteType) => {
      try {
        const pg = await getPg();
        const result = await pg.voteOnProject({ projectId, userId, voteType });
        return result;
      } catch (e) {
        logger.debug('Error voting on project:', e);
        toastManager.error(`Failed to vote on project: ${e.message}`);
        return { success: false, error: e.message };
      }
    };

    export const getProjectVotes = async (projectId) => {
      try {
        const pg = await getPg();
        return await pg.getProjectVotes(projectId);
      } catch (e) {
        logger.debug('Error getting project votes:', e);
        return [];
      }
    };

// Groups functions
  export const getGroups = async (userId = null) => {
    const pg = await getPg();
    const groups = await pg.getGroups(userId);
    logger.debug('Groups loaded:', groups);
    return groups;
  };

 export const getGroupById = async (id) => {
   try {
     const pg = await getPg();
     return await pg.getGroupById(id);
   } catch (e) {
     logger.debug('Error loading group:', e);
     return null;
   }
 };

  export const addGroup = async (group) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const pg = await getPg();
      const newGroup = await pg.addGroup(group, user.id);
      logger.debug('Added group:', newGroup);
      return newGroup.id;
    } catch (e) {
      logger.debug('Error adding group:', e);
      toastManager.error(`Failed to add group "${group.name}": ${e.message}`);
    }
  };

 export const updateGroup = async (id, group) => {
   try {
     const pg = await getPg();
      const result = await pg.updateGroup({ id, group });
     if (!result.success) {
       throw new Error(result.error);
     }
     logger.debug('Updated group:', id);
   } catch (e) {
     logger.debug('Error updating group:', e);
     toastManager.error(`Failed to update group ${id} (${Object.keys(group).length} fields): ${e.message}`);
   }
 };

  export const deleteGroup = async (id) => {
    try {
      const pg = await getPg();
      await pg.deleteGroup(id);
      logger.debug('Deleted group:', id);
    } catch (e) {
      logger.debug('Error deleting group:', e);
      toastManager.error(`Failed to delete group ${id}: ${e.message}`);
    }
  };

export const exportAllProjects = async (userId = null) => {
  try {
    const projects = await getProjects(userId);
    return JSON.stringify(projects, null, 2);
  } catch (e) {
    return null;
  }
};

 export const addProjectToGroup = async (projectId, groupId) => {
   try {
     const pg = await getPg();
      await pg.addProjectToGroup({ projectId, groupId });
     logger.debug('Added project', projectId, 'to group', groupId);
     triggerSync();
   } catch (e) {
     logger.debug('Error adding project to group:', e);
   }
 };

 export const removeProjectFromGroup = async (projectId, groupId) => {
   try {
     const pg = await getPg();
      await pg.removeProjectFromGroup({ projectId, groupId });
     logger.debug('Removed project', projectId, 'from group', groupId);
     triggerSync();
   } catch (e) {
     logger.debug('Error removing project from group:', e);
   }
 };

 export const getProjectsInGroup = async (groupId) => {
   try {
     const pg = await getPg();
     return await pg.getProjectsInGroup(groupId);
   } catch (e) {
     logger.debug('Error getting projects in group:', e);
     return [];
   }
 };

  export const getUngroupedProjects = async (userId = null) => {
    try {
      const pg = await getPg();
      return await pg.getUngroupedProjects({ userId });
    } catch (e) {
      logger.debug('Error getting ungrouped projects:', e);
      return [];
    }
  };

 export const getGroupsWithProjects = async (userId = null) => {
   try {
     const pg = await getPg();
     return await pg.getGroupsWithProjects(userId);
   } catch (e) {
     logger.debug('Error getting groups with projects:', e);
     return [];
   }
 };

// User functions
  export const createUser = async (email, passwordHash, profile = {}, userId = null) => {
    return await _createUser({ email, passwordHash, profile, userId });
  };

  export const getUserByEmail = async (email) => {
    return await _getUserByEmail({ email });
  };

  export const getUserById = async (id) => {
    return await _getUserById({ id });
  };

 export const updateUser = async (id, updates) => {
   try {
     const pg = await getPg();
      const result = await pg.updateUser({ id, updates });
     logger.debug('Updated user:', id);
     return result;
   } catch (e) {
     logger.debug('Error updating user:', e);
     throw e;
   }
 };

  export const deleteUser = async (id) => {
    try {
      const pg = await getPg();
      await pg.deleteUser(id);
      logger.debug('Deleted user:', id);
    } catch (e) {
      logger.debug('Error deleting user:', e);
      throw e;
    }
  };

// Session functions
  export const createSession = async (userId, token, expiresAt) => {
    try {
      const pg = await getPg();
       const session = await pg.createSession({ userId, token, expiresAt });
      logger.debug('Session created:', session);
      return session;
    } catch (e) {
      logger.debug('Error creating session:', e);
      throw e;
    }
  };

 export const getSessionByToken = async (token) => {
   try {
     const pg = await getPg();
     return await pg.getSessionByToken(token);
   } catch (e) {
     logger.debug('Error getting session by token:', e);
     return null;
   }
 };

  export const deleteSession = async (token) => {
    try {
      const pg = await getPg();
      await pg.deleteSession(token);
      logger.debug('Deleted session:', token);
    } catch (e) {
      logger.debug('Error deleting session:', e);
    }
  };

  export const deleteExpiredSessions = async () => {
    try {
      const pg = await getPg();
      await pg.deleteExpiredSessions();
      logger.debug('Deleted expired sessions');
    } catch (e) {
      logger.debug('Error deleting expired sessions:', e);
    }
  };

// Credits functions
  export const addCreditTransaction = async (userId, type, amount, description) => {
    try {
      const pg = await getPg();
       const transaction = await pg.addCreditTransaction({ userId, type, amount, description });
      return transaction;
    } catch (error) {
      logger.error('Error adding credit transaction:', error);
      throw error;
    }
  };



    export const getUserCredits = async (userId) => {
      try {
        const pg = await getPg();
        return await pg.getUserCredits(userId);
      } catch (e) {
        logger.debug('Error getting user credits:', e);
        return [];
      }
    };

 export const getUserCreditBalance = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getUserCreditBalance(userId);
   } catch (e) {
     logger.debug('Error getting user credit balance:', e);
     return 0;
   }
 };

// Billing functions
 export const addBillingRecord = async (userId, type, amount, description, dueDate = null) => {
   try {
     const pg = await getPg();
      const billingRecord = await pg.addBillingRecord({ userId, type, amount, description, dueDate });
     logger.debug('Billing record added:', billingRecord);
     triggerSync();
     return billingRecord;
   } catch (e) {
     logger.debug('Error adding billing record:', e);
     throw e;
   }
 };

 export const getUserBilling = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getUserBilling(userId);
   } catch (e) {
     logger.debug('Error getting user billing:', e);
     return [];
   }
 };

 export const consumeCredits = async (userId, amount, description) => {
   try {
     const pg = await getPg();
     return await pg.consumeCredits(userId, amount, description);
   } catch (error) {
     logger.error('Error consuming credits:', error);
     throw error;
   }
 };

export const getCreditBalance = async (userId) => {
  return await safeDbCall(
    (pg) => pg.getCreditBalance(userId),
    0,
    'getCreditBalance'
  );
};

  export const getCreditTransactions = async (userId) => {
    try {
      const pg = await getPg();
      return await pg.getCreditTransactions(userId);
    } catch (error) {
      logger.error('Error getting credit transactions:', error);
      return [];
    }
  };

    // Activity functions
 export const logActivity = async (userId, actionType, entityType, entityId, description, metadata = {}) => {
   try {
     const pg = await getPg();
     const activity = await pg.logActivity({ userId, actionType, entityType, entityId, description, metadata });
     return activity;
   } catch (error) {
     logger.error('Error logging activity:', error);
     throw error;
   }
 };

export const getUserActivities = async (userId, limit = 50, offset = 0) => {
  try {
    const pg = await getPg();
    return await pg.getUserActivities({ userId, limit, offset });
  } catch (error) {
    logger.error('Error getting user activities:', error);
    return [];
  }
};

  export const createNotification = async (userId, type, title, message, createdAt = null) => {
    try {
      const pg = await getPg();
       const notification = await pg.createNotification({ userId, type, title, message });
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  };

export const getUserNotifications = async (userId) => {
  return await safeDbCall(
    (pg) => pg.getUserNotifications(userId),
    [],
    'getUserNotifications'
  );
};

  export const markNotificationRead = async (notificationId, userId) => {
    try {
      const pg = await getPg();
       const result = await pg.markNotificationRead({ notificationId, userId });
      return result;
    } catch (error) {
      logger.error('Error marking notification read:', error);
      return false;
    }
  };

 export const getPackages = async () => {
   try {
     const pg = await getPg();
     return await pg.getPackages();
   } catch (error) {
     logger.error('Error getting packages:', error);
     return [];
   }
 };

export const getUserSubscription = async (userId) => {
  return await safeDbCall(
    (pg) => pg.getUserSubscription(userId),
    null,
    'getUserSubscription'
  );
};

   export const createUserSubscription = async (userId, packageId, subscriptionData = {}) => {
     try {
       const pg = await getPg();
        const subscription = await pg.createUserSubscription(userId, packageId, subscriptionData);
       logger.debug('User subscription created:', subscription);
       return subscription;
     } catch (error) {
       logger.error('Error creating user subscription:', error);
       throw error;
     }
   };

  export const changeUserSubscription = async (userId, newPackageId, currentSubscription = null) => {
    try {
      const pg = await getPg();
       const newSubscription = await pg.changeUserSubscription(userId, newPackageId, currentSubscription);
      return newSubscription;
    } catch (error) {
      logger.error('Error changing user subscription:', error);
      throw error;
    }
  };

 export const updateUserSubscription = async (userId, subscriptionId, updates) => {
   try {
     const pg = await getPg();
      const result = await pg.updateUserSubscription({ userId, subscriptionId, updates });
     logger.debug('Updated user subscription:', subscriptionId);
     return result;
   } catch (error) {
     logger.error('Error updating user subscription:', error);
     throw error;
   }
 };

 export const getUserProfile = async (userId) => {
  return await safeDbCall(
    (pg) => pg.getUserProfile(userId),
    null,
    'getUserProfile'
  );
};

  export const createUserProfile = async (userId, profileData = {}) => {
    try {
      const pg = await getPg();
       const profile = await pg.createUserProfile({ userId, profileData });
      return profile;
    } catch (error) {
      logger.error('Error creating user profile:', error);
      throw error;
    }
  };

  export const updateBillingStatus = async (id, status) => {
    try {
      const pg = await getPg();
      await pg.updateBillingStatus(id, status);
      logger.debug('Updated billing status:', id, status);
    } catch (e) {
      logger.debug('Error updating billing status:', e);
    }
  };

// Seeding function for initial data
  export const isSeeded = async () => {
    try {
      const pg = await getPg();
      const result = await pg.query(`SELECT version FROM db_version WHERE version >= 2`);
      return result.length > 0;
    } catch (e) {
      logger.debug('Error checking if seeded:', e);
      return false;
    }
  };

  export const seedPackages = async () => {
    try {
      const pg = await getPg();
      const result = await pg.seedPackages();
      logger.debug('Packages seeded successfully');
      return result;
    } catch (e) {
      if (e.message.includes('Database unavailable')) {
        logger.warn('Database unavailable, skipping package seeding');
        return;
      }
      logger.debug('Error seeding packages:', e);
    }
  };

  export const seedInitialData = async () => {
    try {
      logger.debug('Seeding initial data...');

      const currentVersion = 2;
      const pg = await getPg();
      // Initialize the database schema
      await pg.initDatabase();
      let version = 0;
      try {
        const res = await pg.query(`SELECT version FROM db_version`);
        if (res.length > 0) version = res[0].version;
      } catch (e) {}
      if (version < currentVersion) {
        logger.debug('Migrating database to version', currentVersion);
        // Drop all tables in reverse order
        const tables = ['db_version', 'projects', 'tasks', 'users', 'sessions', 'credits', 'billing', 'notifications', 'packages', 'user_subscriptions', 'profiles', 'groups', 'project_groups', 'user_activities', 'portfolio_invitations', 'portfolio_collaborators'];
        for (const table of tables.reverse()) {
          await pg.exec(`DROP TABLE IF EXISTS ${table}`);
        }
        version = 0;
      }
      if (version === 0) {
        // Seed packages (these are system-wide, not user-specific)
        await seedPackages();
        // Insert version
        await pg.exec(`INSERT INTO db_version (version) VALUES (${currentVersion})`);
      }

      logger.debug('Initial data seeded successfully');
    } catch (e) {
      if (e.message.includes('Database unavailable')) {
        logger.warn('Database unavailable, skipping initial data seeding');
        return;
      }
      logger.debug('Error seeding data:', e);
    }
  };

 export const seedSampleNotifications = async (userId) => {
   try {
     const pg = await getPg();
     await pg.seedSampleNotifications(userId);
   } catch (e) {
     logger.debug('Error creating sample notifications:', e);
   }
 };

// Sync data with Supabase
// Portfolio Collaboration Functions
  export const inviteCollaborator = async (portfolioId, inviteeEmail, role = 'editor', message = '') => {
    try {
      const inviterId = await getCurrentUserId();
      const pg = await getPg();
      const invitation = await pg.inviteCollaborator(portfolioId, inviteeEmail, role, message, inviterId);
      return invitation;
    } catch (error) {
      logger.error('Error inviting collaborator:', error);
      throw error;
    }
  };

 export const getPortfolioInvitations = async (portfolioId) => {
   try {
     const pg = await getPg();
     return await pg.getPortfolioInvitations(portfolioId);
   } catch (error) {
     logger.error('Error getting portfolio invitations:', error);
     return [];
   }
 };

 export const getUserInvitations = async (userEmail) => {
   try {
     const pg = await getPg();
     return await pg.getUserInvitations(userEmail);
   } catch (error) {
     logger.error('Error getting user invitations:', error);
     return [];
   }
 };

  export const respondToInvitation = async (invitationId, status) => {
    try {
      const userId = await getCurrentUserId();
      const pg = await getPg();
     const result = await pg.respondToInvitation(invitationId, status, userId);

     return result;
    } catch (error) {
      logger.error('Error responding to invitation:', error);
      throw error;
    }
  };

 export const getPortfolioCollaborators = async (portfolioId) => {
   try {
     const pg = await getPg();
     return await pg.getPortfolioCollaborators(portfolioId);
   } catch (error) {
     logger.error('Error getting portfolio collaborators:', error);
     return [];
   }
 };

  export const removeCollaborator = async (portfolioId, userId) => {
    try {
      const pg = await getPg();
      const result = await pg.removeCollaborator(portfolioId, userId);

      // Create notification for removed user
      const groupName = await pg.getGroupName(portfolioId);
      await pg.createNotification(userId, 'system', 'Removed from Portfolio', `You have been removed from portfolio "${groupName}".`);

      return result;
    } catch (error) {
      logger.error('Error removing collaborator:', error);
      throw error;
    }
  };

  export const updateCollaboratorRole = async (portfolioId, userId, role) => {
    try {
      const pg = await getPg();
      const result = await pg.updateCollaboratorRole(portfolioId, userId, role);
      return result;
    } catch (error) {
      logger.error('Error updating collaborator role:', error);
      throw error;
    }
  };

// Helper functions
 const getCurrentUserId = async () => {
   const user = await getCurrentUser();
   if (!user) {
     throw new Error('User not authenticated');
   }
   return user.id;
 };

 const getGroupName = async (groupId) => {
   try {
     const pg = await getPg();
     return await pg.getGroupName(groupId);
   } catch (error) {
     return 'Unknown Portfolio';
   }
 };

