import { PGlite } from '@electric-sql/pglite';
import { v4 as uuidv4 } from 'uuid';

// -----------------------------------------------------------------------------
// Global DB Instance and Pending Requests Map
// -----------------------------------------------------------------------------
let dbInstance = null;
let pendingRequests = new Map();

// -----------------------------------------------------------------------------
// Check PGLite availability
// -----------------------------------------------------------------------------
console.log('Worker starting, checking PGLite availability...');
console.log('PGLite available:', typeof PGlite !== 'undefined');

// Global error handler for worker
self.onerror = (error) => {
  console.error('[DB Worker] Global error:', error);
};

// Handle unhandled promise rejections
self.onunhandledrejection = (event) => {
  console.error('[DB Worker] Unhandled promise rejection:', event.reason);
  event.preventDefault();
};

// -----------------------------------------------------------------------------
// Database Worker Class with All Operations
// -----------------------------------------------------------------------------
const DatabaseWorker = {
  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  async initDatabase(options = {}) {
    console.log('initDatabase called with options:', options);

    try {
      console.log('Creating PGLite database instance...');
      dbInstance = new PGlite(options.dataDir || 'idb://accelerator-db-v22');
      console.log('PGLite database instance created successfully');
    } catch (error) {
      console.error('Failed to create PGLite instance:', error);
      throw error;
    }

    // Always ensure schema exists (CREATE IF NOT EXISTS will handle duplicates)
    console.debug('[DB Worker] Ensuring database schema exists...');

    // Full Schema - Create if not exists for faster init
    try {
      console.log('Creating database schema...');
      // Create tables one by one
      console.log('Creating users table...');
      await dbInstance.exec("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT, avatar TEXT DEFAULT '/src/assets/avatar.png', bio TEXT, preferences TEXT, synced_at TEXT, last_modified TEXT, sync_status TEXT DEFAULT 'local', deleted_at TEXT, version INTEGER DEFAULT 1)");
      console.log('Users table created');
      await dbInstance.exec(`
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_step TEXT,
  completed_steps INTEGER,
  step_name TEXT,
  current_model TEXT,
  current_section TEXT,
  ui_progress REAL,
  ui_message TEXT,
  ui_status TEXT,
  total_credits REAL DEFAULT 0,
  consumed_credits REAL DEFAULT 0,
  total_time REAL DEFAULT 0,
  consumed_time REAL DEFAULT 0,
  total_steps INTEGER,
  public INTEGER DEFAULT 0,
  current_prompt TEXT,
  llm_response TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  content TEXT,
  prompt TEXT,
  llm_response TEXT,
  model TEXT,
  section TEXT,
  step_name TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Project Groups table
CREATE TABLE IF NOT EXISTS project_groups (
  project_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1,
  PRIMARY KEY (project_id, group_id)
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  balance_after REAL,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  due_date TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Notifications table
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
  version INTEGER DEFAULT 1
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  credits_included INTEGER NOT NULL,
  features TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TEXT DEFAULT CURRENT_TIMESTAMP,
  end_date TEXT,
  auto_renew INTEGER DEFAULT 1,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  avatar TEXT,
  bio TEXT,
  preferences TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Portfolio Collaborators table
CREATE TABLE IF NOT EXISTS portfolio_collaborators (
  id TEXT PRIMARY KEY,
  portfolio_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Portfolio Invitations table
CREATE TABLE IF NOT EXISTS portfolio_invitations (
  id TEXT PRIMARY KEY,
  portfolio_id INTEGER NOT NULL,
  inviter_id TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  status TEXT DEFAULT 'pending',
  message TEXT,
  invited_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  responded_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- User Activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'local',
  deleted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Project Votes table
CREATE TABLE IF NOT EXISTS project_votes (
  id TEXT PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
      `);
       console.log('Database schema created successfully');
       console.debug('Database schema initialized successfully');
    } catch (schemaError) {
      console.error('Failed to initialize database schema:', schemaError);
      throw schemaError;
    }
    return { success: true };
  },

  // ---------------------------------------------------------------------------
  // Generic Helpers
  // ---------------------------------------------------------------------------
  async getEntities({ table, selectFields = '*', whereClause = '', orderBy = '', params = [] }) {
    try {
      const query = `SELECT ${selectFields} FROM ${table} ${whereClause} ${orderBy}`;
      const res = await dbInstance.query(query, params);
      return res;
    } catch (err) {
      console.error(`DB error in getEntities for ${table}:`, err);
      return [];
    }
  },

  async updateEntity({ table, idField, id, updates, options = {} }) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (options.beforeUpdate) options.beforeUpdate(updates);

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const dbField = options.fieldMappings?.[key] || key;
        const processedValue = (typeof value === 'object' && value !== null && !(value instanceof Date)) ? JSON.stringify(value) : (value instanceof Date ? value.toISOString() : value);
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(processedValue);
        paramIndex++;
      }
    }

    if (!updates.last_modified) fields.push(`last_modified = CURRENT_TIMESTAMP`);
    if (!updates.sync_status) fields.push(`sync_status = 'local'`);

    if (options.alwaysUpdate) {
      for (const [field, value] of Object.entries(options.alwaysUpdate)) {
        if (!updates.hasOwnProperty(field)) fields.push(`${field} = ${value}`);
      }
    }

    if (!fields.length) return { success: false, error: 'No fields to update' };

    values.push(id);
    const query = `UPDATE ${table} SET ${fields.join(', ')} WHERE ${Array.isArray(idField) ? idField.map((f,i)=>`${f}=$${paramIndex+i}`).join(' AND ') : `${idField}=$${paramIndex}`}`;

    try {
      const res = await dbInstance.query(query, values);
      return { success: true, data: res.rows[0] };
    } catch (err) {
      console.error(`DB error in updateEntity for ${table}:`, err);
      return { success: false, error: err.message };
    }
  },

  // ---------------------------------------------------------------------------
  // User Operations
  // ---------------------------------------------------------------------------
  async createUser({ email, passwordHash, profile = {}, userId = null }) {
    if (!email) {
      throw new Error('Email is required for user creation');
    }
    try {
      const id = userId || uuidv4();
      const query = "INSERT INTO users (id, email, password_hash, profile, created_at, last_modified, synced_at, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
      const params = [
        id,
        email,
        passwordHash || '',
        JSON.stringify(profile || {}),
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        'local',
        null,
        1
      ];
      console.debug('Executing createUser query:', query, 'params:', params);
      const res = await dbInstance.query(query, params);
      return { id, email };
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  },

  async getUserById({ id }) {
    if (!id) {
      console.error('getUserById: id parameter is required');
      return null;
    }
    try {
      const res = await dbInstance.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0];
    } catch (err) {
      console.error('Error getting user by id:', err);
      return null;
    }
  },

   async getUserByEmail({ email }) {
     try {
       const res = await dbInstance.query('SELECT * FROM users WHERE email = $1', [email]);
       return res.rows[0];
     } catch (err) {
       console.error('Error getting user by email:', err);
       return null;
     }
   },

  async updateUser({ id, updates }) {
    try {
      const processedUpdates = { ...updates };
      if (updates.profile !== undefined) {
        processedUpdates.profile = JSON.stringify(updates.profile);
      }
      const result = await this.updateEntity({ table: 'users', idField: 'id', id, updates: processedUpdates, options: {
        alwaysUpdate: { 'updated_at': 'CURRENT_TIMESTAMP' }
      }});
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  },

   async deleteUser({ id }) {
     try {
       await dbInstance.query('DELETE FROM users WHERE id = $1', [id]);
       return { success: true };
     } catch (err) {
       console.error('Error deleting user:', err);
       throw err;
     }
   },

  // ---------------------------------------------------------------------------
  // Profile Operations
  // ---------------------------------------------------------------------------
  async createUserProfile({ userId, profileData = {} }) {
    try {
        const res = await dbInstance.query(
          `INSERT INTO profiles
          (user_id, avatar, bio, preferences, synced_at, last_modified, sync_status, deleted_at, version)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (user_id) DO NOTHING RETURNING *`,
           [
             userId,
             String(profileData.avatar || '/src/assets/avatar.png'),
             String(profileData.bio || ''),
             JSON.stringify(profileData.preferences || {
               notifications: { email: true, browser: false, projectUpdates: true },
               privacy: { profileVisibility: 'private', dataSharing: false }
             }),
             new Date().toISOString(),
             new Date().toISOString(),
             'local',
             null,
             1
           ]
        );
      return res.rows[0];
    } catch (err) {
      console.error('Error creating user profile:', err);
      throw err;
    }
  },

   async getUserProfile({ userId }) {
     try {
       const res = await dbInstance.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
       return res.rows[0] || null;
     } catch (err) {
       console.error('Error getting user profile:', err);
       return null;
     }
   },

  // ---------------------------------------------------------------------------
  // Project Operations
  // ---------------------------------------------------------------------------
  async createProject({ project, userId }) {
    try {
      const id = uuidv4();
      const res = await dbInstance.query(`
        INSERT INTO projects (id, name, description, user_id, created_at, last_modified, synced_at, sync_status, deleted_at, version, public, current_model, total_steps, completed_steps, consumed_credits, total_credits, ui_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `, [
        id,
        project.name,
        project.description,
        userId,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        'local',
        null,
        1,
        Boolean(project.public) || false,
        project.currentModel || null,
        Number(project.totalSteps) || 51,
        Number(project.completedSteps) || 0,
        Number(project.consumedCredits) || 0,
        Number(project.totalCredits) || 100,
        project.uiStatus || 'idle'
      ]);
      return res.rows[0];
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  },

  async getProjects({ userId = null }) {
    try {
      console.debug('Worker getProjects userId:', userId, 'type:', typeof userId);
      if (!userId) {
        throw new Error('userId required for getProjects');
      }
       const res = await dbInstance.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY id DESC', [userId]);
      return res.rows;
    } catch (err) {
      console.error('Error in worker getProjects:', err);
      return [];
    }
  },

   async getProjectById({ id }) {
     try {
       const res = await dbInstance.query('SELECT * FROM projects WHERE id = $1', [id]);
       return res.rows[0];
     } catch (err) {
       console.error('Error loading project:', err);
       return null;
     }
   },

  async updateProject({ id, project }) {
    console.debug('Worker updateProject called with id:', id, 'project:', project);

    // Validate parameters
    if (!id) throw new Error('Project ID is required in worker');
    if (!project || typeof project !== 'object') throw new Error('Project data must be an object in worker');

    try {
      const result = await this.updateEntity({ table: 'projects', idField: 'id', id, updates: project });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  },

  async deleteProject({ id }) {
    try {
       // First delete all associated tasks
       await dbInstance.query('DELETE FROM tasks WHERE project_id = $1', [id]);
       // Then delete the project
       await dbInstance.query('DELETE FROM projects WHERE id = $1', [id]);
      return { success: true };
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  },

  async deleteAllProjects() {
    try {
      // First delete all tasks
      await dbInstance.query('DELETE FROM tasks');
      // Then delete all projects
      await dbInstance.query('DELETE FROM projects');
      return { success: true };
    } catch (err) {
      console.error('Error deleting all projects:', err);
      throw err;
    }
  },

  async toggleProjectPublic({ projectId, isPublic }) {
    try {
      const result = await this.updateEntity({ table: 'projects', idField: 'id', id: projectId, updates: { public: isPublic } });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    } catch (err) {
      console.error('Error toggling project public status:', err);
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  // Task Operations
  // ---------------------------------------------------------------------------
  async getTasks({ project_id = null, userId = null }) {
    try {
      // Only return tasks if a project is selected
      if (!project_id) {
        return [];
      }

      let query = 'SELECT * FROM tasks';
      let params = [];
      const conditions = [];
      conditions.push(`project_id = $${params.length + 1}`);
      params.push(project_id);
      if (userId) {
        conditions.push(`user_id = $${params.length + 1}`);
        params.push(userId);
      }
      query += ' WHERE ' + conditions.join(' AND ');
       query += ' ORDER BY created_at DESC';
      const res = await dbInstance.query(query, params);
      return res.rows;
    } catch (err) {
      console.error('DB error in getTasks:', err);
      return [];
    }
  },

  async addTask({ task, project_id, userId }) {
    try {
      const id = uuidv4();
        await dbInstance.query(
          `INSERT INTO tasks
          (id, user_id, project_id, content, prompt, llm_response, model, section, step_name, created_at, synced_at, last_modified, sync_status, deleted_at, version)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [id, userId, project_id, task.content, task.prompt || null, null, task.model || null, task.section || null, task.stepName || null, task.timestamp || new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
        );
      return { success: true };
    } catch (err) {
      console.error('DB error in addTask:', err);
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  // Group Operations
  // ---------------------------------------------------------------------------
   async getGroups({ userId = null }) {
     const whereClause = userId ? 'WHERE user_id = $1' : '';
     const params = userId ? [userId] : [];
     const query = `SELECT * FROM groups ${whereClause} ORDER BY created_at DESC`;
     const res = await dbInstance.query(query, params);
     return res.rows;
   },

   async getGroupById({ id }) {
     try {
       const res = await dbInstance.query('SELECT * FROM groups WHERE id = $1', [id]);
       return res.rows[0];
     } catch (err) {
       console.debug('Error loading group:', err);
       return null;
     }
   },

  async addGroup({ group, userId }) {
    try {
        const id = uuidv4();
        const res = await dbInstance.query(
          'INSERT INTO groups (id, user_id, name, description, color, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
          [id, userId, group.name, group.description || '', group.color || '#6366f1', group.createdAt || new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
        );
      return res.rows[0];
    } catch (err) {
      console.debug('Error adding group:', err);
      throw err;
    }
  },

  async updateGroup({ id, group }) {
    try {
      const result = await this.updateEntity({ table: 'groups', idField: 'id', id, updates: group });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (err) {
      console.debug('Error updating group:', err);
      throw err;
    }
  },

  async deleteGroup({ id }) {
    try {
       await dbInstance.query('DELETE FROM project_groups WHERE group_id = $1', [id]);
       await dbInstance.query('DELETE FROM groups WHERE id = $1', [id]);
      return { success: true };
    } catch (err) {
      console.debug('Error deleting group:', err);
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  // Project Group Operations
  // ---------------------------------------------------------------------------
  async addProjectToGroup({ projectId, groupId }) {
    try {
       await dbInstance.query(
         'INSERT INTO project_groups (project_id, group_id, added_at) VALUES ($1, $2, $3) ON CONFLICT (project_id, group_id) DO NOTHING',
         [projectId, groupId, new Date().toISOString()]
       );
      return { success: true };
    } catch (err) {
      console.debug('Error adding project to group:', err);
      throw err;
    }
  },

  async removeProjectFromGroup({ projectId, groupId }) {
    try {
       await dbInstance.query('DELETE FROM project_groups WHERE project_id = $1 AND group_id = $2', [projectId, groupId]);
      return { success: true };
    } catch (err) {
      console.debug('Error removing project from group:', err);
      throw err;
    }
  },

  async getProjectsInGroup({ groupId }) {
    try {
       const res = await dbInstance.query(`
         SELECT p.*, pg.added_at as addedToGroupAt
         FROM projects p
         JOIN project_groups pg ON p.id = pg.project_id
         WHERE pg.group_id = $1
         ORDER BY pg.added_at DESC
       `, [groupId]);
      return res.rows;
    } catch (err) {
      console.debug('Error getting projects in group:', err);
      return [];
    }
  },

  async getUngroupedProjects({ userId = null }) {
    try {
      const result = await dbInstance.query(`
        SELECT p.* FROM projects p
        LEFT JOIN project_groups pg ON p.id = pg.project_id
        WHERE pg.group_id IS NULL AND p.user_id = $1::text
      `, [userId]);
      return result.rows;
    } catch (err) {
      console.error('Error getting ungrouped projects:', err);
      return [];
    }
  },

  async getGroupsWithProjects({ userId = null }) {
    try {
      const groups = await this.getGroups({ userId });
      const groupsWithProjects = await Promise.all(
        groups.map(async (group) => ({
          ...group,
          projects: await this.getProjectsInGroup({ groupId: group.id })
        }))
      );
      return groupsWithProjects;
    } catch (err) {
      console.debug('Error getting groups with projects:', err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // Credit Operations
  // ---------------------------------------------------------------------------
   async getUserCredits({ userId }) {
     try {
       const result = await this.getEntities({ table: 'credits', selectFields: '*', whereClause: 'WHERE user_id = $1', orderBy: 'ORDER BY created_at DESC', params: [userId] });
       return result.rows;
     } catch (err) {
       console.error('Error getting user credits:', err);
       return [];
     }
   },

   async getCreditTransactions({ userId }) {
     try {
       const result = await this.getEntities({ table: 'credits', selectFields: '*', whereClause: 'WHERE user_id = $1', orderBy: 'ORDER BY created_at DESC', params: [userId] });
       return result.rows;
     } catch (err) {
       console.error('Error getting credit transactions:', err);
       return [];
     }
   },

   async getCreditBalance({ userId }) {
     try {
       const result = await dbInstance.query(
         'SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE user_id = $1',
         [userId]
       );
       return result.rows[0].balance || 0;
     } catch (err) {
       console.error('Error getting credit balance:', err);
       return 0;
     }
   },

   async getUserCreditBalance({ userId }) {
     try {
       const result = await dbInstance.query(
         'SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE user_id = $1',
         [userId]
       );
       return result.rows[0].balance || 0;
     } catch (err) {
       console.error('Error getting user credit balance:', err);
       return 0;
     }
   },

  async addCreditTransaction({ userId, type, amount, description }) {
    try {
       amount = parseFloat(amount);
       const balanceResult = await dbInstance.query('SELECT SUM(amount) as balance FROM credits WHERE user_id = $1', [userId]);
       const currentBalance = parseFloat(balanceResult.rows[0]?.balance || 0);
       const balance_after = currentBalance + amount;
        const id = uuidv4();
        await dbInstance.query(
          'INSERT INTO credits (id, user_id, type, amount, description, balance_after, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
          [id, userId, type, amount, description, balance_after, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
        );
      return { id, user_id: userId, type, amount, description, balance_after, date: new Date().toISOString() };
    } catch (err) {
      console.error('Error adding credit transaction:', err);
      throw err;
    }
  },

  async consumeCredits({ userId, amount, description }) {
    try {
      await this.addCreditTransaction({ userId, type: 'usage', amount: -amount, description });
      return true;
    } catch (err) {
      console.error('Error consuming credits:', err);
      throw err;
    }
   },

   // ---------------------------------------------------------------------------
   // Activity Logging Operations (v2)
   // ---------------------------------------------------------------------------
   async logActivity({ userId, actionType, entityType, entityId, description, metadata = {} }) {
    try {
      const id = uuidv4();
        const res = await dbInstance.query(
          'INSERT INTO user_activities (id, user_id, action_type, entity_type, entity_id, description, metadata, ip_address, user_agent, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
          [id, userId, actionType, entityType, entityId, description, JSON.stringify(metadata), null, null, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
        );
       return res.rows[0];
     } catch (err) {
       console.error('Error logging activity:', err);
       throw err;
     }
   },

   async getUserActivities({ userId, limit = 50, offset = 0 }) {
     try {
         const res = await dbInstance.query(
           'SELECT * FROM user_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
           [userId, limit, offset]
         );
       return res.rows;
     } catch (err) {
       console.error('Error getting user activities:', err);
       return [];
     }
   },

   // ---------------------------------------------------------------------------
   // Billing Operations
   // ---------------------------------------------------------------------------
  async addBillingRecord({ userId, type, amount, description, dueDate = null }) {
    try {
      const id = uuidv4();
        const res = await dbInstance.query(
          'INSERT INTO billing (id, user_id, type, amount, status, description, due_date, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id',
          [id, userId, type, amount, 'pending', description, dueDate, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
        );
      return res.rows[0];
    } catch (err) {
      console.debug('Error adding billing record:', err);
      throw err;
    }
  },

  async getUserBilling({ userId }) {
    try {
       const res = await dbInstance.query(
         'SELECT * FROM billing WHERE user_id = $1 ORDER BY last_modified DESC',
         [userId]
       );
      return res.rows;
    } catch (err) {
      console.debug('Error getting user billing:', err);
      return [];
    }
  },

  async updateBillingStatus({ id, status }) {
    try {
       await dbInstance.query('UPDATE billing SET status = $1, last_modified = $2 WHERE id = $3', [status, new Date().toISOString(), id]);
      return { success: true };
    } catch (err) {
      console.debug('Error updating billing status:', err);
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  // Notification Operations
  // ---------------------------------------------------------------------------
  async createNotification({ userId, type, title, message }) {
    try {
      const id = uuidv4();
      await dbInstance.query(
        `INSERT INTO notifications (id,user_id,type,title,message,read,created_at,synced_at,last_modified,sync_status,deleted_at,version)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [id, userId, type, title, message, 0, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
      );
      return { id };
    } catch (err) {
      console.error('Error creating notification:', err);
      throw err;
    }
  },

  async getUserNotifications({ userId }) {
    const res = await dbInstance.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  },

  async markNotificationRead({ notificationId, userId }) {
    await dbInstance.query('UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2', [notificationId, userId]);
  },

   async updateUserSubscription({ userId, subscriptionId, updates }) {
     try {
        const result = await this.updateEntity({ table: 'user_subscriptions', idField: 'id', id: subscriptionId, updates });
       if (!result.success) {
         throw new Error(result.error);
       }
       return result.data;
     } catch (err) {
       console.error('Error updating user subscription:', err);
       throw err;
     }
   },

   async changeUserSubscription({ userId, newPackageId, currentSubscription }) {
     try {
       // If there's a current subscription, update it or cancel it
       if (currentSubscription) {
          await this.updateEntity({ table: 'user_subscriptions', idField: 'id', id: currentSubscription.id, updates: {
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          } });
       }

       // Create new subscription
       const subscriptionData = {
         user_id: userId,
         package_id: newPackageId,
         status: 'active',
         subscribed_at: new Date().toISOString(),
         synced_at: new Date().toISOString(),
         last_modified: new Date().toISOString(),
         sync_status: 'local'
       };

       const result = await this.createUserSubscription({ userId, packageId: newPackageId, subscriptionData });
       return result;
     } catch (err) {
       console.error('Error changing user subscription:', err);
       throw err;
     }
   },

  // ---------------------------------------------------------------------------
  // Vote Operations
  // ---------------------------------------------------------------------------
  async voteOnProject({ projectId, userId, voteType }) {
    try {
       const existingVote = await dbInstance.query(
         'SELECT id, vote_type FROM project_votes WHERE project_id = $1 AND user_id = $2',
         [projectId, userId]
       );
       if (existingVote.rows.length > 0) {
         const currentVote = existingVote.rows[0];
         if (currentVote.vote_type === voteType) {
           await dbInstance.query('DELETE FROM project_votes WHERE id = $1', [currentVote.id]);
           return { action: 'removed', voteType: null };
         } else {
           await dbInstance.query('UPDATE project_votes SET vote_type = $1 WHERE id = $2', [voteType, currentVote.id]);
           return { action: 'changed', voteType };
         }
       } else {
          await dbInstance.query(
            'INSERT INTO project_votes (project_id, user_id, vote_type, created_at) VALUES ($1, $2, $3, $4)',
            [projectId, userId, voteType, new Date().toISOString()]
          );
         return { action: 'added', voteType };
       }
    } catch (err) {
      console.debug('Error voting on project:', err);
      throw err;
    }
  },

  async getProjectVotes({ projectId }) {
    try {
       const res = await dbInstance.query(`
         SELECT vote_type, COUNT(*) as count
         FROM project_votes
         WHERE project_id = $1
         GROUP BY vote_type
       `, [projectId]);
      return res.rows;
    } catch (err) {
      console.debug('Error getting project votes:', err);
      return [];
    }
  },

  async getPublicProjectsWithVotes({ currentUserId }) {
    try {
      const res = await dbInstance.query(`
        SELECT
          p.*,
          COALESCE(v.user_vote, null) as user_vote,
          COALESCE(vs.upvotes, 0) as upvotes,
          COALESCE(vs.downvotes, 0) as downvotes
        FROM projects p
        LEFT JOIN (
          SELECT project_id,
                 vote_type as user_vote
          FROM project_votes
           WHERE user_id = $1
        ) v ON p.id = v.project_id
        LEFT JOIN (
          SELECT project_id,
               COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
               COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes
          FROM project_votes
          GROUP BY project_id
        ) vs ON p.id = vs.project_id
        WHERE p.public = true
        ORDER BY (COALESCE(vs.upvotes, 0) - COALESCE(vs.downvotes, 0)) DESC, p.last_modified DESC
      `, [currentUserId]);
      return res.rows;
    } catch (err) {
      console.debug('Error getting public projects with votes:', err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // Sample Data Seeding
  // ---------------------------------------------------------------------------
  async seedSampleNotifications({ userId }) {
    try {
      const existingNotifications = await dbInstance.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1', [userId]);
      if (existingNotifications.rows[0].count > 0) {
        return { message: 'User already has notifications' };
      }

      const sampleNotifications = [
        {
          type: 'system',
          title: 'Welcome to Accelerator Platform',
          message: 'Your account has been successfully created. Complete your profile to unlock all features.',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'credits',
          title: 'Welcome Credits Added',
          message: 'You\'ve received 50 free AI credits to explore our platform.',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'system',
          title: 'Account Verification Complete',
          message: 'Your email has been verified.',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'update',
          title: 'Platform Update',
          message: 'Enhanced AI models available.',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'system',
          title: 'Getting Started Guide',
          message: 'Check out our guide.',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ];

      for (const notification of sampleNotifications) {
        await this.createNotification({ userId, ...notification });
      }

      return { message: 'Sample notifications seeded successfully' };
    } catch (err) {
      console.debug('Error creating sample notifications:', err.message);
      throw err;
    }
  },

  async getLocalChanges({ tableName }) {
    // TODO: Implement proper local changes tracking based on sync_status
    // For now, return empty array to prevent sync errors
    return [];
  },

  async createSession({ userId, token, expiresAt }) {
    try {
      const id = uuidv4();
      const res = await dbInstance.query(
        'INSERT INTO sessions (id, user_id, token, expires_at, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [id, userId, token, expiresAt, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
      );
      return res.rows[0];
    } catch (err) {
      console.debug('Error creating session:', err);
      throw err;
    }
  },

  async getSessionByToken({ token }) {
    try {
      const res = await dbInstance.query('SELECT * FROM sessions WHERE token = $1', [token]);
      return res.rows[0];
    } catch (err) {
      console.debug('Error getting session by token:', err);
      throw err;
    }
  },

  async deleteSession({ token }) {
    await dbInstance.query('DELETE FROM sessions WHERE token = $1', [token]);
  },

  async deleteExpiredSessions() {
    await dbInstance.query('DELETE FROM sessions WHERE expires_at < $1', [new Date().toISOString()]);
  },

  async updateBillingStatus({ userId, status }) {
    await dbInstance.query('UPDATE users SET billing_status = $1 WHERE id = $2', [status, userId]);
  },

  async seedPackages() {
     try {
       console.log('Seeding packages...');
       const packages = [
         {
           id: 'free',
           name: 'Free',
           description: 'Basic plan with limited credits',
           price: 0,
           credits_included: 100,
           features: JSON.stringify(['Basic AI models', 'Limited credits', 'Community support']),
           active: 1
         },
         {
           id: 'pro',
           name: 'Pro',
           description: 'Professional plan with more credits',
           price: 29.99,
           credits_included: 1000,
           features: JSON.stringify(['Advanced AI models', 'Higher credit limits', 'Priority support', 'API access']),
           active: 1
         },
         {
           id: 'enterprise',
           name: 'Enterprise',
           description: 'Enterprise plan for teams',
           price: 99.99,
           credits_included: 5000,
           features: JSON.stringify(['All AI models', 'Unlimited credits', 'Dedicated support', 'Team collaboration', 'Custom integrations']),
           active: 1
         }
       ];

       for (const pkg of packages) {
         await dbInstance.query(`
           INSERT INTO packages (id, name, description, price, credits_included, features, active, created_at, synced_at, last_modified, sync_status, deleted_at, version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING
         `, [
           pkg.id,
           pkg.name,
           pkg.description,
           pkg.price,
           pkg.credits_included,
           pkg.features,
           pkg.active,
           new Date().toISOString(),
           new Date().toISOString(),
           new Date().toISOString(),
           'local',
           null,
           1
         ]);
       }

       console.log('Packages seeded successfully');
       return { success: true };
     } catch (error) {
       console.error('Error seeding packages:', error);
       throw error;
     }
   },

   async getPackages() {
     try {
       const res = await dbInstance.query('SELECT * FROM packages WHERE active = 1 ORDER BY price ASC');
       return res.rows;
     } catch (error) {
       console.error('Error getting packages:', error);
       return [];
     }
   },

   async createUserSubscription({ userId, packageId, subscriptionData = {} }) {
     try {
       const id = uuidv4();
       const res = await dbInstance.query(`
         INSERT INTO user_subscriptions (id, user_id, package_id, status, start_date, end_date, auto_renew, synced_at, last_modified, sync_status, deleted_at, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *
       `, [
         id,
         userId,
         packageId,
         subscriptionData.status || 'active',
         subscriptionData.start_date || new Date().toISOString(),
         subscriptionData.end_date || null,
         subscriptionData.auto_renew !== undefined ? subscriptionData.auto_renew : 1,
         new Date().toISOString(),
         new Date().toISOString(),
         'local',
         null,
         1
       ]);
       return res.rows[0];
     } catch (error) {
       console.error('Error creating user subscription:', error);
       throw error;
     }
   },

   async getUserSubscription({ userId }) {
     try {
       const res = await dbInstance.query('SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = \'active\' ORDER BY start_date DESC LIMIT 1', [userId]);
       return res.rows[0];
     } catch (error) {
       console.error('Error getting user subscription:', error);
       return null;
     }
   }
 };

// -----------------------------------------------------------------------------
// Core DB Operation Handlers
// -----------------------------------------------------------------------------
const operationHandlers = {
  // Basic Queries
  async query({ sql, params = [] }) {
    if (!dbInstance) throw new Error('Database not initialized');
    const result = await dbInstance.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount };
  },

  async exec({ sql }) {
    if (!dbInstance) throw new Error('Database not initialized');
    await dbInstance.exec(sql);
    return { success: true };
  },

  async transaction({ operations }) {
    if (!dbInstance) throw new Error('Database not initialized');
    const results = [];
    await dbInstance.transaction(async (tx) => {
      for (const op of operations) {
        const res = await tx.query(op.sql, op.params || []);
        results.push({ rows: res.rows, rowCount: res.rowCount });
      }
    });
    return { results };
  },

  async close() {
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
    }
    return { success: true };
  },

  // Reference all DatabaseWorker methods
  init: DatabaseWorker.initDatabase.bind(DatabaseWorker),
  getEntities: DatabaseWorker.getEntities.bind(DatabaseWorker),
  updateEntity: DatabaseWorker.updateEntity.bind(DatabaseWorker),
  createUser: DatabaseWorker.createUser.bind(DatabaseWorker),
  getUserById: DatabaseWorker.getUserById.bind(DatabaseWorker),
  getUserByEmail: DatabaseWorker.getUserByEmail.bind(DatabaseWorker),
  updateUser: DatabaseWorker.updateUser.bind(DatabaseWorker),
  deleteUser: DatabaseWorker.deleteUser.bind(DatabaseWorker),
  createUserProfile: DatabaseWorker.createUserProfile.bind(DatabaseWorker),
  getUserProfile: DatabaseWorker.getUserProfile.bind(DatabaseWorker),
   createProject: DatabaseWorker.createProject.bind(DatabaseWorker),
   addProject: DatabaseWorker.createProject.bind(DatabaseWorker),
   getProjects: DatabaseWorker.getProjects.bind(DatabaseWorker),
  getProjectById: DatabaseWorker.getProjectById.bind(DatabaseWorker),
  updateProject: DatabaseWorker.updateProject.bind(DatabaseWorker),
  deleteProject: DatabaseWorker.deleteProject.bind(DatabaseWorker),
  deleteAllProjects: DatabaseWorker.deleteAllProjects.bind(DatabaseWorker),
  toggleProjectPublic: DatabaseWorker.toggleProjectPublic.bind(DatabaseWorker),
  getTasks: DatabaseWorker.getTasks.bind(DatabaseWorker),
  addTask: DatabaseWorker.addTask.bind(DatabaseWorker),
  getGroups: DatabaseWorker.getGroups.bind(DatabaseWorker),
  getGroupById: DatabaseWorker.getGroupById.bind(DatabaseWorker),
  addGroup: DatabaseWorker.addGroup.bind(DatabaseWorker),
  updateGroup: DatabaseWorker.updateGroup.bind(DatabaseWorker),
  deleteGroup: DatabaseWorker.deleteGroup.bind(DatabaseWorker),
  addProjectToGroup: DatabaseWorker.addProjectToGroup.bind(DatabaseWorker),
  removeProjectFromGroup: DatabaseWorker.removeProjectFromGroup.bind(DatabaseWorker),
  getProjectsInGroup: DatabaseWorker.getProjectsInGroup.bind(DatabaseWorker),
  getUngroupedProjects: DatabaseWorker.getUngroupedProjects.bind(DatabaseWorker),
  getGroupsWithProjects: DatabaseWorker.getGroupsWithProjects.bind(DatabaseWorker),
  getUserCredits: DatabaseWorker.getUserCredits.bind(DatabaseWorker),
  getCreditTransactions: DatabaseWorker.getCreditTransactions.bind(DatabaseWorker),
  getCreditBalance: DatabaseWorker.getCreditBalance.bind(DatabaseWorker),
  getUserCreditBalance: DatabaseWorker.getUserCreditBalance.bind(DatabaseWorker),
  addCreditTransaction: DatabaseWorker.addCreditTransaction.bind(DatabaseWorker),
    consumeCredits: DatabaseWorker.consumeCredits.bind(DatabaseWorker),
    logActivity: DatabaseWorker.logActivity.bind(DatabaseWorker),
    getUserActivities: DatabaseWorker.getUserActivities.bind(DatabaseWorker),
   addBillingRecord: DatabaseWorker.addBillingRecord.bind(DatabaseWorker),
  getUserBilling: DatabaseWorker.getUserBilling.bind(DatabaseWorker),
  updateBillingStatus: DatabaseWorker.updateBillingStatus.bind(DatabaseWorker),
  createNotification: DatabaseWorker.createNotification.bind(DatabaseWorker),
  getUserNotifications: DatabaseWorker.getUserNotifications.bind(DatabaseWorker),
  markNotificationRead: DatabaseWorker.markNotificationRead.bind(DatabaseWorker),
  createSession: DatabaseWorker.createSession.bind(DatabaseWorker),
  getSessionByToken: DatabaseWorker.getSessionByToken.bind(DatabaseWorker),
  deleteSession: DatabaseWorker.deleteSession.bind(DatabaseWorker),
  deleteExpiredSessions: DatabaseWorker.deleteExpiredSessions.bind(DatabaseWorker),
  seedPackages: DatabaseWorker.seedPackages.bind(DatabaseWorker),
  getPackages: DatabaseWorker.getPackages.bind(DatabaseWorker),
  getUserSubscription: DatabaseWorker.getUserSubscription.bind(DatabaseWorker),
  createUserSubscription: DatabaseWorker.createUserSubscription.bind(DatabaseWorker),
  changeUserSubscription: DatabaseWorker.changeUserSubscription.bind(DatabaseWorker),
  updateUserSubscription: DatabaseWorker.updateUserSubscription.bind(DatabaseWorker),
  voteOnProject: DatabaseWorker.voteOnProject.bind(DatabaseWorker),
  getProjectVotes: DatabaseWorker.getProjectVotes.bind(DatabaseWorker),
  getPublicProjectsWithVotes: DatabaseWorker.getPublicProjectsWithVotes.bind(DatabaseWorker),
  getLocalChanges: async ({ tableName }) => {
    // TODO: Implement proper local changes tracking
    // For now, return empty array to prevent sync errors
    return [];
  },
   seedSampleNotifications: DatabaseWorker.seedSampleNotifications.bind(DatabaseWorker),
    isSeeded: async () => {
      try {
        const result = await dbInstance.query('SELECT COUNT(*) as count FROM packages');
        return result.rows[0].count > 0;
      } catch (err) {
        console.log('Error checking if seeded:', err.message);
        return false;
      }
    }
};

// -----------------------------------------------------------------------------
// Worker Message Handling
// -----------------------------------------------------------------------------
self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  try {
    console.log('[DB Worker] Received message:', type, id);
    const handler = operationHandlers[type];
    if (!handler) throw new Error(`Unknown operation: ${type}`);
    console.log('[DB Worker] Calling handler for:', type);
    const result = await handler(payload);
    console.log('[DB Worker] Handler completed for:', type);
    self.postMessage({ id, success: true, result });
  } catch (error) {
    console.error('[DB Worker] Error in handler:', type, error);
    self.postMessage({ id, success: false, error: error.message });
  }
};

// -----------------------------------------------------------------------------
// Worker is ready
// -----------------------------------------------------------------------------