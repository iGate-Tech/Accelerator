import { toastManager } from './feedback';

let dbWorker = null;
import { v4 as uuidv4 } from 'uuid';
import PgliteWorker from '../workers/pglite-worker-v2.js?worker';
import logger from './logger.js';

// Local user management for PGLite only
const getCurrentUser = async () => {
  return { id: 1 };
};


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
      logger.debug('Creating database worker instance');
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
        logger.error('Worker error:', error);
        // Reject all pending requests on worker error
        for (const [id, resolver] of pendingRequests) {
          resolver.reject(new Error('Database worker error'));
        }
        pendingRequests.clear();
      };

      // Initialize the database with timeout
      logger.debug('Initializing database...');
       await Promise.race([
          this.sendMessage('init', { dataDir: 'idb://accelerator-db-v22' }),
         new Promise((_, reject) => setTimeout(() => reject(new Error('Database init timeout')), 30000))
       ]);
      this.initialized = true;

      logger.debug('Database worker initialized successfully');
       // Check if database is already seeded
       const alreadySeeded = await isSeeded();
       if (!alreadySeeded) {
         // Seed initial data after database is ready
         await seedInitialData();
       } else {
         logger.debug('Database already seeded, skipping seeding');
       }
     } catch (error) {
       logger.error('Failed to initialize database worker:', error);
       // Set a flag to indicate database is unavailable
       this.dbUnavailable = true;
       logger.warn('Database unavailable, app will work in limited mode');
       // Don't throw error - let app continue with limited functionality
     }
  }

  async sendMessage(type, data) {
    logger.trace('DatabaseWorker: sendMessage called - type:', type, 'data keys:', Object.keys(data || {}));
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      logger.debug('DatabaseWorker: sending message id:', id, 'type:', type);
      pendingRequests.set(id, { resolve, reject });

      // Deep clone data to ensure it's cloneable, handling circular references and non-serializable objects
      const serializableData = this.deepCloneSerializable(data);
      logger.trace('DatabaseWorker: data serialized, posting message');
      this.worker.postMessage({ id, type, payload: serializableData });
      logger.trace('DatabaseWorker: message posted to worker');
    });
  }

  // Helper method to deep clone data while filtering out non-serializable objects
  deepCloneSerializable(obj, seen = new WeakMap()) {
    // Handle primitives
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Handle circular references
    if (seen.has(obj)) {
      return '[Circular]';
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      const result = [];
      seen.set(obj, result);
      for (let i = 0; i < obj.length; i++) {
        result[i] = this.deepCloneSerializable(obj[i], seen);
      }
      return result;
    }

    // Handle objects
    const result = {};
    seen.set(obj, result);

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // Skip functions, DOM elements, and other non-serializable objects
        if (typeof value === 'function' ||
            (typeof value === 'object' && value !== null && (
              value instanceof Element ||
              value instanceof Node ||
              value instanceof Window ||
              value instanceof Document ||
              value instanceof Event ||
              value instanceof EventTarget ||
              value.constructor.name === 'Object' && !Object.getPrototypeOf(value)
            ))) {
          continue; // Skip this property
        }

        result[key] = this.deepCloneSerializable(value, seen);
      }
    }

    return result;
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

    async addTask(task, project_id, userId = null) {
      return await this.sendMessage('addTask', { task, project_id, userId });
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

// Fallback implementations for when database is unavailable
const createFallbackResponse = (message) => ({
  error: 'Database unavailable',
  message,
  fallback: true
});

// Helper to safely call database operations with fallbacks
const safeDbCall = async (operation, fallbackValue = null, operationName = 'database operation') => {
  try {
    const pg = await getPg();
    return await operation(pg);
  } catch (error) {
    if (error.message.includes('Database unavailable')) {
      logger.warn(`Database unavailable, returning fallback for ${operationName}`);
      return fallbackValue;
    }
    logger.error(`Error in ${operationName}:`, error);
    return fallbackValue;
  }
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
     logger.debug(`DB error in getEntities for ${table}: ${error.message}`);
     return [];
   }
 };

// Generic helper for UPDATE operations
  export const updateEntity = async (table, idField, id, updates, options = { noTrigger: false }) => {
    logger.trace('updateEntity: Starting - table:', table, 'idField:', idField, 'id:', id, 'updates keys:', Object.keys(updates || {}), 'noTrigger:', options.noTrigger);
    try {
      const pg = await getPg();
      logger.debug('updateEntity: PG connection obtained, executing update');
      const result = await pg.updateEntity(table, idField, id, updates, options);
      logger.debug('updateEntity: Update executed successfully, result:', result);

      logger.trace('updateEntity: Completed successfully');
      return result;
    } catch (error) {
      logger.error('updateEntity: Error - table:', table, 'error:', error.message, error.stack);
      return { success: false, error: error.message };
    }
  };

   export const getTasks = async (project_id = null, userId = null) => {
     logger.debug('getTasks called with project_id:', project_id, 'userId:', userId);
     try {
       const pg = await getPg();
       const tasks = await pg.getTasks(project_id, userId);
       logger.debug('Tasks loaded:', tasks);
       return tasks;
     } catch (e) {
       logger.debug('DB error in getTasks:', e);
       return [];
     }
   };

     export const addTask = async (task, project_id) => {
       logger.debug('DB: addTask called with task content length:', task?.content?.length, 'project_id:', project_id);
       try {
            logger.debug('DB: getting current user');
            const user = await getCurrentUser();
            logger.debug('DB: current user:', user?.id);
            logger.debug('DB: getting pg worker');
            const pg = await getPg();
            logger.debug('DB: calling pg.addTask');
            await pg.addTask(task, project_id, user?.id);
            logger.debug('DB: Task added successfully');
         } catch (e) {
           logger.debug('DB: error in addTask:', e);
         }
      };

export const clearAllTasks = async () => {
     try {
       const pg = await getPg();
       await pg.clearAllTasks();
     } catch (e) {
       logger.debug('DB not ready, skipping clearAllTasks');
     }
 };

  export const updateTask = async (id, content) => {
     try {
       const pg = await getPg();
       await pg.updateTask(id, content);
     } catch (e) {
       logger.debug('DB not ready, skipping updateTask');
     }
  };





      export const getProjects = async (userId = null) => {
         try {
       if (!userId || typeof userId !== 'string') {
              const user = await getCurrentUser();
              logger.debug('user from getCurrentUser:', user);
              userId = user && typeof user.id === 'string' ? user.id : null;
            }
          const pg = await getPg();
          logger.debug('Getting projects for userId:', userId, 'type:', typeof userId);
          if (typeof userId !== 'string') {
            logger.error('Invalid userId type:', typeof userId, 'value:', userId);
            return [];
          }
          const projects = await pg.getProjects(userId);
          logger.debug('Projects loaded:', projects);
          return projects;
        } catch (e) {
          logger.debug('Error getting projects:', e);
          return [];
        }
      };

    export const getPublicProjects = async () => {
       const pg = await getPg();
       const projects = await pg.getPublicProjects();
       logger.debug('Public projects loaded:', projects);
       return projects;
     };

    export const getPublicProjectsWithVotes = async (currentUserId) => {
      try {
        const pg = await getPg();
        const projects = await pg.getPublicProjectsWithVotes(currentUserId);
        logger.debug('Public projects with votes loaded:', projects);
        return projects;
      } catch (e) {
        logger.debug('Error getting public projects with votes:', e);
        return [];
      }
    };

    export const getProjectByName = async (name) => {
      try {
        const pg = await getPg();
        return await pg.getProjectByName(name);
      } catch (e) {
        logger.debug('DB not ready, returning null');
        return null;
      }
    };

    export const getProjectById = async (id) => {
      try {
        const pg = await getPg();
        return await pg.getProjectById(id);
      } catch (e) {
        logger.debug('DB not ready, returning null');
        return null;
      }
    };

     export const addProject = async (project) => {
        try {
          const user = await getCurrentUser();
          if (!user) throw new Error('User not authenticated');

          // Ensure is_public is integer (0 for private)
          project.is_public = 0;

           const pg = await getPg();
           const newProject = await pg.addProject(project, user.id);
          logger.debug('Added project:', newProject);

           // Log activity
           await logActivity(user.id, 'project_created', 'project', newProject.id, `Created project "${project.name}"`, { projectName: project.name });

           toastManager.success(`Project "${project.name}" created successfully`);
           return newProject.id;
        } catch (e) {
          logger.debug('Error adding project:', e);
          toastManager.error(`Failed to add project "${project.name}" (${project.description?.length || 0} chars description): ${e.message}`);
        }
     };

     export const updateProject = async (id, project) => {
       try {
         // Validate parameters
         if (!id) throw new Error('Project ID is required');
         if (!project || typeof project !== 'object') throw new Error('Project data must be an object');

         const user = await getCurrentUser();
         if (!user) throw new Error('User not authenticated');

         logger.debug('DB: updateProject called with id:', id, 'updates:', Object.keys(project));
         const pg = await getPg();
         logger.debug('DB: calling pg.updateProject');
         await pg.updateProject(id, project);
          logger.debug('DB: Updated project:', id);

          toastManager.success('Project updated successfully');

          // Log activity
          await logActivity(user.id, 'project_updated', 'project', id, `Updated project`, { fields: Object.keys(project) });

        } catch (e) {
         logger.debug('Error updating project:', e);
         toastManager.error(`Failed to update project ${id} (${Object.keys(project).length} fields): ${e.message}`);
       }
   };

    export const deleteProject = async (id) => {
      try {
          const user = await getCurrentUser();
          if (!user) throw new Error('User not authenticated');

           const pg = await getPg();
             await pg.deleteProject(id);
            logger.debug('Deleted project:', id);

            toastManager.success(`Project deleted successfully`);

             // Dispatch event to reset current project if it was deleted
             window.dispatchEvent(new CustomEvent('projectDeleted', { detail: { projectId: id } }));

             // Log activity
             await logActivity(user.id, 'project_deleted', 'project', id, `Deleted project`, {});

          } catch (e) {
           logger.debug('Error deleting project:', e);
           toastManager.error(`Failed to delete project ${id}: ${e.message}`);
         }
    };

   export const deleteAllProjects = async () => {
      try {
        const pg = await getPg();
        await pg.deleteAllProjects();
        logger.debug('Deleted all projects');
      } catch (e) {
        logger.debug('Error deleting all projects:', e);
      }
    };

    export const toggleProjectPublic = async (projectId, isPublic) => {
      try {
        const pg = await getPg();
        const result = await pg.toggleProjectPublic({ projectId, isPublic });
        logger.debug(`Project ${projectId} set to ${isPublic ? 'public' : 'private'}`);
        return result;
      } catch (e) {
        logger.debug('Error toggling project public status:', e);
        toastManager.error(`Failed to update project visibility: ${e.message}`);
        return { success: false, error: e.message };
      }
    };

    export const voteOnProject = async (projectId, userId, voteType) => {
      try {
        const pg = await getPg();
        const result = await pg.voteOnProject({ projectId, userId, voteType });
        return result;
      } catch (e) {
        logger.debug('Error voting on project:', e);
        toastManager.error(`Failed to vote on project: ${e.message}`);
        return { success: false, error: e.message };
      }
    };

    export const getProjectVotes = async (projectId) => {
      try {
        const pg = await getPg();
        return await pg.getProjectVotes(projectId);
      } catch (e) {
        logger.debug('Error getting project votes:', e);
        return [];
      }
    };

// Groups functions
  export const getGroups = async (userId = null) => {
    const pg = await getPg();
    const groups = await pg.getGroups(userId);
    logger.debug('Groups loaded:', groups);
    return groups;
  };

 export const getGroupById = async (id) => {
   try {
     const pg = await getPg();
     return await pg.getGroupById(id);
   } catch (e) {
     logger.debug('Error loading group:', e);
     return null;
   }
 };

  export const addGroup = async (group) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const pg = await getPg();
      const newGroup = await pg.addGroup(group, user.id);
      logger.debug('Added group:', newGroup);
      return newGroup.id;
    } catch (e) {
      logger.debug('Error adding group:', e);
      toastManager.error(`Failed to add group "${group.name}": ${e.message}`);
    }
  };

 export const updateGroup = async (id, group) => {
   try {
     const pg = await getPg();
      const result = await pg.updateGroup({ id, group });
     if (!result.success) {
       throw new Error(result.error);
     }
     logger.debug('Updated group:', id);
   } catch (e) {
     logger.debug('Error updating group:', e);
     toastManager.error(`Failed to update group ${id} (${Object.keys(group).length} fields): ${e.message}`);
   }
 };

  export const deleteGroup = async (id) => {
    try {
      const pg = await getPg();
      await pg.deleteGroup(id);
      logger.debug('Deleted group:', id);
    } catch (e) {
      logger.debug('Error deleting group:', e);
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
      await pg.addProjectToGroup({ projectId, groupId });
     logger.debug('Added project', projectId, 'to group', groupId);
     triggerSync();
   } catch (e) {
     logger.debug('Error adding project to group:', e);
   }
 };

 export const removeProjectFromGroup = async (projectId, groupId) => {
   try {
     const pg = await getPg();
      await pg.removeProjectFromGroup({ projectId, groupId });
     logger.debug('Removed project', projectId, 'from group', groupId);
     triggerSync();
   } catch (e) {
     logger.debug('Error removing project from group:', e);
   }
 };

 export const getProjectsInGroup = async (groupId) => {
   try {
     const pg = await getPg();
     return await pg.getProjectsInGroup(groupId);
   } catch (e) {
     logger.debug('Error getting projects in group:', e);
     return [];
   }
 };

  export const getUngroupedProjects = async (userId = null) => {
    try {
      const pg = await getPg();
      return await pg.getUngroupedProjects({ userId });
    } catch (e) {
      logger.debug('Error getting ungrouped projects:', e);
      return [];
    }
  };

 export const getGroupsWithProjects = async (userId = null) => {
   try {
     const pg = await getPg();
     return await pg.getGroupsWithProjects(userId);
   } catch (e) {
     logger.debug('Error getting groups with projects:', e);
     return [];
   }
 };

// User functions
  export const createUser = async (email, passwordHash, profile = {}, userId = null) => {
    try {
      const pg = await getPg();
       const user = await pg.createUser({ email, passwordHash, profile, userId });
      return user;
    } catch (e) {
      logger.debug('Error creating user:', e);
      throw e;
    }
  };

 export const getUserByEmail = async (email) => {
   try {
     const pg = await getPg();
     return await pg.getUserByEmail(email);
   } catch (e) {
     logger.debug('Error getting user by email:', e);
     return null;
   }
 };

 export const getUserById = async (id) => {
   try {
     const pg = await getPg();
     return await pg.getUserById(id);
   } catch (e) {
     logger.debug('Error getting user by id:', e);
     return null;
   }
 };

 export const updateUser = async (id, updates) => {
   try {
     const pg = await getPg();
      const result = await pg.updateUser({ id, updates });
     logger.debug('Updated user:', id);
     return result;
   } catch (e) {
     logger.debug('Error updating user:', e);
     throw e;
   }
 };

  export const deleteUser = async (id) => {
    try {
      const pg = await getPg();
      await pg.deleteUser(id);
      logger.debug('Deleted user:', id);
    } catch (e) {
      logger.debug('Error deleting user:', e);
      throw e;
    }
  };

// Session functions
  export const createSession = async (userId, token, expiresAt) => {
    try {
      const pg = await getPg();
       const session = await pg.createSession({ userId, token, expiresAt });
      logger.debug('Session created:', session);
      return session;
    } catch (e) {
      logger.debug('Error creating session:', e);
      throw e;
    }
  };

 export const getSessionByToken = async (token) => {
   try {
     const pg = await getPg();
     return await pg.getSessionByToken(token);
   } catch (e) {
     logger.debug('Error getting session by token:', e);
     return null;
   }
 };

  export const deleteSession = async (token) => {
    try {
      const pg = await getPg();
      await pg.deleteSession(token);
      logger.debug('Deleted session:', token);
    } catch (e) {
      logger.debug('Error deleting session:', e);
    }
  };

  export const deleteExpiredSessions = async () => {
    try {
      const pg = await getPg();
      await pg.deleteExpiredSessions();
      logger.debug('Deleted expired sessions');
    } catch (e) {
      logger.debug('Error deleting expired sessions:', e);
    }
  };

// Credits functions
  export const addCreditTransaction = async (userId, type, amount, description) => {
    try {
      const pg = await getPg();
       const transaction = await pg.addCreditTransaction({ userId, type, amount, description });
      return transaction;
    } catch (error) {
      logger.error('Error adding credit transaction:', error);
      throw error;
    }
  };



    export const getUserCredits = async (userId) => {
      try {
        const pg = await getPg();
        return await pg.getUserCredits(userId);
      } catch (e) {
        logger.debug('Error getting user credits:', e);
        return [];
      }
    };

 export const getUserCreditBalance = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getUserCreditBalance(userId);
   } catch (e) {
     logger.debug('Error getting user credit balance:', e);
     return 0;
   }
 };

// Billing functions
 export const addBillingRecord = async (userId, type, amount, description, dueDate = null) => {
   try {
     const pg = await getPg();
      const billingRecord = await pg.addBillingRecord({ userId, type, amount, description, dueDate });
     logger.debug('Billing record added:', billingRecord);
     triggerSync();
     return billingRecord;
   } catch (e) {
     logger.debug('Error adding billing record:', e);
     throw e;
   }
 };

 export const getUserBilling = async (userId) => {
   try {
     const pg = await getPg();
     return await pg.getUserBilling(userId);
   } catch (e) {
     logger.debug('Error getting user billing:', e);
     return [];
   }
 };

 export const consumeCredits = async (userId, amount, description) => {
   try {
     const pg = await getPg();
     return await pg.consumeCredits(userId, amount, description);
   } catch (error) {
     logger.error('Error consuming credits:', error);
     throw error;
   }
 };

export const getCreditBalance = async (userId) => {
  return await safeDbCall(
    (pg) => pg.getCreditBalance(userId),
    0,
    'getCreditBalance'
  );
};

  export const getCreditTransactions = async (userId) => {
    try {
      const pg = await getPg();
      return await pg.getCreditTransactions(userId);
    } catch (error) {
      logger.error('Error getting credit transactions:', error);
      return [];
    }
  };

    // Activity functions
 export const logActivity = async (userId, actionType, entityType, entityId, description, metadata = {}) => {
   try {
     const pg = await getPg();
     const activity = await pg.logActivity({ userId, actionType, entityType, entityId, description, metadata });
     return activity;
   } catch (error) {
     logger.error('Error logging activity:', error);
     throw error;
   }
 };

export const getUserActivities = async (userId, limit = 50, offset = 0) => {
  try {
    const pg = await getPg();
    return await pg.getUserActivities({ userId, limit, offset });
  } catch (error) {
    logger.error('Error getting user activities:', error);
    return [];
  }
};

  export const createNotification = async (userId, type, title, message, createdAt = null) => {
    try {
      const pg = await getPg();
       const notification = await pg.createNotification({ userId, type, title, message });
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  };

export const getUserNotifications = async (userId) => {
  return await safeDbCall(
    (pg) => pg.getUserNotifications(userId),
    [],
    'getUserNotifications'
  );
};

  export const markNotificationRead = async (notificationId, userId) => {
    try {
      const pg = await getPg();
       const result = await pg.markNotificationRead({ notificationId, userId });
      return result;
    } catch (error) {
      logger.error('Error marking notification read:', error);
      return false;
    }
  };

 export const getPackages = async () => {
   try {
     const pg = await getPg();
     return await pg.getPackages();
   } catch (error) {
     logger.error('Error getting packages:', error);
     return [];
   }
 };

export const getUserSubscription = async (userId) => {
  return await safeDbCall(
    (pg) => pg.getUserSubscription(userId),
    null,
    'getUserSubscription'
  );
};

   export const createUserSubscription = async (userId, packageId, subscriptionData = {}) => {
     try {
       const pg = await getPg();
        const subscription = await pg.createUserSubscription(userId, packageId, subscriptionData);
       logger.debug('User subscription created:', subscription);
       return subscription;
     } catch (error) {
       logger.error('Error creating user subscription:', error);
       throw error;
     }
   };

  export const changeUserSubscription = async (userId, newPackageId, currentSubscription = null) => {
    try {
      const pg = await getPg();
       const newSubscription = await pg.changeUserSubscription(userId, newPackageId, currentSubscription);
      return newSubscription;
    } catch (error) {
      logger.error('Error changing user subscription:', error);
      throw error;
    }
  };

 export const updateUserSubscription = async (userId, subscriptionId, updates) => {
   try {
     const pg = await getPg();
      const result = await pg.updateUserSubscription({ userId, subscriptionId, updates });
     logger.debug('Updated user subscription:', subscriptionId);
     return result;
   } catch (error) {
     logger.error('Error updating user subscription:', error);
     throw error;
   }
 };

 export const getUserProfile = async (userId) => {
  return await safeDbCall(
    (pg) => pg.getUserProfile(userId),
    null,
    'getUserProfile'
  );
};

  export const createUserProfile = async (userId, profileData = {}) => {
    try {
      const pg = await getPg();
       const profile = await pg.createUserProfile({ userId, profileData });
      return profile;
    } catch (error) {
      logger.error('Error creating user profile:', error);
      throw error;
    }
  };

  export const updateBillingStatus = async (id, status) => {
    try {
      const pg = await getPg();
      await pg.updateBillingStatus(id, status);
      logger.debug('Updated billing status:', id, status);
    } catch (e) {
      logger.debug('Error updating billing status:', e);
    }
  };

// Seeding function for initial data
  export const isSeeded = async () => {
    try {
      const pg = await getPg();
      const result = await pg.query(`SELECT version FROM db_version WHERE version >= 2`);
      return result.length > 0;
    } catch (e) {
      logger.debug('Error checking if seeded:', e);
      return false;
    }
  };

  export const seedPackages = async () => {
    try {
      const pg = await getPg();
      const result = await pg.seedPackages();
      logger.debug('Packages seeded successfully');
      return result;
    } catch (e) {
      if (e.message.includes('Database unavailable')) {
        logger.warn('Database unavailable, skipping package seeding');
        return;
      }
      logger.debug('Error seeding packages:', e);
    }
  };

  export const seedInitialData = async () => {
    try {
      logger.debug('Seeding initial data...');

      const currentVersion = 2;
      const pg = await getPg();
      // Initialize the database schema
      await pg.initDatabase();
      let version = 0;
      try {
        const res = await pg.query(`SELECT version FROM db_version`);
        if (res.length > 0) version = res[0].version;
      } catch (e) {}
      if (version < currentVersion) {
        logger.debug('Migrating database to version', currentVersion);
        // Drop all tables in reverse order
        const tables = ['db_version', 'projects', 'tasks', 'users', 'sessions', 'credits', 'billing', 'notifications', 'packages', 'user_subscriptions', 'profiles', 'groups', 'project_groups', 'user_activities', 'portfolio_invitations', 'portfolio_collaborators'];
        for (const table of tables.reverse()) {
          await pg.exec(`DROP TABLE IF EXISTS ${table}`);
        }
        version = 0;
      }
      if (version === 0) {
        // Seed packages (these are system-wide, not user-specific)
        await seedPackages();
        // Insert version
        await pg.exec(`INSERT INTO db_version (version) VALUES (${currentVersion})`);
      }

      logger.debug('Initial data seeded successfully');
    } catch (e) {
      if (e.message.includes('Database unavailable')) {
        logger.warn('Database unavailable, skipping initial data seeding');
        return;
      }
      logger.debug('Error seeding data:', e);
    }
  };

 export const seedSampleNotifications = async (userId) => {
   try {
     const pg = await getPg();
     await pg.seedSampleNotifications(userId);
   } catch (e) {
     logger.debug('Error creating sample notifications:', e);
   }
 };

// Sync data with Supabase
// Portfolio Collaboration Functions
  export const inviteCollaborator = async (portfolioId, inviteeEmail, role = 'editor', message = '') => {
    try {
      const inviterId = await getCurrentUserId();
      const pg = await getPg();
      const invitation = await pg.inviteCollaborator(portfolioId, inviteeEmail, role, message, inviterId);
      return invitation;
    } catch (error) {
      logger.error('Error inviting collaborator:', error);
      throw error;
    }
  };

 export const getPortfolioInvitations = async (portfolioId) => {
   try {
     const pg = await getPg();
     return await pg.getPortfolioInvitations(portfolioId);
   } catch (error) {
     logger.error('Error getting portfolio invitations:', error);
     return [];
   }
 };

 export const getUserInvitations = async (userEmail) => {
   try {
     const pg = await getPg();
     return await pg.getUserInvitations(userEmail);
   } catch (error) {
     logger.error('Error getting user invitations:', error);
     return [];
   }
 };

  export const respondToInvitation = async (invitationId, status) => {
    try {
      const userId = await getCurrentUserId();
      const pg = await getPg();
     const result = await pg.respondToInvitation(invitationId, status, userId);

     return result;
    } catch (error) {
      logger.error('Error responding to invitation:', error);
      throw error;
    }
  };

 export const getPortfolioCollaborators = async (portfolioId) => {
   try {
     const pg = await getPg();
     return await pg.getPortfolioCollaborators(portfolioId);
   } catch (error) {
     logger.error('Error getting portfolio collaborators:', error);
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

      return result;
    } catch (error) {
      logger.error('Error removing collaborator:', error);
      throw error;
    }
  };

  export const updateCollaboratorRole = async (portfolioId, userId, role) => {
    try {
      const pg = await getPg();
      const result = await pg.updateCollaboratorRole(portfolioId, userId, role);
      return result;
    } catch (error) {
      logger.error('Error updating collaborator role:', error);
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

