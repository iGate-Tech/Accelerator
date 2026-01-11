import { PGlite } from '@electric-sql/pglite';

// -----------------------------------------------------------------------------
// Global DB Instance and Pending Requests Map
// -----------------------------------------------------------------------------
let dbInstance = null;
let pendingRequests = new Map();

// -----------------------------------------------------------------------------
// Database Worker Class with All Operations
// -----------------------------------------------------------------------------
const DatabaseWorker = {
  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  async initDatabase(options = {}) {
    if (dbInstance) return dbInstance;

    console.log('Initializing PGLite database...');
    dbInstance = new PGlite({ dataDir: options.dataDir || 'idb://accelerator-db-v19' });

    // Always ensure schema exists (CREATE IF NOT EXISTS will handle duplicates)
    console.log('Ensuring database schema exists...');

    // Full Schema
    await dbInstance.exec(`
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  profile JSON,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  avatar TEXT,
  bio TEXT,
  preferences JSON,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
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
  public BOOLEAN DEFAULT false,
  problem TEXT,
  solution TEXT,
  currentPrompt TEXT,
  llmResponse TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  project_id TEXT REFERENCES projects(id),
  content TEXT,
  timestamp TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  description TEXT,
  color TEXT,
  createdAt TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- Project Groups table
CREATE TABLE IF NOT EXISTS project_groups (
  project_id TEXT REFERENCES projects(id),
  group_id TEXT REFERENCES groups(id),
  addedAt TEXT,
  PRIMARY KEY (project_id, group_id)
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT,
  amount REAL,
  description TEXT,
  balance_after REAL,
  date TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT,
  amount REAL,
  description TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'pending',
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- User Activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata JSON,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT DEFAULT 'pending'
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token TEXT UNIQUE,
  expires_at TEXT
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  price REAL,
  credits_included INTEGER,
  features JSON,
  active BOOLEAN DEFAULT true,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  package_id TEXT REFERENCES packages(id),
  status TEXT,
  start_date TEXT,
  end_date TEXT,
  auto_renew BOOLEAN DEFAULT true,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- Project Votes table
CREATE TABLE IF NOT EXISTS project_votes (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  user_id TEXT REFERENCES users(id),
  vote_type TEXT,
  voted_at TEXT
);

-- Portfolio Collaborators table
CREATE TABLE IF NOT EXISTS portfolio_collaborators (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT,
  user_id TEXT REFERENCES users(id),
  role TEXT,
  invited_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);

-- Portfolio Invitations table
CREATE TABLE IF NOT EXISTS portfolio_invitations (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT,
  inviter_id TEXT REFERENCES users(id),
  invitee_email TEXT,
  role TEXT,
  status TEXT,
  invited_at TEXT,
  synced_at TEXT,
  last_modified TEXT,
  sync_status TEXT
);
    `);

    console.log('Database schema initialized successfully');
    return { success: true };
  },

  // ---------------------------------------------------------------------------
  // Generic Helpers
  // ---------------------------------------------------------------------------
  async getEntities({ table, selectFields = '*', whereClause = '', orderBy = '', params = [] }) {
    try {
      const query = `SELECT ${selectFields} FROM ${table} ${whereClause} ${orderBy}`;
      const res = await dbInstance.query(query, params);
      return res.rows;
    } catch (err) {
      console.error(`DB error in getEntities for ${table}:`, err);
      return [];
    }
  },

  async updateEntity({ table, idField, id, updates, options = {} }) {
    if (!updates || typeof updates !== 'object') {
      return { success: false, error: 'Invalid updates parameter' };
    }

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
    try {
      const id = userId || Math.random().toString(36).substring(2, 15);
      const res = await dbInstance.query(
        `INSERT INTO users 
        (id,email,password_hash,profile,synced_at,last_modified,sync_status)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [id, email, passwordHash, JSON.stringify(profile), new Date().toISOString(), new Date().toISOString(), 'local']
      );
      return res.rows[0];
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  },

  async getUserById({ id }) {
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
      const result = await this.updateEntity('users', 'id', id, processedUpdates, {
        alwaysUpdate: { 'updated_at': 'CURRENT_TIMESTAMP' }
      });
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
        (user_id, avatar, bio, preferences, synced_at, last_modified, sync_status)
        VALUES($1,$2,$3,$4,$5,$6,$7)
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
           'local'
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
      const id = Math.random().toString(36).substring(2, 15);
      const res = await dbInstance.query(
        `INSERT INTO projects 
        (id, user_id, name, description, currentStep, completedSteps, stepName, currentModel, currentSection, uiProgress, uiMessage, uiStatus, totalCredits, consumedCredits, totalTime, consumedTime, totalSteps, public, problem, solution, currentPrompt, llmResponse, synced_at, last_modified, sync_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) RETURNING *`,
        [
          id,
          userId,
          project.name || '',
          project.description || '',
          project.currentStep || '',
          project.completedSteps || 0,
          project.stepName || '',
          project.currentModel || '',
          project.currentSection || '',
          project.uiProgress || 0,
          project.uiMessage || '',
          project.uiStatus || 'idle',
          project.totalCredits || 0,
          project.consumedCredits || 0,
          project.totalTime || 0,
          project.consumedTime || 0,
          project.totalSteps || 0,
          project.public || false,
          project.problem || '',
          project.solution || '',
          project.currentPrompt || '',
          project.llmResponse || '',
          new Date().toISOString(),
          new Date().toISOString(),
          'local'
        ]
      );
      return res.rows[0];
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  },

  async getProjects({ userId = null }) {
    try {
      console.log('Worker getProjects userId:', userId, 'type:', typeof userId);
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
    try {
      const result = await this.updateEntity('projects', 'id', id, project);
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
      await dbInstance.query('DELETE FROM projects WHERE id = $1', [id]);
      return { success: true };
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  },

  async deleteAllProjects() {
    try {
      await dbInstance.query('DELETE FROM projects');
      return { success: true };
    } catch (err) {
      console.error('Error deleting all projects:', err);
      throw err;
    }
  },

  async toggleProjectPublic({ projectId, isPublic }) {
    try {
      const result = await this.updateEntity('projects', 'id', projectId, { public: isPublic });
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
      let query = 'SELECT * FROM tasks';
      let params = [];
      const conditions = [];
      if (project_id) {
        conditions.push(`project_id = $${params.length + 1}`);
        params.push(project_id);
      }
      if (userId) {
        conditions.push(`user_id = $${params.length + 1}`);
        params.push(userId);
      }
      if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
      query += ' ORDER BY timestamp DESC';
      const res = await dbInstance.query(query, params);
      return res.rows;
    } catch (err) {
      console.error('DB error in getTasks:', err);
      return [];
    }
  },

  async addTask({ task, project_id }) {
    try {
      const id = Math.random().toString(36).substring(2, 15);
      await dbInstance.query(
        `INSERT INTO tasks 
        (id, content, project_id, user_id, timestamp, synced_at, last_modified, sync_status) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, task.content, project_id, task.user_id || null, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local']
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
    const query = `SELECT * FROM groups ${whereClause} ORDER BY createdAt DESC`;
    const res = await dbInstance.query(query, params);
    return res.rows;
  },

  async getGroupById({ id }) {
    try {
      const res = await dbInstance.query('SELECT * FROM groups WHERE id = $1', [id]);
      return res.rows[0];
    } catch (err) {
      console.log('Error loading group:', err);
      return null;
    }
  },

  async addGroup({ group, userId }) {
    try {
      const res = await dbInstance.query(
        'INSERT INTO groups (user_id, name, description, color, createdAt, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [userId, group.name, group.description || '', group.color || '#6366f1', group.createdAt || new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local']
      );
      return res.rows[0];
    } catch (err) {
      console.log('Error adding group:', err);
      throw err;
    }
  },

  async updateGroup({ id, group }) {
    try {
      const result = await this.updateEntity('groups', 'id', id, group);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (err) {
      console.log('Error updating group:', err);
      throw err;
    }
  },

  async deleteGroup({ id }) {
    try {
      await dbInstance.query('DELETE FROM project_groups WHERE group_id = $1', [id]);
      await dbInstance.query('DELETE FROM groups WHERE id = $1', [id]);
      return { success: true };
    } catch (err) {
      console.log('Error deleting group:', err);
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  // Project Group Operations
  // ---------------------------------------------------------------------------
  async addProjectToGroup({ projectId, groupId }) {
    try {
      await dbInstance.query(
        'INSERT INTO project_groups (project_id, group_id, addedAt) VALUES ($1, $2, $3) ON CONFLICT (project_id, group_id) DO NOTHING',
        [projectId, groupId, new Date().toISOString()]
      );
      return { success: true };
    } catch (err) {
      console.log('Error adding project to group:', err);
      throw err;
    }
  },

  async removeProjectFromGroup({ projectId, groupId }) {
    try {
      await dbInstance.query('DELETE FROM project_groups WHERE project_id = $1 AND group_id = $2', [projectId, groupId]);
      return { success: true };
    } catch (err) {
      console.log('Error removing project from group:', err);
      throw err;
    }
  },

  async getProjectsInGroup({ groupId }) {
    try {
      const res = await dbInstance.query(`
        SELECT p.*, pg.addedAt as addedToGroupAt
        FROM projects p
        JOIN project_groups pg ON p.id = pg.project_id
        WHERE pg.group_id = $1
        ORDER BY pg.addedAt DESC
      `, [groupId]);
      return res.rows;
    } catch (err) {
      console.log('Error getting projects in group:', err);
      return [];
    }
  },

  async getUngroupedProjects({ userId = null }) {
    try {
      let query = `
        SELECT * FROM projects
        WHERE id NOT IN (SELECT project_id FROM project_groups)
      `;
      let params = [];
      if (userId) {
        query += ' AND user_id = $1';
        params.push(userId);
      }
      query += ' ORDER BY last_modified DESC';
      const res = await dbInstance.query(query, params);
      return res.rows;
    } catch (err) {
      console.log('Error getting ungrouped projects:', err);
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
      console.log('Error getting groups with projects:', err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // Credit Operations
  // ---------------------------------------------------------------------------
  async getUserCredits({ userId }) {
    try {
      const result = await this.getEntities({ table: 'credits', selectFields: '*', whereClause: 'WHERE user_id = $1', orderBy: 'ORDER BY date DESC', params: [userId] });
      return result.rows;
    } catch (err) {
      console.error('Error getting user credits:', err);
      return [];
    }
  },

  async getCreditTransactions({ userId }) {
    try {
      const result = await this.getEntities({ table: 'credits', selectFields: '*', whereClause: 'WHERE user_id = $1', orderBy: 'ORDER BY date DESC', params: [userId] });
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
      const balanceResult = await dbInstance.query('SELECT SUM(amount) as balance FROM credits WHERE user_id = $1', [userId]);
      const currentBalance = balanceResult.rows[0]?.balance || 0;
      const balance_after = currentBalance + amount;
      const id = Math.random().toString(36).substring(2, 15);
      await dbInstance.query(
        'INSERT INTO credits (id, user_id, type, amount, description, balance_after, date, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [id, userId, type, amount, description, balance_after, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local']
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
       const id = Math.random().toString(36).substring(2, 15);
       const res = await dbInstance.query(
         'INSERT INTO user_activities (id, user_id, action_type, entity_type, entity_id, description, metadata, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
         [id, userId, actionType, entityType, entityId, description, JSON.stringify(metadata), new Date().toISOString(), new Date().toISOString(), 'local']
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
         'SELECT * FROM user_activities WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3',
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
      const id = Math.random().toString(36).substring(2, 15);
      const res = await dbInstance.query(
        'INSERT INTO billing (id, user_id, type, amount, description, due_date, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [id, userId, type, amount, description, dueDate, new Date().toISOString(), new Date().toISOString(), 'local']
      );
      return res.rows[0];
    } catch (err) {
      console.log('Error adding billing record:', err);
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
      console.log('Error getting user billing:', err);
      return [];
    }
  },

  async updateBillingStatus({ id, status }) {
    try {
      await dbInstance.query('UPDATE billing SET status = $1, last_modified = $2 WHERE id = $3', [status, new Date().toISOString(), id]);
      return { success: true };
    } catch (err) {
      console.log('Error updating billing status:', err);
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  // Notification Operations
  // ---------------------------------------------------------------------------
  async createNotification({ userId, type, title, message }) {
    const id = Math.random().toString(36).substring(2, 15);
    await dbInstance.query(
      `INSERT INTO notifications (id,user_id,type,title,message,created_at,synced_at,last_modified,sync_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, userId, type, title, message, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local']
    );
    return { id };
  },

  async getUserNotifications({ userId }) {
    const res = await dbInstance.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  },

  async markNotificationRead({ notificationId, userId }) {
    try {
      await dbInstance.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [notificationId, userId]);
      return true;
    } catch (err) {
      console.error('Error marking notification read:', err);
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // Session Operations
  // ---------------------------------------------------------------------------
  async createSession({ userId, token, expiresAt }) {
    try {
      const res = await dbInstance.query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
        [userId, token, expiresAt]
      );
      return res.rows[0];
    } catch (err) {
      console.log('Error creating session:', err);
      throw err;
    }
  },

  async getSessionByToken({ token }) {
    try {
      const res = await dbInstance.query(
        'SELECT s.*, u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP',
        [token]
      );
      return res.rows[0];
    } catch (err) {
      console.log('Error getting session by token:', err);
      return null;
    }
  },

  async deleteSession({ token }) {
    try {
      await dbInstance.query('DELETE FROM sessions WHERE token = $1', [token]);
      return { success: true };
    } catch (err) {
      console.log('Error deleting session:', err);
      throw err;
    }
  },

  async deleteExpiredSessions() {
    try {
      await dbInstance.query('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
      return { success: true };
    } catch (err) {
      console.log('Error deleting expired sessions:', err);
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  // Package & Subscription Operations
  // ---------------------------------------------------------------------------
  async seedPackages() {
    try {
      const count = await dbInstance.query('SELECT COUNT(*) as count FROM packages');
      if (count.rows[0].count > 0) return { message: 'Packages already seeded' };

      const packages = [
        { name: 'Free', description: 'Basic features', price: 0, credits_included: 50, features: JSON.stringify(['AI plan', 'Market analysis']) },
        { name: 'Pro', description: 'Advanced features', price: 49.99, credits_included: 1000, features: JSON.stringify(['Unlimited projects', 'API access']) },
        { name: 'Enterprise', description: 'Full solution', price: 199.99, credits_included: 5000, features: JSON.stringify(['Team collaboration', 'Advanced analytics']) }
      ];

      for (const pkg of packages) {
        const packageId = Math.random().toString(36).substring(2, 15);
        await dbInstance.query(
          `INSERT INTO packages 
          (id, name, description, price, credits_included, features, synced_at, last_modified, sync_status)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [packageId, pkg.name, pkg.description, pkg.price, pkg.credits_included, pkg.features, new Date().toISOString(), new Date().toISOString(), 'synced']
        );
      }

      return { message: 'Packages seeded successfully' };
    } catch (err) {
      console.error('Error seeding packages:', err);
      throw err;
    }
  },

  async getPackages() {
    try {
      const res = await dbInstance.query('SELECT * FROM packages WHERE active = true ORDER BY price ASC');
      return res.rows;
    } catch (err) {
      console.error('Error getting packages:', err);
      return [];
    }
  },

  async getUserSubscription({ userId }) {
    try {
      const res = await dbInstance.query(
        'SELECT us.*, p.name, p.description, p.price, p.credits_included FROM user_subscriptions us JOIN packages p ON us.package_id = p.id WHERE us.user_id = $1 AND us.status = $2 ORDER BY us.start_date DESC LIMIT 1',
        [userId, 'active']
      );
      return res.rows[0] || null;
    } catch (err) {
      console.error('Error getting user subscription:', err);
      return null;
    }
  },

  async createUserSubscription({ userId, packageId, subscriptionData = {} }) {
    try {
      const id = Math.random().toString(36).substring(2, 15);
      const startDate = subscriptionData.startDate || new Date().toISOString();
      const endDate = subscriptionData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await dbInstance.query(
        'INSERT INTO user_subscriptions (id, user_id, package_id, status, start_date, end_date, auto_renew, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [id, userId, packageId, subscriptionData.status || 'active', startDate, endDate, subscriptionData.autoRenew !== false, new Date().toISOString(), new Date().toISOString(), 'local']
      );
      const pkg = await dbInstance.query('SELECT * FROM packages WHERE id = $1', [packageId]);
      if (pkg.rows[0] && pkg.rows[0].price > 0) {
        await this.addBillingRecord({
          userId,
          type: 'subscription',
          amount: pkg.rows[0].price,
          description: `${pkg.rows[0].name} subscription`,
          dueDate: endDate
        });
      }
      return res.rows[0];
    } catch (err) {
      console.error('Error creating user subscription:', err);
      throw err;
    }
  },

  async updateUserSubscription({ userId, subscriptionId, updates }) {
    try {
      const result = await this.updateEntity('user_subscriptions', 'id', subscriptionId, updates);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (err) {
      console.error('Error updating user subscription:', err);
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
          'INSERT INTO project_votes (project_id, user_id, vote_type, voted_at) VALUES ($1, $2, $3, $4)',
          [projectId, userId, voteType, new Date().toISOString()]
        );
        return { action: 'added', voteType };
      }
    } catch (err) {
      console.log('Error voting on project:', err);
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
      console.log('Error getting project votes:', err);
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
      console.log('Error getting public projects with votes:', err);
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
      console.log('Error creating sample notifications:', err.message);
      throw err;
    }
  },

  async getLocalChanges({ tableName }) {
    // TODO: Implement proper local changes tracking based on sync_status
    // For now, return empty array to prevent sync errors
    return [];
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
       const result = await dbInstance.query('SELECT COUNT(*) as count FROM users LIMIT 1');
       return result.rows[0].count > 0;
     } catch {
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
    const handler = operationHandlers[type];
    if (!handler) throw new Error(`Unknown operation: ${type}`);
    const result = await handler(payload);
    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};

// -----------------------------------------------------------------------------
// Exported Init
// -----------------------------------------------------------------------------
self.initializeDatabase = DatabaseWorker.initDatabase.bind(DatabaseWorker);