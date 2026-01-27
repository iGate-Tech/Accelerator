import { dbInstance } from './core.js';

export async function createSchema() {
  if (!dbInstance) {
    console.warn('Cannot create schema: database not initialized');
    return false;
  }

  try {
    console.log('Creating database schema...');

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS db_version (
        version INTEGER PRIMARY KEY DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT,
        avatar TEXT,
        bio TEXT,
        preferences TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT,
        email TEXT,
        avatar TEXT,
        bio TEXT,
        interests TEXT,
        goals TEXT,
        onboarding_completed INTEGER DEFAULT 0,
        preferences TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      );
    `);

     await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT,
        last_modified TEXT,
        public INTEGER DEFAULT 0,
        context TEXT DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

     await dbInstance.exec(`
       CREATE TABLE IF NOT EXISTS tasks (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL,
         user_id TEXT NOT NULL,
         title TEXT NOT NULL,
         description TEXT,
         content TEXT,
         prompt TEXT,
         llm_response TEXT,
         model TEXT,
         section TEXT,
         step_name TEXT,
         status TEXT DEFAULT 'pending',
         priority TEXT DEFAULT 'medium',
         due_date TEXT,
         created_at TEXT,
         synced_at TEXT,
         last_modified TEXT,
         sync_status TEXT DEFAULT 'local',
         deleted_at TEXT,
         version INTEGER DEFAULT 1,
         FOREIGN KEY (project_id) REFERENCES projects(id),
         FOREIGN KEY (user_id) REFERENCES users(id)
       );
     `);

      await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS step_data (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          key TEXT NOT NULL,
          value JSONB,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(project_id, key),
          FOREIGN KEY (project_id) REFERENCES projects(id)
        );
      `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT 'folder',
        color TEXT DEFAULT '#9E28B5',
        created_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS project_groups (
        project_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        PRIMARY KEY (project_id, group_id),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (group_id) REFERENCES groups(id)
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS credits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER DEFAULT 0,
        description TEXT,
        created_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS billing (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        due_date TEXT,
        paid_at TEXT,
        created_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

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
        version INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL DEFAULT 0,
        credits_included INTEGER DEFAULT 0,
        features TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        package_id TEXT,
        name TEXT,
        status TEXT DEFAULT 'active',
        price REAL DEFAULT 0,
        credits_included INTEGER DEFAULT 0,
        start_date TEXT,
        end_date TEXT,
        auto_renew INTEGER DEFAULT 1,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (package_id) REFERENCES packages(id)
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_collaborators (
        id TEXT PRIMARY KEY,
        portfolio_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'viewer',
        added_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_invitations (
        id TEXT PRIMARY KEY,
        portfolio_id TEXT NOT NULL,
        invitee_email TEXT NOT NULL,
        role TEXT DEFAULT 'viewer',
        status TEXT DEFAULT 'pending',
        message TEXT,
        sent_at TEXT,
        responded_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        description TEXT,
        metadata TEXT,
        created_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS project_votes (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        vote_type TEXT NOT NULL,
        created_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(project_id, user_id)
      );
    `);

    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT,
        used_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    console.log('Database schema created successfully');
    return true;
  } catch (error) {
    console.error('Error creating database schema:', error);
    return false;
  }
}

export async function migrateSchema() {
  if (!dbInstance) {
    console.warn('Cannot migrate schema: database not initialized');
    return false;
  }

  try {
    console.log('Running schema migrations...');
    
    const migrations = [
      // Fix ui_status column name mismatch (rename uiStatus to ui_status)
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS ui_status TEXT DEFAULT 'idle'",

      // Add missing columns to projects table
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived INTEGER DEFAULT 0",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_step TEXT DEFAULT 'system'",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_steps INTEGER DEFAULT 0",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS step_name TEXT DEFAULT 'System Initialization'",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_model TEXT DEFAULT 'System'",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_section TEXT DEFAULT 'Initialization'",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS ui_progress INTEGER DEFAULT 0",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS ui_message TEXT DEFAULT 'Ready to start'",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_prompt TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS llm_response TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 600",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 59",

      // Add missing created_at column to users table
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TEXT",

      // Add missing ip_address and user_agent columns to user_activities table
      "ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS ip_address TEXT",
      "ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS user_agent TEXT",

      // Add missing columns to tasks table
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS content TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS prompt TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS llm_response TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS model TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS section TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS step_name TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'",

      // Add current_project_id to profiles table for tracking user's current project
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_project_id TEXT",

      // Add context column to projects table for storing aggregated context
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS context TEXT DEFAULT ''",

      // Drop legacy columns that are no longer needed
      "ALTER TABLE projects DROP COLUMN IF EXISTS ui_status",
      "ALTER TABLE projects DROP COLUMN IF EXISTS icon",
      "ALTER TABLE projects DROP COLUMN IF EXISTS color",
      "ALTER TABLE projects DROP COLUMN IF EXISTS last_opened",
      "ALTER TABLE projects DROP COLUMN IF EXISTS synced_at",
      "ALTER TABLE projects DROP COLUMN IF EXISTS sync_status",
      "ALTER TABLE projects DROP COLUMN IF EXISTS deleted_at",
      "ALTER TABLE projects DROP COLUMN IF EXISTS version",
      "ALTER TABLE projects DROP COLUMN IF EXISTS consumed_credits",
      "ALTER TABLE projects DROP COLUMN IF EXISTS consumed_time",
      "ALTER TABLE projects DROP COLUMN IF EXISTS current_step",
      "ALTER TABLE projects DROP COLUMN IF EXISTS completed_steps",
      "ALTER TABLE projects DROP COLUMN IF EXISTS step_name",
      "ALTER TABLE projects DROP COLUMN IF EXISTS current_model",
      "ALTER TABLE projects DROP COLUMN IF EXISTS current_section",
      "ALTER TABLE projects DROP COLUMN IF EXISTS ui_progress",
      "ALTER TABLE projects DROP COLUMN IF EXISTS ui_message",
      "ALTER TABLE projects DROP COLUMN IF EXISTS current_prompt",
      "ALTER TABLE projects DROP COLUMN IF EXISTS llm_response",
      "ALTER TABLE projects DROP COLUMN IF EXISTS total_credits",
      "ALTER TABLE projects DROP COLUMN IF EXISTS total_steps",
    ];

    for (const migration of migrations) {
      try {
        await dbInstance.exec(migration);
      } catch (err) {
        if (!err.message.includes('already exists') && !err.message.includes('no such column')) {
          console.warn('Migration warning:', err.message);
        }
      }
    }

    console.log('Schema migrations completed');
    return true;
  } catch (error) {
    console.error('Error running schema migrations:', error);
    return false;
  }
}
