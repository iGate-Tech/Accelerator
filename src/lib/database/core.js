// db/core.js (or whatever this file is)

import { PGlite } from '@electric-sql/pglite';

export let dbInstance = null;
export let dbReady = false;

let initPromise = null;
let schemaCreated = false;

const DB_NAME = 'accelerator-db-v22';
const DATA_DIR = `idb://${DB_NAME}`;
const INIT_TIMEOUT = 8000;

/**
 * Load WASM module and filesystem bundle manually to avoid bundler issues
 */
async function loadPgliteAssets() {
  const baseUrl = import.meta.env.DEV ? '/' : '/dist/';
  
  const [wasmModule, fsBundle] = await Promise.all([
    WebAssembly.compileStreaming(fetch(`${baseUrl}pglite.wasm`)),
    fetch(`${baseUrl}pglite.data`).then(response => response.blob()),
  ]);
  
  return { wasmModule, fsBundle };
}

/**
 * Initialize database (singleton, safe, race-proof)
 */
export async function initDatabase({ force = false } = {}) {
  if (dbReady && dbInstance && !force) {
    return dbInstance;
  }

  if (initPromise && !force) {
    return initPromise;
  }

   initPromise = (async () => {
     try {
       console.log('[DB] Initializing PGLite…');

       // Load WASM assets manually
       const { wasmModule, fsBundle } = await loadPgliteAssets();

       // --- Create DB (fallback to memory if IndexedDB fails)
       try {
         dbInstance = await PGlite.create({ 
           dataDir: DATA_DIR,
           wasmModule,
           fsBundle
         });
       } catch (e) {
         console.warn('[DB] IndexedDB failed, using memory DB:', e.message);
         try {
           dbInstance = await PGlite.create({ wasmModule, fsBundle });
         } catch (memError) {
           throw new Error(`PGLite initialization failed. Error: ${memError.message}`);
         }
       }

      // --- Wait for DB to be usable
      await dbInstance.waitReady;

      // --- Schema & migrations (only once)
      if (!schemaCreated || force) {
        const { createSchema, migrateSchema } = await import('./schema.js');

        console.log('[DB] Creating schema…');
        await createSchema(dbInstance);

        console.log('[DB] Running migrations…');
        await migrateSchema(dbInstance);

        schemaCreated = true;
      }

      dbReady = true;
      console.log('[DB] Ready');

      return dbInstance;
    } catch (err) {
      throw new Error(`Database initialization failed: ${err.message}`);
    }
  })();

  return initPromise;
}

/**
 * Safe query wrapper
 */
export async function query(sql, params = []) {
  if (!dbReady) {
    await initDatabase();
  }

  try {
    const result = await dbInstance.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } catch (err) {
    console.error('[DB] Query failed:', err);
    throw err;
  }
}

/**
 * Execute raw SQL
 */
export async function exec(sql) {
  if (!dbReady) {
    await initDatabase();
  }

  try {
    await dbInstance.exec(sql);
    return { success: true };
  } catch (err) {
    console.error('[DB] Exec failed:', err);
    throw err;
  }
}

/**
 * Explicit close/reset (used in logout / testing)
 */
export async function close() {
  dbReady = false;
  dbInstance = null;
  initPromise = null;
  schemaCreated = false;
}

/**
 * Guaranteed DB getter (never returns null)
 */
export async function getPg() {
  if (!dbReady) {
    await initDatabase();
  }
  return dbInstance;
}

/**
 * Ensure DB is ready (used by route guards, app boot)
 */
export async function ensureDatabaseReady() {
  await initDatabase();
  // No warning needed, app handles gracefully
}

/**
 * Alias for defensive usage
 */
export const safeQuery = query;
