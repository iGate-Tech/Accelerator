// src/lib/database/core.js
// PGLite with IndexedDB persistence - SINGLE SOURCE OF TRUTH
// All database access must go through this module

import { PGlite } from '@electric-sql/pglite';
import { DATABASE_CONFIG, IDB_URL, SCHEMA_TABLES } from './constants.js';

// ============================================================================
// PUBLIC API
// ============================================================================

export let dbInstance = null;
export let dbReady = false;
export let dbError = null;
export let schemaCreated = false;

let initPromise = null;
let initState = 'idle';  // idle | initializing | ready | error

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Get the database instance. Throws if not initialized.
 * @returns {Promise<PGlite>}
 */
export async function getDbInstance() {
  if (!dbReady || !dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

/**
 * Check if database is ready
 * @returns {boolean}
 */
export function isDbReady() {
  return dbReady && dbInstance !== null;
}

/**
 * Get database status
 * @returns {{ready: boolean, schemaCreated: boolean, error: string|null}}
 */
export function getDbStatus() {
  return {
    ready: dbReady,
    schemaCreated,
    error: dbError?.message || null
  };
}

/**
 * Initialize the database with proper error handling and race condition prevention
 * @param {{force?: boolean}} options
 * @returns {Promise<PGlite>}
 */
export async function initDatabase({ force = false } = {}) {
  // Case 1: Already ready and not forcing
  if (dbReady && dbInstance && !force) {
    return dbInstance;
  }

  // Case 2: Currently initializing - wait for completion
  if (initState === 'initializing' && initPromise) {
    return await _waitForReady();
  }

  // Case 3: Error state and not forcing - fail fast
  if (initState === 'error' && !force) {
    throw dbError || new Error('Database initialization failed');
  }

  // Case 4: Start new initialization
  return await _initialize({ force });
}

/**
 * Ensure database is ready, initializing if necessary
 * @returns {Promise<PGlite>}
 */
export async function ensureDatabaseReady() {
  if (dbReady && dbInstance) {
    return dbInstance;
  }
  return await initDatabase();
}

/**
 * Execute a query
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<any>}
 */
export async function query(sql, params = []) {
  const db = await ensureDatabaseReady();
  return await db.query(sql, params);
}

/**
 * Execute SQL statement
 * @param {string} sql
 * @returns {Promise<any>}
 */
export async function exec(sql) {
  const db = await ensureDatabaseReady();
  return await db.exec(sql);
}

/**
 * Safe query that returns null on error
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<any|null>}
 */
export async function safeQuery(sql, params = []) {
  try {
    const db = await ensureDatabaseReady();
    return await db.query(sql, params);
  } catch (error) {
    console.error('[DB] safeQuery error:', error);
    return null;
  }
}

/**
 * Get the database instance (alias for getDbInstance)
 * @returns {Promise<PGlite>}
 */
export async function getPg() {
  return await ensureDatabaseReady();
}

/**
 * Close the database connection
 */
export async function close() {
  if (dbInstance) {
    try {
      await dbInstance.close();
    } catch (error) {
      console.warn('Error closing database:', error);
    }
    dbInstance = null;
  }
  dbReady = false;
  initState = 'idle';
  initPromise = null;
  schemaCreated = false;
  dbError = null;
}

// ============================================================================
// PRIVATE FUNCTIONS
// ============================================================================

function isBrowser() {
  return typeof window === 'undefined' ? false : true;
}

/**
 * Wait for database to be ready
 * @returns {Promise<PGlite>}
 */
async function _waitForReady() {
  if (dbReady && dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    await initPromise;
    if (dbReady && dbInstance) {
      return dbInstance;
    }
    if (dbError) {
      throw dbError;
    }
  }

  throw new Error('Database initialization failed');
}

/**
 * Main initialization function
 * @param {{force?: boolean}} options
 * @returns {Promise<PGlite>}
 */
async function _initialize({ force }) {
  initState = 'initializing';
  initPromise = (async () => {
    try {
      console.log('[DB] Initializing PGLite...');
      dbError = null;

      // Reset state if forcing
      if (force) {
        await close();
        initState = 'initializing';
      }

      // Test IndexedDB access
      const idbAvailable = isBrowser() && await _testIndexedDBAccess();
      
      if (idbAvailable) {
        console.log('[DB] Creating PGLite with IndexedDB...');
        dbInstance = await PGlite.create(IDB_URL, DATABASE_CONFIG.pglite);
      } else {
        console.log('[DB] Using in-memory database');
        dbInstance = await PGlite.create();
      }

      // Wait for database to be ready
      await dbInstance.waitReady;
      console.log('[DB] PGLite ready');

      // Create schema if needed
      if (!schemaCreated || force) {
        const { createSchema, migrateSchema } = await import('./schema.js');
        await createSchema(dbInstance);
        await migrateSchema(dbInstance);
        schemaCreated = true;
        console.log('[DB] Schema ready');
      }

      // Validate consistency
      await _validateConsistency();

      dbReady = true;
      initState = 'ready';
      console.log('[DB] Database ready');
      return dbInstance;

    } catch (error) {
      console.error('[DB] Init error:', error);
      dbError = error;
      dbReady = false;
      initState = 'error';
      throw error;
    }
  })();

  return await initPromise;
}

/**
 * Test if IndexedDB is accessible
 * @returns {Promise<boolean>}
 */
async function _testIndexedDBAccess() {
  if (typeof window === 'undefined') return false;
  
  return new Promise((resolve) => {
    try {
      const testDB = indexedDB.open('idb-test-access', 1);
      testDB.onsuccess = () => {
        testDB.result.close();
        indexedDB.deleteDatabase('idb-test-access');
        resolve(true);
      };
      testDB.onerror = () => resolve(false);
      testDB.onblocked = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Validate database consistency
 * @returns {Promise<void>}
 */
async function _validateConsistency() {
  try {
    const result = await dbInstance.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = result.rows.map(r => r.table_name);
    const missingTables = SCHEMA_TABLES.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.warn('[DB] Missing tables:', missingTables);
    }

    const versionCheck = await dbInstance.query(`SELECT * FROM db_version LIMIT 1`);
    if (versionCheck.rows.length === 0) {
      await dbInstance.exec(`INSERT INTO db_version (version) VALUES (1)`);
      console.log('[DB] Initialized db_version');
    }

  } catch (error) {
    console.warn('[DB] Validation warning:', error.message);
  }
}

// ============================================================================
// CLEANUP ON PAGE UNLOAD
// ============================================================================

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', async () => {
    if (dbInstance) {
      try {
        await dbInstance.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
      if (dbInstance && typeof dbInstance.flush === 'function') {
        try {
          await dbInstance.flush();
        } catch (error) {
          // Ignore
        }
      }
    }
  });
}
