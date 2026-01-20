
export let dbInstance = null;
export let dbReady = false;
let initPromise = null;
let pgLiteLoading = false;
let schemaCreated = false;

export async function initDatabase(options = {}) {
  const { timeout = 5000, force = false } = options; // Increased timeout
  
  if (dbReady && !force) {
    console.log('Database already ready, returning instance');
    return dbInstance;
  }
  
  if (initPromise && !force) {
    console.log('Database initialization already in progress, waiting for it');
    return initPromise;
  }

  // Prevent multiple simultaneous initialization attempts
  if (pgLiteLoading) {
    console.log('PGLite loading in progress, waiting...');
    // Wait a bit and check again
    await new Promise(resolve => setTimeout(resolve, 500));
    if (dbReady) return dbInstance;
    if (initPromise) return initPromise;
  }

  initPromise = (async () => {
    pgLiteLoading = true;
    try {
      console.log('Starting PGLite database initialization...');
      
      const { PGlite } = await Promise.race([
        import('@electric-sql/pglite'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PGLite load timeout')), timeout)
        )
      ]);

      console.log('PGlite loaded, clearing any existing IndexedDB data...');
      if (window.indexedDB) {
        try {
          await new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase('accelerator-db-v22');
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          console.log('Cleared existing IndexedDB database');
        } catch (e) {
          console.warn('Failed to clear IndexedDB, proceeding anyway:', e);
        }
      }

      console.log('Creating PGLite instance...');
      dbInstance = new PGlite({ dataDir: 'idb://accelerator-db-v22' });

      console.log('Database instance created, initializing schema...');
      
      if (!schemaCreated || force) {
        const { createSchema, migrateSchema } = await import('./schema.js');
        console.log('Creating schema...');
        const schemaSuccess = await createSchema();
        console.log('Running migrations...');
        const migrateSuccess = await migrateSchema();

        schemaCreated = true;
        console.log('Schema created and migrations completed');
      }
      
      dbReady = true;
      console.log('PGLite database initialized successfully');
      pgLiteLoading = false;

      // Schedule automatic data retention enforcement for GDPR compliance
      try {
        const { scheduleDataRetention } = await import('../db.js');
        scheduleDataRetention();
        console.log('Data retention scheduler started');
      } catch (error) {
        console.warn('Failed to start data retention scheduler:', error.message);
      }

      return dbInstance;
    } catch (error) {
      console.warn('Database init failed (non-blocking):', error.message);
      dbReady = false;
      pgLiteLoading = false;
      return null;
    }
  })();

  return initPromise;
}

export async function query(sql, params = []) {
  if (!dbInstance) return { rows: [], rowCount: 0 };
  try {
    const result = await dbInstance.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } catch (error) {
    return { rows: [], rowCount: 0 };
  }
}

export async function exec(sql) {
  if (!dbInstance) return { success: false };
  try {
    await dbInstance.exec(sql);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function close() {
  dbReady = false;
  dbInstance = null;
}

export const getPg = async () => {
  if (!dbReady && !initPromise) {
    initDatabase().catch(() => {});
  }
  return dbInstance;
};

export const ensureDatabaseReady = async () => {
  if (!dbReady) {
    await initDatabase();
  }
};

export const safeQuery = async (sql, params = []) => {
  return query(sql, params);
};
