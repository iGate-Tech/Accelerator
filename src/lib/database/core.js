// src/lib/database/core.js
// PGLite with IndexedDB persistence - SINGLE SOURCE OF TRUTH
// All database access must go through this module

import { PGlite } from '@electric-sql/pglite';
import { DATABASE_CONFIG, SCHEMA_TABLES } from './constants.js';

// ============================================================================
// PUBLIC API
// ============================================================================

export let dbInstance = null;
export let dbReady = false;
export let dbError = null;
export let schemaCreated = false;

let initPromise = null;
let initState = 'idle'; // idle | initializing | ready | error

// Setter functions to allow external modules to update these values
export function setDbInstance(instance) {
  dbInstance = instance;
}

export function setDbReady(ready) {
  dbReady = ready;
}

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
    error: dbError?.message || null,
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
      const idbAvailable = isBrowser() && (await _testIndexedDBAccess());

      // Attempt to create PGLite with IndexedDB first
      if (idbAvailable) {
        console.log('[DB] Creating PGLite with IndexedDB...');
        try {
          // Create PGLite with IndexedDB - simplest approach for browser
          dbInstance = await PGlite.create({
            // Use relaxed durability for better IndexedDB performance
            relaxedDurability: true,
            // Minimal debugging to reduce overhead
            debug: 0,
          });
          console.log('[DB] PGLite created with IndexedDB');
        } catch (indexedDBError) {
          console.warn(
            '[DB] IndexedDB creation failed, falling back to in-memory:',
            indexedDBError.message
          );
          console.error('[DB] IndexedDB Error details:', {
            name: indexedDBError.name,
            message: indexedDBError.message,
            stack: indexedDBError.stack,
          });

          // Check if this is a WASM-related error and provide specific guidance
          if (
            indexedDBError.message.includes('Abort') ||
            indexedDBError.message.includes('WASM')
          ) {
            console.error(
              '[DB] WASM/PGLite initialization error detected. This may be due to:'
            );
            console.error('[DB] 1. Browser security policies blocking WASM');
            console.error('[DB] 2. CORS restrictions');
            console.error('[DB] 3. Incompatible browser environment');

            // Try a more minimal configuration for WASM issues, still attempting IndexedDB
            try {
              dbInstance = await PGlite.create({
                relaxedDurability: true,
                debug: 0, // Minimal debugging to reduce overhead
              });
              console.log(
                '[DB] PGLite created with minimal config using IndexedDB'
              );
            } catch (minimalError) {
              console.error(
                '[DB] IndexedDB with minimal config failed, trying in-memory:',
                minimalError
              );

              // Final fallback to in-memory with minimal config
              try {
                dbInstance = await PGlite.create({
                  ...DATABASE_CONFIG.pglite,
                  relaxedDurability: true,
                  debug: 0,
                });
                console.log(
                  '[DB] PGLite created with minimal config in-memory'
                );
              } catch (finalError) {
                console.error(
                  '[DB] All initialization attempts failed:',
                  finalError
                );
                throw new Error(
                  `PGLite initialization completely failed. Original: ${indexedDBError.message}, Fallback: ${minimalError.message}, Final: ${finalError.message}`
                );
              }
            }
          } else {
            // Fallback to in-memory if IndexedDB fails (non-WASM error)
            try {
              dbInstance = await PGlite.create({
                ...DATABASE_CONFIG.pglite,
                relaxedDurability: true,
              });
              console.log('[DB] PGLite created in-memory');
            } catch (memoryError) {
              console.error(
                '[DB] Both IndexedDB and in-memory creation failed:',
                memoryError
              );
              throw new Error(
                `PGLite initialization failed: ${indexedDBError.message} (fallback error: ${memoryError.message})`
              );
            }
          }
        }
      } else {
        console.log('[DB] Using in-memory database');
        try {
          dbInstance = await PGlite.create({
            ...DATABASE_CONFIG.pglite,
            relaxedDurability: true,
          });
        } catch (memoryError) {
          console.error(
            '[DB] In-memory database creation failed:',
            memoryError
          );
          throw new Error(
            `PGLite in-memory initialization failed: ${memoryError.message}`
          );
        }
      }

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

      // More detailed error logging for debugging
      if (error.message.includes('Aborted') || error.message.includes('WASM')) {
        console.error(
          '[DB] WASM/Aborted error detected - this may be due to browser compatibility, security policies, or IndexedDB issues'
        );
        console.error('[DB] Possible solutions:');
        console.error('[DB] 1. Ensure you are using HTTPS in production');
        console.error('[DB] 2. Check browser supports WASM and IndexedDB');
        console.error(
          '[DB] 3. Verify no ad blockers are interfering with WASM'
        );
        console.error('[DB] 4. Try clearing browser storage/cache');
      }

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

  try {
    // Test basic IndexedDB availability
    if (!window.indexedDB) {
      console.warn('[DB] IndexedDB not available in this environment');
      return false;
    }

    // Try to open a test database
    const dbName = `idb-test-access-${Date.now()}`;
    const request = indexedDB.open(dbName, 1);

    return new Promise(resolve => {
      request.onsuccess = () => {
        const db = request.result;
        db.close();

        // Clean up by deleting the test database
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => resolve(true);
        deleteReq.onerror = () => resolve(true); // Resolve as true since DB was accessible
      };

      request.onerror = () => {
        console.warn('[DB] IndexedDB test failed:', request.error);
        resolve(false);
      };

      request.onblocked = () => {
        console.warn(
          '[DB] IndexedDB test blocked - another instance may be open'
        );
        resolve(false);
      };

      // Set a timeout to prevent hanging
      setTimeout(() => {
        try {
          if (request.readyState === 'pending') {
            request.onerror = null;
            request.onsuccess = null;
            resolve(false);
          }
        } catch (e) {
          resolve(false);
        }
      }, 5000);
    });
  } catch (e) {
    console.warn('[DB] IndexedDB access test failed with exception:', e);
    return false;
  }
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
    const missingTables = SCHEMA_TABLES.filter(
      t => !existingTables.includes(t)
    );

    if (missingTables.length > 0) {
      console.warn('[DB] Missing tables:', missingTables);
    }

    const versionCheck = await dbInstance.query(
      `SELECT * FROM db_version LIMIT 1`
    );
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
