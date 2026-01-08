import { PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';

worker({
  async init(options) {
    console.log('Worker init called with options:', options);
    const db = new PGlite({
      dataDir: options.dataDir || 'idb://accelerator-db-v6'
    });

    console.log('PGLite instance created');

    // Initialize schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id BIGINT,
        content TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        model TEXT,
        llm_model TEXT,
        section TEXT,
        stepName TEXT,
        prompt TEXT
      );
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Projects (
        id BIGSERIAL PRIMARY KEY,
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
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add ALTER TABLE for existing DBs
    await db.exec(`ALTER TABLE Projects ADD COLUMN IF NOT EXISTS totalCredits REAL;`);
    await db.exec(`ALTER TABLE Projects ADD COLUMN IF NOT EXISTS consumedCredits REAL;`);
    await db.exec(`ALTER TABLE Projects ADD COLUMN IF NOT EXISTS totalTime REAL;`);
    await db.exec(`ALTER TABLE Projects ADD COLUMN IF NOT EXISTS consumedTime REAL;`);
    await db.exec(`ALTER TABLE Projects ADD COLUMN IF NOT EXISTS totalSteps INTEGER;`);
    
    // Groups table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Groups (
        id BIGSERIAL PRIMARY KEY,
        name TEXT,
        description TEXT,
        color TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Project-Group relationships
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ProjectGroups (
        project_id BIGINT REFERENCES Projects(id) ON DELETE CASCADE,
        group_id BIGINT REFERENCES Groups(id) ON DELETE CASCADE,
        addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, group_id)
      );
    `);

    console.log('Database schema initialized successfully');
    return db;
  },
});