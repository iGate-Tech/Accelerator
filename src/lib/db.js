import { toastManager } from './feedback';
import { performSync, syncService } from './sync';
import { getCurrentUser } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import PgliteWorker from '../workers/pglite-worker-v2.js?worker';

let worker = null;
let nextRequestId = 1;
let pendingRequests = new Map();

class DatabaseWorker {
  constructor() {
    this.worker = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      console.log('Creating database worker instance');
      this.worker = new PgliteWorker();

      this.worker.onmessage = (e) => {
        const { id, success, result, error, type } = e.data;
        const resolver = pendingRequests.get(id);
        if (resolver) {
          pendingRequests.delete(id);
          if (success) {
            resolver.resolve(result);
          } else {
            resolver.reject(new Error(error));
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending requests on worker error
        for (const [id, resolver] of pendingRequests) {
          resolver.reject(new Error('Database worker error'));
        }
        pendingRequests.clear();
      };

      // Initialize the database with timeout
      console.log('Initializing database...');
      await Promise.race([
        this.sendMessage('init', { dataDir: 'idb://accelerator-db-v19' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database init timeout')), 10000))
      ]);
      this.initialized = true;

      console.log('Database worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database worker:', error);
      // Set a flag to indicate database is unavailable
      this.dbUnavailable = true;
      console.warn('Database unavailable, app will work in limited mode');
      // Don't throw error - let app continue with limited functionality
    }

    // Check if database is already seeded
    const alreadySeeded = await isSeeded();
    if (!alreadySeeded) {
      // Seed initial data after database is ready
      await seedInitialData();
    } else {
      console.log('Database already seeded, skipping seeding');
    }
  }

  async sendMessage(type, data) {
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload: data });
    });
  }

  async isSeeded() {
    return await this.sendMessage('isSeeded', {});
  }

  async query(sql, params = []) {
    return await this.sendMessage('query', { sql, params });
  }

  async exec(sql) {
    return await this.sendMessage('exec', { sql });
  }

  async transaction(operations) {
    return await this.sendMessage('transaction', { operations });
  }

   async close() {
     if (this.worker) {
       await this.sendMessage('close', {});
       this.worker.terminate();
       this.worker = null;
       this.initialized = false;
     }
   }

   // High-level operations
   async getTasks(project_id = null, userId = null) {
     return await this.sendMessage('getTasks', { project_id, userId });
   }

   async addTask(task, project_id) {
     return await this.sendMessage('addTask', { task, project_id });
   }

   async clearAllTasks() {
     return await this.sendMessage('clearAllTasks', {});
   }

   async updateTask(id, content) {
     return await this.sendMessage('updateTask', { id, content });
   }

   async getProjects(userId = null) {
     return await this.sendMessage('getProjects', { userId });
   }

   async getPublicProjects() {
     return await this.sendMessage('getPublicProjects', {});
   }

   async getProjectById(id) {
     return await this.sendMessage('getProjectById', { id });
   }

    async addProject(project, userId) {
      return await this.sendMessage('createProject', { project, userId });
    }

   async updateProject(id, project) {
     return await this.sendMessage('updateProject', { id, project });
   }

   async deleteProject(id) {
     return await this.sendMessage('deleteProject', { id });
   }

   async getEntities(table, selectFields = '*', whereClause = '', orderBy = '', params = []) {
     return await this.sendMessage('getEntities', { table, selectFields, whereClause, orderBy, params });
   }

   async updateEntity(table, idField, id, updates, options = {}) {
     return await this.sendMessage('updateEntity', { table, idField, id, updates, options });
   }

   async createUser(email, passwordHash, profile = {}, userId = null) {
     return await this.sendMessage('createUser', { email, passwordHash, profile, userId });
   }

   async getUserByEmail(email) {
     return await this.sendMessage('getUserByEmail', { email });
   }

   async getUserById(id) {
     return await this.sendMessage('getUserById', { id });
   }

   async updateUser(id, updates) {
     return await this.sendMessage('updateUser', { id, updates });
   }

   async getUserCreditBalance(userId) {
     return await this.sendMessage('getUserCreditBalance', { userId });
   }

   async addCreditTransaction(userId, type, amount, description) {
     return await this.sendMessage('addCreditTransaction', { userId, type, amount, description });
   }

   // Groups operations
   async getGroups(userId = null) {
     return await this.sendMessage('getGroups', { userId });
   }

   async getGroupById(id) {
     return await this.sendMessage('getGroupById', { id });
   }

   async addGroup(group, userId) {
     return await this.sendMessage('addGroup', { group, userId });
   }

   async updateGroup(id, group) {
     return await this.sendMessage('updateGroup', { id, group });
   }

   async deleteGroup(id) {
     return await this.sendMessage('deleteGroup', { id });
   }

   // Session operations
   async createSession(userId, token, expiresAt) {
     return await this.sendMessage('createSession', { userId, token, expiresAt });
   }

   async getSessionByToken(token) {
     return await this.sendMessage('getSessionByToken', { token });
   }

   async deleteSession(token) {
     return await this.sendMessage('deleteSession', { token });
   }

   async deleteExpiredSessions() {
     return await this.sendMessage('deleteExpiredSessions', {});
   }

   // User operations (additional)
   async deleteUser(id) {
     return await this.sendMessage('deleteUser', { id });
   }

   // Billing operations
   async addBillingRecord(userId, type, amount, description, dueDate = null) {
     return await this.sendMessage('addBillingRecord', { userId, type, amount, description, dueDate });
   }

   async getUserBilling(userId) {
     return await this.sendMessage('getUserBilling', { userId });
   }

   async updateBillingStatus(id, status) {
     return await this.sendMessage('updateBillingStatus', { id, status });
   }

   // Notification operations
   async createNotification(userId, type, title, message, createdAt = null) {
     return await this.sendMessage('createNotification', { userId, type, title, message, createdAt });
   }

   async getUserNotifications(userId) {
     return await this.sendMessage('getUserNotifications', { userId });
   }

   async markNotificationRead(notificationId, userId) {
     return await this.sendMessage('markNotificationRead', { notificationId, userId });
   }

   // Packages operations
   async getPackages() {
     return await this.sendMessage('getPackages', {});
   }

   async getUserSubscription(userId) {
     return await this.sendMessage('getUserSubscription', { userId });
   }

   async createUserSubscription(userId, packageId, subscriptionData = {}) {
     return await this.sendMessage('createUserSubscription', { userId, packageId, subscriptionData });
   }

   async updateUserSubscription(userId, subscriptionId, updates) {
     return await this.sendMessage('updateUserSubscription', { userId, subscriptionId, updates });
   }

   // Project votes operations
   async voteOnProject(projectId, userId, voteType) {
     return await this.sendMessage('voteOnProject', { projectId, userId, voteType });
   }

   async getProjectVotes(projectId) {
     return await this.sendMessage('getProjectVotes', { projectId });
   }

   // Project groups operations
   async addProjectToGroup(projectId, groupId) {
     return await this.sendMessage('addProjectToGroup', { projectId, groupId });
   }

   async removeProjectFromGroup(projectId, groupId) {
     return await this.sendMessage('removeProjectFromGroup', { projectId, groupId });
   }

   async getProjectsInGroup(groupId) {
     return await this.sendMessage('getProjectsInGroup', { groupId });
   }

   async getUngroupedProjects(userId = null) {
     return await this.sendMessage('getUngroupedProjects', { userId });
   }

   // Complex queries
   async getPublicProjectsWithVotes(currentUserId) {
     return await this.sendMessage('getPublicProjectsWithVotes', { currentUserId });
   }

   async getGroupsWithProjects(userId = null) {
     return await this.sendMessage('getGroupsWithProjects', { userId });
   }

   async getProjectByName(name) {
     return await this.sendMessage('getProjectByName', { name });
   }

   async deleteAllProjects() {
     return await this.sendMessage('deleteAllProjects', {});
   }

   async toggleProjectPublic(projectId, isPublic) {
     return await this.sendMessage('toggleProjectPublic', { projectId, isPublic });
   }

   // Credits helper operations
   async getUserCredits(userId) {
     return await this.sendMessage('getUserCredits', { userId });
   }

   async getCreditTransactions(userId) {
     return await this.sendMessage('getCreditTransactions', { userId });
   }

   async getCreditBalance(userId) {
     return await this.sendMessage('getCreditBalance', { userId });
   }

   async consumeCredits(userId, amount, description) {
     return await this.sendMessage('consumeCredits', { userId, amount, description });
   }

   // Profile operations
   async getUserProfile(userId) {
     return await this.sendMessage('getUserProfile', { userId });
   }

   async createUserProfile(userId, profileData = {}) {
     return await this.sendMessage('createUserProfile', { userId, profileData });
   }

   // Subscription change operations
   async changeUserSubscription(userId, newPackageId, currentSubscription = null) {
     return await this.sendMessage('changeUserSubscription', { userId, newPackageId, currentSubscription });
   }

   // Seeding operations
   async seedPackages() {
     return await this.sendMessage('seedPackages', {});
   }

   async seedSampleNotifications(userId) {
     return await this.sendMessage('seedSampleNotifications', { userId });
   }

   // Portfolio/Collaboration operations
   async inviteCollaborator(portfolioId, inviteeEmail, role = 'editor', message = '', inviterId) {
     return await this.sendMessage('inviteCollaborator', { portfolioId, inviteeEmail, role, message, inviterId });
   }

   async getPortfolioInvitations(portfolioId) {
     return await this.sendMessage('getPortfolioInvitations', { portfolioId });
   }

   async getUserInvitations(userEmail) {
     return await this.sendMessage('getUserInvitations', { userEmail });
   }

   async respondToInvitation(invitationId, status, userId) {
     return await this.sendMessage('respondToInvitation', { invitationId, status, userId });
   }

   async getPortfolioCollaborators(portfolioId) {
     return await this.sendMessage('getPortfolioCollaborators', { portfolioId });
   }

   async removeCollaborator(portfolioId, userId) {
     return await this.sendMessage('removeCollaborator', { portfolioId, userId });
   }

   async updateCollaboratorRole(portfolioId, userId, role) {
     return await this.sendMessage('updateCollaboratorRole', { portfolioId, userId, role });
   }

   // Helper functions
   async getCurrentUserId() {
     return await this.sendMessage('getCurrentUserId', {});
   }

   async getGroupName(groupId) {
     return await this.sendMessage('getGroupName', { groupId });
   }

   // Sync operations
   async getLocalChanges(tableName) {
     return await this.sendMessage('getLocalChanges', { tableName });
   }

   async getLocalItem(tableName, id, idField) {
     return await this.sendMessage('getLocalItem', { tableName, id, idField });
   }

   async insertLocalItem(tableName, data) {
     return await this.sendMessage('insertLocalItem', { tableName, data });
   }

   async deleteLocalItem(tableName, idField, id) {
     return await this.sendMessage('deleteLocalItem', { tableName, idField, id });
   }

   async markItemSynced(tableName, idField, id, version) {
     return await this.sendMessage('markItemSynced', { tableName, idField, id, version });
   }

   async markItemConflict(tableName, idField, id, error, retryCount) {
     return await this.sendMessage('markItemConflict', { tableName, idField, id, error, retryCount });
   }

  async resolveConflict(localItem, remoteItem) {
    return await this.sendMessage('resolveConflict', { localItem, remoteItem });
  }

  // Activity operations
  async logActivity(data) {
    return await this.sendMessage('logActivity', data);
  }

  async getUserActivities(data) {
    return await this.sendMessage('getUserActivities', data);
  }
}

let pgInstance = null;

export const getPg = async () => {
  if (!pgInstance) {
    pgInstance = new DatabaseWorker();
    await pgInstance.init();
  }
  if (pgInstance.dbUnavailable) {
    throw new Error('Database unavailable - operating in limited mode');
  }
  return pgInstance;
};

export const triggerSync = () => {
  syncService.debouncedSync();
};

export const initDb = async () => {
  // Worker initializes automatically
  await seedInitialData();
};

// Generic helper for SELECT operations
 export const getEntities = async (table, selectFields = '*', whereClause = '', orderBy = '', params = []) => {
   try {
     const pg = await getPg();
     return await pg.getEntities(table, selectFields, whereClause, orderBy, params);
   } catch (error) {
     console.log(`DB error in getEntities for ${table}: ${error.message}`);
     return [];
   }
 };

// Generic helper for UPDATE operations
 export const updateEntity = async (table, idField, id, updates, options = { noTrigger: false }) => {
   try {
     const pg = await getPg();
     const result = await pg.updateEntity(table, idField, id, updates, options);
     if (!options.noTrigger) {
       triggerSync();
     }
     return result;
   } catch (error) {
     console.log(`DB error in updateEntity for ${table}: ${error.message}`);
     return { success: false, error: error.message };
   }
 };

   export const getTasks = async (project_id = null, userId = null) => {
     console.log('getTasks called with project_id:', project_id, 'userId:', userId);
     try {
       const pg = await getPg();
       const tasks = await pg.getTasks(project_id, userId);
       console.log('Tasks loaded:', tasks);
       return tasks;
     } catch (e) {
       console.log('DB error in getTasks:', e);
       return [];
     }
   };

   export const addTask = async (task, project_id) => {
    try {
        const pg = await getPg();
        await pg.addTask(task, project_id);
        console.log('Task added:', task, 'for project:', project_id);
        triggerSync();
      } catch (e) {
        console.log('DB error in addTask:', e);
      }
   };

export const clearAllTasks = async () => {
    try {
      const pg = await getPg();
      await pg.clearAllTasks();
      triggerSync();
    } catch (e) {
      console.log('DB not ready, skipping clearAllTasks');
    }
 };

 export const updateTask = async (id, content) => {
    try {
      const pg = await getPg();
      await pg.updateTask(id, content);
      triggerSync();
    } catch (e) {
      console.log('DB not ready, skipping updateTask');
    }
 };





      export const getProjects = async (userId = null) => {
         try {
           if (!userId || typeof userId !== 'string') {
             const { getCurrentUser } = await import('./supabase');
             const user = await getCurrentUser();
             console.log('user from getCurrentUser:', user);
             userId = user && typeof user.id === 'string' ? user.id : null;
           }
          const pg = await getPg();
          console.log('Getting projects for userId:', userId, 'type:', typeof userId);
          if (typeof userId !== 'string') {
            console.error('Invalid userId type:', typeof userId, 'value:', userId);
            return [];
          }
          const projects = await pg.getProjects(userId);
          console.log('Projects loaded:', projects);
          return projects;
        } catch (e) {
          console.log('Error getting projects:', e);
          return [];
        }
      };

    export const getPublicProjects = async () => {
       const pg = await getPg();
       const projects = await pg.getPublicProjects();
       console.log('Public projects loaded:', projects);
       return projects;
     };

    export const getPublicProjectsWithVotes = async (currentUserId) => {
      try {
        const pg = await getPg();
        const projects = await pg.getPublicProjectsWithVotes(currentUserId);
        console.log('Public projects with votes loaded:', projects);
        return projects;
      } catch (e) {
        console.log('Error getting public projects with votes:', e);
        return [];
      }
    };

    export const getProjectByName = async (name) => {
      try {
        const pg = await getPg();
        return await pg.getProjectByName(name);
      } catch (e) {
        console.log('DB not ready, returning null');
        return null;
      }
    };

    export const getProjectById = async (id) => {
      try {
        const pg = await getPg();
        return await pg.getProjectById(id);
      } catch (e) {
        console.log('DB not ready, returning null');
        return null;
      }
    };

   export const addProject = async (project) => {
     try {
       const { getCurrentUser } = await import('./supabase');
       const user = await getCurrentUser();
       if (!user) throw new Error('User not authenticated');

        const pg = await getPg();
        const newProject = await pg.addProject(project, user.id);
        console.log('Added project:', newProject);

         // Log activity
         await logActivity(user.id, 'project_created', 'project', newProject.id, `Created project "${project.name}"`, { projectName: project.name });

        triggerSync();
        return newProject.id;
     } catch (e) {
       console.log('Error adding project:', e);
       toastManager.error(`Failed to add project "${project.name}" (${project.description?.length || 0} chars description): ${e.message}`);
     }
   };

    export const updateProject = async (id, project) => {
    console.log('Updating project', id, 'with fields:', Object.keys(project));
    try {
      const { getCurrentUser } = await import('./supabase');
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const pg = await getPg();
      const result = await pg.updateProject(id, project);
      if (!result.success) {
        throw new Error(result.error);
      }
      console.log('Updated project:', id);

       // Log activity
       await logActivity(user.id, 'project_updated', 'project', id, `Updated project`, { fields: Object.keys(project) });

     } catch (e) {
       console.log('Error updating project:', e);
       toastManager.error(`Failed to update project ${id} (${Object.keys(project).length} fields): ${e.message}`);
     }
  };

    export const deleteProject = async (id) => {
     try {
         const { getCurrentUser } = await import('./supabase');
         const user = await getCurrentUser();
         if (!user) throw new Error('User not authenticated');

         const pg = await getPg();
          await pg.deleteProject(id);
         console.log('Deleted project:', id);

          // Log activity
          await logActivity(user.id, 'project_deleted', 'project', id, `Deleted project`, {});

         triggerSync();
        } catch (e) {
         console.log('Error deleting project:', e);
         toastManager.error(`Failed to delete project ${id}: ${e.message}`);
       }
   };

   export const deleteAllProjects = async () => {
      try {
        const pg = await getPg();
        await pg.deleteAllProjects();
        console.log('Deleted all projects');
      } catch (e) {
        console.log('Error deleting all projects:', e);
      }
    };

    export const toggleProjectPublic = async (projectId, isPublic) => {
      try {
        const pg = await getPg();
        const result = await pg.toggleProjectPublic(projectId, isPublic);
        console.log(`Project ${projectId} set to ${isPublic ? 'public' : 'private'}`);
        return result;
      } catch (e) {
        console.log('Error toggling project public status:', e);
        toastManager.error(`Failed to update project visibility: ${e.message}`);
        return { success: false, error: e.message };
      }
    };

    export const voteOnProject = async (projectId, userId, voteType) => {
      try {
        const pg = await getPg();
        const result = await pg.voteOnProject(projectId, userId, voteType);
        triggerSync();
        return result;
      } catch (e) {
        console.log('Error voting on project:', e);
        toastManager.error(`Failed to vote on project: ${e.message}`);
        return { success: false, error: e.message };
      }
    };

    export const getProjectVotes = async (projectId) => {
      try {
        const pg = await getPg();
        return await pg.getProjectVotes(projectId);
      } catch (e) {
        console.log('Error getting project votes:', e);
        return [];
      }
    };

// Groups functions
  export const getGroups = async (userId = null) => {
    const pg = await getPg();
    const groups = await pg.getGroups(userId);
    console.log('Groups loaded:', groups);
    return groups;
  };

 export const getGroupById = async (id) => {
   try {
     const pg = await getPg();
     return await pg.getGroupById(id);
   } catch (e) {
     console.log('Error loading group:', e);
     return null;
   }
 };

 export const addGroup = async (group) => {
   try {
     const { getCurrentUser } = await import('./supabase');
     const user = await getCurrentUser();
     if (!user) throw new Error('User not authenticated');

     const pg = await getPg();
     const newGroup = await pg.addGroup(group, user.id);
     console.log('Added group:', newGroup);
     triggerSync();
     return newGroup.id;
   } catch (e) {
     console.log('Error adding group:', e);
     toastManager.error(`Failed to add group "${group.name}": ${e.message}`);
   }
 };

 export const updateGroup = async (id, group) => {
   try {
     const pg = await getPg();
     const result = await pg.updateGroup(id, group);
     if (!result.success) {
       throw new Error(result.error);
     }
     console.log('Updated group:', id);
   } catch (e) {
     console.log('Error updating group:', e);
     toastManager.error(`Failed to update group ${id} (${Object.keys(group).length} fields): ${e.message}`);
   }
 };

 export const deleteGroup = async (id) => {
   try {
     const pg = await getPg();
     await pg.deleteGroup(id);
     console.log('Deleted group:', id);
     triggerSync();
   } catch (e) {
     console.log('Error deleting group:', e);
     toastManager.error(`Failed to delete group ${id}: ${e.message}`);
   }
 };

export const exportAllProjects = async (userId = null) => {
  try {
    const projects = await getProjects(userId);
    return JSON.stringify(projects, null, 2);
  } catch (e) {
    return null;
  }
};

 export const addProjectToGroup = async (projectId, groupId) => {
   try {
     const pg = await getPg();
     await pg.addProjectToGroup(projectId, groupId);
     console.log('Added project', projectId, 'to group', groupId);
     triggerSync();
   } catch (e) {
     console.log('Error adding project to group:', e);
   }
 };

 export const removeProjectFromGroup = async (projectId, groupId) => {
   try {
     const pg = await getPg();
     await pg.removeProjectFromGroup(projectId, groupId);
     console.log('Removed project', projectId, 'from group', groupId);
     triggerSync();
   } catch (e) {
     console.log('Error removing project from group:', e);
   }
 };

 export const getProjectsInGroup = async (groupId) => {
   try {
     const pg = await getPg();
     return await pg.getProjectsInGroup(groupId);
   } catch (e) {
     console.log('Error getting projects in group:', e);
     return [];
   }
 };

 export const getUngroupedProjects = async (userId = null) => {
   try {
     const pg = await getPg();
     return await pg.getUngroupedProjects(userId);
   } catch (e) {
     console.log('Error getting ungrouped projects:', e);
     return [];
   }
 };

 export const getGroupsWithProjects = async (userId = null) => {
   try {
     const pg = await getPg();
     return await pg.getGroupsWithProjects(userId);
   } catch (e) {
     console.log('Error getting groups with projects:', e);
     return [];
   }
 };

// User functions
 export const createUser = async (email, passwordHash, profile = {}, userId = null) => {
   try {
     const pg = await getPg();
     const user = await pg.createUser(email, passwordHash, profile, userId);
     console.log('User created:', user);
     triggerSync();
     return user;
   } catch (e) {
     console.log('Error creating user:', e);
     throw e;
   }
 };

 export const getUserByEmail = async (email) => {
   try {
     const pg = await getPg();
     return await pg.getUserByEmail(email);
   } catch (e) {
     console.log('Error getting user by email:', e);
     return null;
   }
 };

 export const getUserById = async (id) => {
   try {
     const pg = await getPg();
     return await pg.getUserById(id);
   } catch (e) {
     console.log('Error getting user by id:', e);
     return null;
   }
 };

 export const updateUser = async (id, updates) => {
   try {
     const pg = await getPg();
     const result = await pg.updateUser(id, updates);
     console.log('Updated user:', id);
     return result;
   } catch (e) {
     console.log('Error updating user:', e);
     throw e;
   }
 };

 export const deleteUser = async (id) => {
   try {
     const pg = await getPg();
     await pg.deleteUser(id);
     console.log('Deleted user:', id);
     triggerSync();
   } catch (e) {
     console.log('Error deleting user:', e);
     throw e;
   }
 };

// Session functions
 export const createSession = async (userId, token, expiresAt) => {
   try {
     const pg = await getPg();
     const session = await pg.createSession(userId, token, expiresAt);
     console.log('Session created:', session);
     triggerSync();
     return session;
   } catch (e) {
     console.log('Error creating session:', e);
     throw e;
   }
 };

 export const getSessionByToken = async (token) => {
   try {
     const pg = await getPg();
     return await pg.getSessionByToken(token);
   } catch (e) {
     console.log('Error getting session by token:', e);
     return null;
   }
 };

 export const deleteSession = async (token) => {
   try {
     const pg = await getPg();
     await pg.deleteSession(token);
     console.log('Deleted session:', token);
     triggerSync();
   } catch (e) {
     console.log('Error deleting session:', e);
   }
 };

 export const deleteExpiredSessions = async () => {
   try {
     const pg = await getPg();
     await pg.deleteExpiredSessions();
     console.log('Deleted expired sessions');
     triggerSync();
   } catch (e) {
     console.log('Error deleting expired sessions:', e);
   }
 };

// Credits functions
 export const addCreditTransaction = async (userId, type, amount, description) => {
   try {
     const pg = await getPg();
     const transaction = await pg.addCreditTransaction(userId, type, amount, description);
     triggerSync();
     return transaction;
   } catch (error) {
     console.error('Error adding credit transaction:', error);
     throw error;
   }
 };



    export const getUserCredits = async (userId) => {
      try {
        const pg = await getPg();
        return await pg.getUserCredits(userId);
      } catch (e) {
        console.log('Error getting user credits:', e);
        return [];
      }
    };

 export const getUserCreditBalance = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getUserCreditBalance(userId);
   } catch (e) {
     console.log('Error getting user credit balance:', e);
     return 0;
   }
 };

// Billing functions
 export const addBillingRecord = async (userId, type, amount, description, dueDate = null) => {
   try {
     const pg = await getPg();
     const billingRecord = await pg.addBillingRecord(userId, type, amount, description, dueDate);
     console.log('Billing record added:', billingRecord);
     triggerSync();
     return billingRecord;
   } catch (e) {
     console.log('Error adding billing record:', e);
     throw e;
   }
 };

 export const getUserBilling = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getUserBilling(userId);
   } catch (e) {
     console.log('Error getting user billing:', e);
     return [];
   }
 };

 export const consumeCredits = async (userId, amount, description) => {
   try {
     const pg = await getPg();
     return await pg.consumeCredits(userId, amount, description);
   } catch (error) {
     console.error('Error consuming credits:', error);
     throw error;
   }
 };

 export const getCreditBalance = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getCreditBalance(userId);
   } catch (error) {
     console.error('Error getting credit balance:', error);
     return 0;
   }
 };

  export const getCreditTransactions = async (userId) => {
    try {
      const pg = await getPg();
      return await pg.getCreditTransactions(userId);
    } catch (error) {
      console.error('Error getting credit transactions:', error);
      return [];
    }
  };

    // Activity functions
export const logActivity = async (userId, actionType, entityType, entityId, description, metadata = {}) => {
  try {
    const pg = await getPg();
    const activity = await pg.logActivity({ userId, actionType, entityType, entityId, description, metadata });
    triggerSync();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

export const getUserActivities = async (userId, limit = 50, offset = 0) => {
  try {
    const pg = await getPg();
    return await pg.getUserActivities({ userId, limit, offset });
  } catch (error) {
    console.error('Error getting user activities:', error);
    return [];
  }
};

  export const createNotification = async (userId, type, title, message, createdAt = null) => {
   try {
     const pg = await getPg();
     const notification = await pg.createNotification(userId, type, title, message, createdAt);
     triggerSync();
     return notification;
   } catch (error) {
     console.error('Error creating notification:', error);
     throw error;
   }
 };

 export const getUserNotifications = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getUserNotifications(userId);
   } catch (error) {
     console.error('Error getting user notifications:', error);
     return [];
   }
 };

 export const markNotificationRead = async (notificationId, userId) => {
   try {
     const pg = await getPg();
     const result = await pg.markNotificationRead(notificationId, userId);
     triggerSync();
     return result;
   } catch (error) {
     console.error('Error marking notification read:', error);
     return false;
   }
 };

 export const getPackages = async () => {
   try {
     const pg = await getPg();
     return await pg.getPackages();
   } catch (error) {
     console.error('Error getting packages:', error);
     return [];
   }
 };

 export const getUserSubscription = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getUserSubscription(userId);
   } catch (error) {
     console.error('Error getting user subscription:', error);
     return null;
   }
 };

 export const createUserSubscription = async (userId, packageId, subscriptionData = {}) => {
   try {
     const pg = await getPg();
     const subscription = await pg.createUserSubscription(userId, packageId, subscriptionData);
     console.log('User subscription created:', subscription);
     triggerSync();
     return subscription;
   } catch (error) {
     console.error('Error creating user subscription:', error);
     throw error;
   }
 };

 export const changeUserSubscription = async (userId, newPackageId, currentSubscription = null) => {
   try {
     const pg = await getPg();
     const newSubscription = await pg.changeUserSubscription(userId, newPackageId, currentSubscription);
     return newSubscription;
   } catch (error) {
     console.error('Error changing user subscription:', error);
     throw error;
   }
 };

 export const updateUserSubscription = async (userId, subscriptionId, updates) => {
   try {
     const pg = await getPg();
     const result = await pg.updateUserSubscription(userId, subscriptionId, updates);
     console.log('Updated user subscription:', subscriptionId);
     return result;
   } catch (error) {
     console.error('Error updating user subscription:', error);
     throw error;
   }
 };

 export const getUserProfile = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getUserProfile(userId);
   } catch (error) {
     console.error('Error getting user profile:', error);
     return null;
   }
 };

 export const createUserProfile = async (userId, profileData = {}) => {
   try {
     const pg = await getPg();
     const profile = await pg.createUserProfile(userId, profileData);
     if (profile) triggerSync();
     return profile;
   } catch (error) {
     console.error('Error creating user profile:', error);
     throw error;
   }
 };

 export const updateBillingStatus = async (id, status) => {
   try {
     const pg = await getPg();
     await pg.updateBillingStatus(id, status);
     console.log('Updated billing status:', id, status);
     triggerSync();
   } catch (e) {
     console.log('Error updating billing status:', e);
   }
 };

// Seeding function for initial data
  export const isSeeded = async () => {
    try {
      const pg = await getPg();
      return await pg.isSeeded();
    } catch (e) {
      console.log('Error checking if seeded:', e);
      return false;
    }
  };

  export const seedPackages = async () => {
    try {
      const pg = await getPg();
      const result = await pg.seedPackages();
      console.log('Packages seeded successfully');
      return result;
    } catch (e) {
      console.log('Error seeding packages:', e);
    }
  };

 export const seedInitialData = async () => {
   try {
     console.log('Seeding initial data...');

     // Seed packages (these are system-wide, not user-specific)
     await seedPackages();

     console.log('Initial data seeded successfully');
   } catch (e) {
     console.log('Error seeding data:', e);
   }
 };

 export const seedSampleNotifications = async (userId) => {
   try {
     const pg = await getPg();
     await pg.seedSampleNotifications(userId);
   } catch (e) {
     console.log('Error creating sample notifications:', e);
   }
 };

// Sync data with Supabase
// Portfolio Collaboration Functions
 export const inviteCollaborator = async (portfolioId, inviteeEmail, role = 'editor', message = '') => {
   try {
     const inviterId = await getCurrentUserId();
     const pg = await getPg();
     const invitation = await pg.inviteCollaborator(portfolioId, inviteeEmail, role, message, inviterId);
     triggerSync();
     return invitation;
   } catch (error) {
     console.error('Error inviting collaborator:', error);
     throw error;
   }
 };

 export const getPortfolioInvitations = async (portfolioId) => {
   try {
     const pg = await getPg();
     return await pg.getPortfolioInvitations(portfolioId);
   } catch (error) {
     console.error('Error getting portfolio invitations:', error);
     return [];
   }
 };

 export const getUserInvitations = async (userEmail) => {
   try {
     const pg = await getPg();
     return await pg.getUserInvitations(userEmail);
   } catch (error) {
     console.error('Error getting user invitations:', error);
     return [];
   }
 };

 export const respondToInvitation = async (invitationId, status) => {
   try {
     const userId = await getCurrentUserId();
     const pg = await getPg();
    const result = await pg.respondToInvitation(invitationId, status, userId);

    triggerSync();
    return result;
     return result;
   } catch (error) {
     console.error('Error responding to invitation:', error);
     throw error;
   }
 };

 export const getPortfolioCollaborators = async (portfolioId) => {
   try {
     const pg = await getPg();
     return await pg.getPortfolioCollaborators(portfolioId);
   } catch (error) {
     console.error('Error getting portfolio collaborators:', error);
     return [];
   }
 };

 export const removeCollaborator = async (portfolioId, userId) => {
   try {
     const pg = await getPg();
     const result = await pg.removeCollaborator(portfolioId, userId);

     // Create notification for removed user
     const groupName = await pg.getGroupName(portfolioId);
     await pg.createNotification(userId, 'system', 'Removed from Portfolio', `You have been removed from portfolio "${groupName}".`);

     triggerSync();
     return result;
   } catch (error) {
     console.error('Error removing collaborator:', error);
     throw error;
   }
 };

 export const updateCollaboratorRole = async (portfolioId, userId, role) => {
   try {
     const pg = await getPg();
     const result = await pg.updateCollaboratorRole(portfolioId, userId, role);
     triggerSync();
     return result;
   } catch (error) {
     console.error('Error updating collaborator role:', error);
     throw error;
   }
 };

// Helper functions
 const getCurrentUserId = async () => {
   const user = await getCurrentUser();
   if (!user) {
     throw new Error('User not authenticated');
   }
   return user.id;
 };

 const getGroupName = async (groupId) => {
   try {
     const pg = await getPg();
     return await pg.getGroupName(groupId);
   } catch (error) {
     return 'Unknown Portfolio';
   }
 };

export const syncData = async () => {
  try {
    await performSync();
    console.log('Data sync completed');
  } catch (error) {
    console.error('Sync failed:', error);
  }
};