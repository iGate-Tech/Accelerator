
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

// PGLite singleton instance
export let dbInstance = null;
export let dbReady = false;
let dbInitPromise = null;

// Initialize PGLite database
export async function initDatabase() {
  if (dbReady) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

   dbInitPromise = (async () => {
     // Dynamically import PGLite to avoid Vite bundling issues
     const { PGlite } = await import('@electric-sql/pglite');

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
        dbReady = true;
      } else {
        console.warn('IndexedDB not available, falling back to in-memory database');
        console.log('Creating PGLite database instance in-memory...');
        dbInstance = new PGlite();
        console.log('PGLite in-memory database instance created successfully');
        await createSchema();
        dbReady = true;
      }
    } catch (error) {
      console.error('Failed to initialize database:', {
        name: error.name,
        message: error.message,
       stack: error.stack
     });
     console.warn('Database will not be available - functions will return default values');
     dbReady = false;
     dbInstance = null;
     // Don't throw - allow the app to continue with limited functionality
   }

   console.log(`Database initialized successfully (${indexedDBAvailable ? 'persistent' : 'in-memory'})`);
   return dbInstance;
  })();

  return dbInitPromise;
}

// Create database schema
async function createSchema() {
  console.log('Creating database schema...');
  try {
    // Create db_version table first
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS db_version (
        version INTEGER PRIMARY KEY
      );
    `);
    console.log('db_version table created');
  } catch (error) {
    console.error('Error creating db_version table:', error);
  }

  try {
    // Create tables one by one
    console.log('Creating users table...');
    await dbInstance.exec("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT, avatar TEXT DEFAULT '/src/assets/avatar.png', bio TEXT, preferences TEXT, synced_at TEXT, last_modified TEXT, sync_status TEXT DEFAULT 'local', deleted_at TEXT, version INTEGER DEFAULT 1)");
    console.log('Users table created');
  } catch (error) {
    console.error('Error creating users table:', error);
  }

  try {
    console.log('Creating projects table...');
    await dbInstance.exec(`
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
    `);
    console.log('Projects table created');
  } catch (error) {
    console.error('Error creating projects table:', error);
  }

  try {
    console.log('Creating tasks table...');
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
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
    `);
    console.log('Tasks table created');
  } catch (error) {
    console.error('Error creating tasks table:', error);
  }

  try {
    console.log('Creating groups table...');
    await dbInstance.exec(`
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
    `);
    console.log('Groups table created');
  } catch (error) {
    console.error('Error creating groups table:', error);
  }

  try {
    console.log('Creating project_groups table...');
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS project_groups (
        project_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        added_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        PRIMARY KEY (project_id, group_id)
      );
    `);
    console.log('Project_groups table created');
  } catch (error) {
    console.error('Error creating project_groups table:', error);
  }

  try {
    console.log('Creating credits table...');
    await dbInstance.exec(`
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
    `);
    console.log('Credits table created');
  } catch (error) {
    console.error('Error creating credits table:', error);
  }

  try {
    console.log('Creating billing table...');
    await dbInstance.exec(`
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
    `);
    console.log('Billing table created');
  } catch (error) {
    console.error('Error creating billing table:', error);
  }

  try {
    console.log('Creating notifications table...');
    await dbInstance.exec(`
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
    `);
    console.log('Notifications table created');
  } catch (error) {
    console.error('Error creating notifications table:', error);
  }

  try {
    console.log('Creating sessions table...');
    await dbInstance.exec(`
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
    `);
    console.log('Sessions table created');
  } catch (error) {
    console.error('Error creating sessions table:', error);
  }

  try {
    console.log('Creating packages table...');
    await dbInstance.exec(`
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
    `);
    console.log('Packages table created');
  } catch (error) {
    console.error('Error creating packages table:', error);
  }

  try {
    console.log('Creating user_subscriptions table...');
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        package_id TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        start_date TEXT DEFAULT CURRENT_TIMESTAMP::text,
        end_date TEXT,
        auto_renew INTEGER DEFAULT 1,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      );
    `);
    console.log('User_subscriptions table created');
  } catch (error) {
    console.error('Error creating user_subscriptions table:', error);
  }

  try {
    console.log('Creating profiles table...');
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        avatar TEXT,
        bio TEXT,
        preferences TEXT,
        current_project_id TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      );
    `);
    // Add column if it doesn't exist (for existing databases)
    try {
      await dbInstance.exec(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_project_id TEXT;`);
    } catch (alterError) {
      // Ignore if column already exists or alter not supported
      console.log('Alter table for current_project_id skipped:', alterError.message);
    }
    console.log('Profiles table created');
  } catch (error) {
    console.error('Error creating profiles table:', error);
  }

  try {
    console.log('Creating portfolio_collaborators table...');
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_collaborators (
        id TEXT PRIMARY KEY,
        portfolio_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        inviter_id TEXT NOT NULL,
        role TEXT DEFAULT 'editor',
        joined_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      );
    `);
    console.log('Portfolio_collaborators table created');
  } catch (error) {
    console.error('Error creating portfolio_collaborators table:', error);
  }

  try {
    console.log('Creating portfolio_invitations table...');
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_invitations (
        id TEXT PRIMARY KEY,
        portfolio_id TEXT NOT NULL,
        inviter_id TEXT NOT NULL,
        invitee_email TEXT NOT NULL,
        role TEXT DEFAULT 'editor',
        status TEXT DEFAULT 'pending',
        message TEXT,
        invited_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
        expires_at TEXT,
        responded_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      );
    `);
    console.log('Portfolio_invitations table created');
  } catch (error) {
    console.error('Error creating portfolio_invitations table:', error);
  }

  try {
    console.log('Creating user_activities table...');
    await dbInstance.exec(`
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
    `);
    console.log('User_activities table created');
  } catch (error) {
    console.error('Error creating user_activities table:', error);
  }

  try {
    console.log('Creating project_votes table...');
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS project_votes (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        vote_type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP::text
      );
    `);
    console.log('Project_votes table created');
  } catch (error) {
    console.error('Error creating project_votes table:', error);
  }

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

export const getPg = async () => {
  if (!dbReady) {
    try {
      await initDatabase();
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Return null to indicate database is not available
      return null;
    }
  }
  return dbInstance;
};

// Helper function to check if database is ready
export const ensureDatabaseReady = async () => {
  if (!dbReady) {
    const db = await getPg();
    if (!db) {
      throw new Error('Database is not available');
    }
  }
};

// Safe query wrapper
export const safeQuery = async (query, params = []) => {
  if (!dbInstance) {
    throw new Error('Database is not available');
  }
  return await dbInstance.query(query, params);
};

// Safe exec wrapper
export const safeExec = async (query) => {
  if (!dbInstance) {
    throw new Error('Database is not available');
  }
  return await dbInstance.exec(query);
};