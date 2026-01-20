
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

      console.log('PGlite loaded, creating instance...');
      dbInstance = new PGlite({ dataDir: 'idb://accelerator-db-v22' });
      
       console.log('Waiting for database to be ready...');
      let waitAttempts = 0;
      const maxWaitAttempts = 5;

      while (waitAttempts < maxWaitAttempts) {
         try {
           await dbInstance.waitReady;
           break; // Success, exit the loop
         } catch (waitError) {
           waitAttempts++;
           if (waitAttempts >= maxWaitAttempts) {
             console.warn('Database waitReady failed after', maxWaitAttempts, 'attempts, forcing reset:', waitError.message);
             // Force a complete reset by creating a new instance with a different dataDir
             dbInstance = new PGlite({ dataDir: 'idb://accelerator-db-reset-' + Date.now() });
             try {
               await dbInstance.waitReady;
               console.log('Database reset successful');
             } catch (resetError) {
               console.warn('Database reset also failed, using memory-only mode:', resetError.message);
               // As last resort, use memory-only database
               dbInstance = new PGlite();
               await dbInstance.waitReady;
               console.log('Database fallback to memory-only mode successful');
             }
             break;
           } else {
             console.warn('Database waitReady failed (attempt', waitAttempts, '), retrying in', 1000 * waitAttempts, 'ms:', waitError.message);
             await new Promise(resolve => setTimeout(resolve, 1000 * waitAttempts)); // Longer exponential backoff
           }
         }
       }
      console.log('Database ready, creating schema...');
      
      if (!schemaCreated || force) {
        const { createSchema, migrateSchema } = await import('./schema.js');
        console.log('Creating schema...');
        await createSchema();
        console.log('Running migrations...');
        await migrateSchema();
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
