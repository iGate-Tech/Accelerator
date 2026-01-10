import { PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';

worker({
  async init(options) {
    console.log('Worker init called with options:', options);
    const db = new PGlite({
      dataDir: options.dataDir || 'idb://accelerator-db-v7'
    });

    console.log('PGLite instance created');

    // Initialize schema with sync columns
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        profile JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'local'
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        session_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'local'
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS Projects (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT,
        description TEXT,
        currentStep TEXT,
        completedSteps INTEGER,
        stepName TEXT,
        currentModel TEXT,
        currentSection TEXT,
        uiProgress REAL,
        uiMessage TEXT,
        uiStatus TEXT,
        totalCredits REAL,
        consumedCredits REAL,
        totalTime REAL,
        consumedTime REAL,
        totalSteps INTEGER,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'local'
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        project_id BIGINT,
        content TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        model TEXT,
        llm_model TEXT,
        section TEXT,
        stepName TEXT,
        prompt TEXT,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'local'
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS Groups (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT,
        description TEXT,
        color TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'local'
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS project_groups (
        project_id BIGINT REFERENCES Projects(id) ON DELETE CASCADE,
        group_id BIGINT REFERENCES Groups(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'local',
        PRIMARY KEY (project_id, group_id)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS credits (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        balance_after REAL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'local'
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS billing (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'local'
      );
    `);

    console.log('Database schema initialized successfully');
    return db;
  },
});