import { dbInstance } from './db-core.js';

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
        created_at TEXT DEFAULT (datetime('now'))
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
        uiStatus TEXT DEFAULT 'in_progress',
        icon TEXT DEFAULT 'folder',
        color TEXT DEFAULT '#9E28B5',
        last_opened TEXT,
        created_at TEXT,
        synced_at TEXT,
        last_modified TEXT,
        sync_status TEXT DEFAULT 'local',
        deleted_at TEXT,
        version INTEGER DEFAULT 1,
        consumed_credits INTEGER DEFAULT 0,
        consumed_time INTEGER DEFAULT 0,
        public INTEGER DEFAULT 0,
        current_step TEXT DEFAULT 'system',
        completed_steps INTEGER DEFAULT 0,
        step_name TEXT DEFAULT 'System Initialization',
        current_model TEXT DEFAULT 'System',
        current_section TEXT DEFAULT 'Initialization',
        ui_progress INTEGER DEFAULT 0,
        ui_message TEXT DEFAULT 'Ready to start',
        current_prompt TEXT,
        llm_response TEXT,
        total_credits INTEGER DEFAULT 600,
        total_steps INTEGER DEFAULT 60,
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
      // Add missing columns to projects table
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
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 60",
      
      // Add missing columns to tasks table
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS content TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS prompt TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS llm_response TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS model TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS section TEXT",
      "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS step_name TEXT",
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
