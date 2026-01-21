// src/lib/database/core.js
// PGLite with IndexedDB persistence

import { PGlite } from '@electric-sql/pglite';

export let dbInstance = null;
export let dbReady = false;
export let dbError = null;

let initPromise = null;
let schemaCreated = false;

function isBrowser() {
  return typeof window !== 'undefined';
}

async function testIndexedDBAccess() {
  if (!isBrowser()) return false;
  
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

export async function ensureDatabaseReady() {
  if (dbReady && dbInstance) return dbInstance;
  return await initDatabase();
}

export async function initDatabase({ force = false } = {}) {
  if (dbReady && dbInstance && !force) return dbInstance;
  if (initPromise && !force) return initPromise;

  initPromise = (async () => {
    try {
      console.log('[DB] Initializing PGLite...');
      dbError = null;

      const idbAvailable = isBrowser() && await testIndexedDBAccess();
      
      if (idbAvailable) {
        console.log('[DB] Creating PGLite with IndexedDB...');
        dbInstance = await PGlite.create('idb://accelerator_db', {
          relaxedDurability: true
        });
      } else {
        console.log('[DB] Using in-memory database');
        dbInstance = await PGlite.create({
          relaxedDurability: true
        });
      }

      await dbInstance.waitReady;
      console.log('[DB] PGLite ready');

      if (!schemaCreated || force) {
        const { createSchema, migrateSchema } = await import('./schema.js');
        await createSchema(dbInstance);
        await migrateSchema(dbInstance);
        schemaCreated = true;
        console.log('[DB] Schema ready');
      }

      dbReady = true;
      console.log('[DB] Database ready');
      return dbInstance;
    } catch (error) {
      console.error('[DB] Init error:', error);
      dbError = error;
      dbReady = false;
      throw error;
    }
  })();

  return initPromise;
}

export async function query(sql, params = []) {
  const db = await ensureDatabaseReady();
  return db.query(sql, params);
}

export async function exec(sql) {
  const db = await ensureDatabaseReady();
  return db.exec(sql);
}

export async function getPg() {
  return await ensureDatabaseReady();
}

export async function safeQuery(sql, params = []) {
  try {
    const db = await ensureDatabaseReady();
    return await db.query(sql, params);
  } catch (error) {
    console.error('[DB] safeQuery error:', error);
    return null;
  }
}

export function getDbStatus() {
  return { ready: dbReady, schemaCreated, error: dbError?.message || null };
}

export async function close() {
  if (dbInstance) await dbInstance.close();
  dbReady = false;
  dbInstance = null;
  initPromise = null;
  schemaCreated = false;
  dbError = null;
}
