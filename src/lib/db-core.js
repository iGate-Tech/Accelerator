
export let dbInstance = null;
export let dbReady = false;
let initPromise = null;
let pgLiteLoading = false;
let schemaCreated = false;

export async function initDatabase(options = {}) {
  const { timeout = 3000, force = false } = options;
  
  if (dbReady && !force) return dbInstance;
  if (initPromise && !force) return initPromise;

  initPromise = (async () => {
    try {
      const { PGlite } = await Promise.race([
        import('@electric-sql/pglite'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PGLite load timeout')), timeout)
        )
      ]);

      dbInstance = new PGlite({ dataDir: 'idb://accelerator-db-v22' });
      
      await dbInstance.waitReady;
      
      if (!schemaCreated || force) {
        const { createSchema, migrateSchema } = await import('./db-schema.js');
        await createSchema();
        await migrateSchema();
        schemaCreated = true;
      }
      
      dbReady = true;
      console.log('PGLite database initialized successfully');

      // Schedule automatic data retention enforcement for GDPR compliance
      try {
        const { scheduleDataRetention } = await import('./db.js');
        scheduleDataRetention();
        console.log('Data retention scheduler started');
      } catch (error) {
        console.warn('Failed to start data retention scheduler:', error.message);
      }

      return dbInstance;
    } catch (error) {
      console.warn('Database init failed (non-blocking):', error.message);
      dbReady = false;
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

export async function getUserProjects(userId) {
  const saved = localStorage.getItem(`projects_${userId}`);
  return saved ? JSON.parse(saved) : [];
}

export async function getProjects(userId) {
  return getUserProjects(userId);
}

export async function createProject(userId, projectData = {}) {
  const id = projectData.id || `project_${Date.now()}`;
  const project = { id, userId, ...projectData, created_at: new Date().toISOString() };
  const projects = await getProjects(userId);
  projects.push(project);
  localStorage.setItem(`projects_${userId}`, JSON.stringify(projects));
  return project;
}

export async function getUserNotifications(userId) {
  const saved = localStorage.getItem(`notifications_${userId}`);
  return saved ? JSON.parse(saved) : [];
}

export async function markNotificationRead(notificationId, userId) {
  const notifications = await getUserNotifications(userId);
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  return { success: true };
}

export async function getCreditBalance(userId) {
  const saved = localStorage.getItem(`credits_${userId}`);
  return saved ? JSON.parse(saved).balance : 50;
}

export async function getUserSubscription(userId) {
  return null;
}

export async function getUserById(id) {
  return null;
}

export async function createUser(email, password_hash, profile = {}, id) {
  return { id, email };
}

export async function updateProject(projectId, updates) {
  return { success: true };
}

export async function deleteProject(projectId) {
  return { success: true };
}

export async function getGroups(userId) {
  return [];
}

export async function createGroup(userId, groupData = {}) {
  const id = groupData.id || `group_${Date.now()}`;
  return { id, ...groupData };
}

export async function deleteAllProjects(userId) {
  localStorage.removeItem(`projects_${userId}`);
  return { success: true };
}

export async function exportAllProjects(userId) {
  const projects = await getProjects(userId);
  return JSON.stringify({ data: projects, exportedAt: new Date().toISOString() }, null, 2);
}

export async function exportAllData(userId) {
  const projects = await exportAllProjects(userId);
  return { projects: JSON.parse(projects), exportedAt: new Date().toISOString(), userId };
}

export async function exportProject(projectId) {
  return JSON.stringify({ project: {}, tasks: [], exportedAt: new Date().toISOString() }, null, 2);
}

export async function exportReports(projectId) {
  return JSON.stringify({
    projectName: 'Unknown',
    status: 'unknown',
    createdAt: new Date().toISOString()
  }, null, 2);
}

export async function getUserActivities(userId, limit = 20) {
  return [];
}

export async function logActivity(userId, actionType, entityType, entityId, description, metadata = {}) {
  return { id: `activity_${Date.now()}` };
}

export async function createNotification(userId, notificationData = {}) {
  const id = notificationData.id || `notif_${Date.now()}`;
  const notifications = await getUserNotifications(userId);
  notifications.unshift({ id, ...notificationData, created_at: new Date().toISOString() });
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
  return { id };
}

export async function getCurrentProject(userId) {
  return null;
}

export async function setCurrentProject(userId, projectId) {
  return { success: true };
}

export async function getExploreProjects(userId) {
  return [];
}

export async function getPortfolioProjects(userId) {
  return getUserProjects(userId);
}

export async function getPublicProjects() {
  return [];
}

export async function getProjectById(projectId) {
  return null;
}

export async function getUserByEmail(email) {
  return null;
}

export async function createSession(userId, token, expiresAt) {
  return { success: true };
}

export async function getSessionByToken(token) {
  return null;
}

export async function deleteSession(token) {
  return { success: true };
}

export async function deleteExpiredSessions() {
  return { success: true };
}

export async function getEntities(tableName, conditions = {}) {
  return { success: false, error: 'Database unavailable', data: [] };
}

export async function getEntityById(tableName, id) {
  return { success: false, error: 'Database unavailable', data: null };
}

export async function updateEntity(table, column, value, updates) {
  return { success: false, error: 'Database unavailable' };
}

export async function createUserProfile(userId, profileData = {}) {
  return null;
}

export async function getUserProfile(userId) {
  return null;
}

export async function getUserCreditBalance(userId) {
  return 50;
}

export async function addCreditTransaction(userId, type, amount, description) {
  return { id: `credit_${Date.now()}` };
}

export async function consumeCredits(userId, amount, description) {
  return { success: true, newBalance: 0 };
}

export async function createVote(projectId, userId, voteType) {
  return { id: `vote_${Date.now()}` };
}

export async function voteOnProject(projectId, userId, voteType) {
  return { id: `vote_${Date.now()}` };
}

export async function getProjectVotes(projectId) {
  return { up: 0, down: 0, userVote: null };
}

export async function createInvitation(invitationData = {}) {
  return { id: invitationData.id || `invite_${Date.now()}` };
}

export async function inviteCollaborator(portfolioId, inviteeEmail, role, message) {
  return { id: `invite_${Date.now()}` };
}

export async function getUserInvitations(userEmail) {
  return [];
}

export async function getPortfolioInvitations(portfolioId) {
  return [];
}

export async function respondToInvitation(invitationId, status) {
  return { success: true };
}

export async function getPortfolioCollaborators(portfolioId) {
  return [];
}

export async function removeCollaborator(portfolioId, userId) {
  return { success: true };
}

export async function updateCollaboratorRole(portfolioId, userId, role) {
  return { success: true };
}

export async function addBillingRecord(userId, type, amount, description, dueDate) {
  return { success: true };
}

export async function getUserBilling(userId) {
  return [];
}

let currentUser = null;
export const setCurrentUser = (user) => { currentUser = user; };
export const getCurrentUser = () => currentUser;
