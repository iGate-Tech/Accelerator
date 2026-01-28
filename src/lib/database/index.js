// Database module exports
export {
  dbInstance,
  dbReady,
  initDatabase,
  query,
  exec,
  close,
  getPg,
  ensureDatabaseReady,
  safeQuery,
  getDbStatus,
} from './core.js';
export { updateEntity, getEntities, createSchema } from './operations.js';
import { dbInstance } from './core.js';

// Simple exports for commonly used functions
export const getProjects = async (userId = null) => {
  if (!userId) {
    const { authAPI } = await import('../auth/data.js');
    const user = await authAPI.getCurrentUser();
    userId = user?.id;
  }
  if (!userId) return [];

  // Ensure database is initialized before querying
  try {
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();
  } catch (e) {
    console.warn('Failed to initialize database:', e);
    return [];
  }

  const { _getProjects } = await import('./projects.js');
  return await _getProjects({ userId });
};

export const getUserActivities = async (userId, limit = 50, offset = 0) => {
  const { _getUserActivities } = await import('./activities.js');
  return await _getUserActivities({ userId, limit, offset });
};

export const getPublicProjectsWithVotes = async currentUserId => {
  const { _getPublicProjectsWithVotes } = await import('./votes.js');
  return await _getPublicProjectsWithVotes({ currentUserId });
};

export const getSessionByToken = async token => {
  const { _getSessionByToken } = await import('./seeding.js');
  return await _getSessionByToken({ token });
};

export const createSession = async (userId, token, expiresAt) => {
  const { _createSession } = await import('./seeding.js');
  return await _createSession({ userId, token, expiresAt });
};

export const deleteSession = async token => {
  const { _deleteSession } = await import('./seeding.js');
  return await _deleteSession({ token });
};

export const getUserById = async id => {
  const { _getUserById } = await import('./users.js');
  return await _getUserById({ id });
};

export const getUserByEmail = async email => {
  const { _getUserByEmail } = await import('./users.js');
  return await _getUserByEmail({ email });
};

export const createUser = async (
  email,
  passwordHash,
  profile = {},
  userId = null
) => {
  const { _createUser } = await import('./users.js');
  return await _createUser({ email, passwordHash, profile, userId });
};

export const updateUser = async (id, updates) => {
  const { _updateUser } = await import('./users.js');
  return await _updateUser({ id, updates });
};

export const addProject = async (project, userId = null) => {
  const { _createProject } = await import('./projects.js');
  if (!userId) {
    throw new Error('User ID is required');
  }
  project.public = 0; // Ensure private by default
  const result = await _createProject({ project, userId });
  // Return just the ID, not the full object
  return result?.id;
};

export const updateProject = async (id, project) => {
  const { _updateProject } = await import('./projects.js');
  return await _updateProject({ id, updates: project });
};

export const deleteProject = async id => {
  const { _deleteProject } = await import('./projects.js');
  return await _deleteProject({ id });
};

export const deleteAllProjects = async (userId = null) => {
  if (!userId) {
    const { authAPI } = await import('../auth/data.js');
    const user = await authAPI.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    userId = user.id;
  }
  if (!userId) throw new Error('User ID required');
  const { _deleteAllProjects } = await import('./projects.js');
  return await _deleteAllProjects({ userId });
};

export const exportAllProjects = async (userId = null) => {
  if (!userId) {
    const { authAPI } = await import('../auth/data.js');
    const user = await authAPI.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    userId = user.id;
  }
  if (!userId) return null;
  const { _exportAllProjects } = await import('./groups.js');
  return await _exportAllProjects({ userId });
};

export const exportAllData = async (userId = null) => {
  if (!userId) {
    const { authAPI } = await import('../auth/data.js');
    const user = await authAPI.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    userId = user.id;
  }
  if (!userId) return null;

  try {
    // Ensure database is initialized
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();

    // Get user credentials (email and password hash)
    const { _getUserById } = await import('./users.js');
    const userData = await _getUserById({ id: userId });

    const projects = await exportAllProjects(userId);
    const profile = await getUserProfile(userId);
    const { getUserActivities } = await import('./index.js');
    const activities = await getUserActivities(userId);

    // Full data export with credentials and profile including avatar
    return {
      // Login credentials - email and password hash
      credentials: {
        email: userData?.email || '',
        // Password hash cannot be used for login but is included for backup completeness
        // The plaintext password is not stored anywhere
        passwordHash: userData?.password_hash || '',
        note: 'Password hash is stored but cannot be used to login. Use your current password to restore access.',
      },

      // Personal data - include avatar with base64 image
      profile: {
        id: profile?.user_id || profile?.id,
        email: userData?.email,
        name: profile?.name,
        bio: profile?.bio,
        location: profile?.location,
        website: profile?.website,
        avatar: profile?.avatar, // Base64 encoded image
        preferences: profile?.preferences,
        createdAt: profile?.created_at,
        lastModified: profile?.last_modified,
      },

      // Projects and content
      projects: projects?.projects || projects?.data || [],

      // Tasks from all projects
      tasks: projects?.tasks || [],

      // Activity history (for transparency)
      activities:
        activities?.map(activity => ({
          actionType: activity.action_type,
          description: activity.description,
          timestamp: activity.created_at,
          metadata: activity.metadata,
        })) || [],

      // Export metadata
      exportMetadata: {
        exportDate: new Date().toISOString(),
        userId: userId,
        version: '1.0',
        gdprCompliance: {
          article20: 'Right to Data Portability',
          article17: 'Right to Erasure (Data Deletion)',
          exportFormat: 'JSON',
          retentionPolicy: 'Data retained until account deletion',
        },
      },
    };
  } catch (error) {
    console.error('Failed to export all data:', error);
    return null;
  }
};

export const getUserCredits = async userId => {
  const { _getUserCredits } = await import('./credits.js');
  return await _getUserCredits({ userId });
};

export const getUserCreditBalance = async userId => {
  const { _getUserCreditBalance } = await import('./credits.js');
  return await _getUserCreditBalance({ userId });
};

export const addCreditTransaction = async (
  userId,
  type,
  amount,
  description
) => {
  const { _addCreditTransaction } = await import('./credits.js');
  return await _addCreditTransaction({ userId, type, amount, description });
};

export const logActivity = async (
  userId,
  actionType,
  entityType,
  entityId,
  description,
  metadata = {}
) => {
  const { _logActivity } = await import('./activities.js');
  return await _logActivity({
    userId,
    actionType,
    entityType,
    entityId,
    description,
    metadata,
  });
};

export const getUserNotifications = async userId => {
  const { _getUserNotifications } = await import('./activities.js');
  return await _getUserNotifications({ userId });
};

export const getCreditBalance = async userId => {
  const { _getCreditBalance } = await import('./credits.js');
  return await _getCreditBalance({ userId });
};

export const getUserSubscription = async userId => {
  const { _getUserSubscription } = await import('./packages.js');
  return await _getUserSubscription({ userId });
};

export const exportProject = async projectId => {
  try {
    // Ensure database is initialized
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();

    const { _getProjectById } = await import('./projects.js');
    const project = await _getProjectById({ id: projectId });
    if (!project) throw new Error('Project not found');

    const { getTasks } = await import('./operations.js');
    const tasks = await getTasks({ projectId });

    return {
      project,
      tasks,
      exportedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error exporting project:', error);
    throw error;
  }
};

export const exportReports = async projectId => {
  try {
    // Ensure database is initialized
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();

    const { _getProjectById } = await import('./projects.js');
    const project = await _getProjectById({ id: projectId });
    if (!project) throw new Error('Project not found');

    const { getTasks } = await import('./operations.js');
    const tasks = await getTasks({ projectId });
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      projectName: project.name,
      description: project.description,
      status: project.status,
      progress: `${progress.toFixed(1)}%`,
      totalTasks,
      completedTasks,
      createdAt: project.created_at,
      exportedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};

export const initDb = async () => {
  const { initDatabase } = await import('./core.js');
  return await initDatabase();
};

export const voteOnProject = async (projectId, userId, voteType) => {
  const { voteOnProject: _voteOnProject } = await import('./operations.js');
  return await _voteOnProject({ projectId, userId, voteType });
};

export const toggleProjectPublic = async id => {
  const { toggleProjectPublic: _toggleProjectPublic } =
    await import('./operations.js');
  return await _toggleProjectPublic({ id });
};

export const getUserProfile = async userId => {
  const { _getUserProfile } = await import('./users.js');
  return await _getUserProfile({ userId });
};

export const createUserProfile = async (userId, profileData = {}) => {
  const { _createUserProfile } = await import('./users.js');
  return await _createUserProfile({ userId, profileData });
};

export const setCurrentUser = async user => {
  const { setCurrentUser: _setCurrentUser } = await import('../db.js');
  return await _setCurrentUser(user);
};

export const consumeCredits = async (userId, amount, description) => {
  const { consumeCredits: _consumeCredits } = await import('./operations.js');
  return await _consumeCredits({ userId, amount, description });
};

export const getGroupsWithProjects = async (userId = null) => {
  const { getGroupsWithProjects: _getGroupsWithProjects } =
    await import('./operations.js');
  return await _getGroupsWithProjects({ userId });
};

export const getUngroupedProjects = async (userId = null) => {
  const { getUngroupedProjects: _getUngroupedProjects } =
    await import('./operations.js');
  return await _getUngroupedProjects({ userId });
};

export const getGroups = async (userId = null) => {
  const { getGroups: _getGroups } = await import('./operations.js');
  return await _getGroups({ userId });
};

export const addGroup = async (group, userId) => {
  const { addGroup: _addGroup } = await import('./operations.js');
  return await _addGroup({ group, userId });
};

export const updateGroup = async (id, group) => {
  const { updateGroup: _updateGroup } = await import('./operations.js');
  return await _updateGroup({ id, group });
};

export const deleteGroup = async id => {
  const { deleteGroup: _deleteGroup } = await import('./operations.js');
  return await _deleteGroup({ id });
};

export const addProjectToGroup = async (projectId, groupId) => {
  const { addProjectToGroup: _addProjectToGroup } =
    await import('./operations.js');
  return await _addProjectToGroup({ projectId, groupId });
};

export const removeProjectFromGroup = async (projectId, groupId) => {
  const { removeProjectFromGroup: _removeProjectFromGroup } =
    await import('./operations.js');
  return await _removeProjectFromGroup({ projectId, groupId });
};

export const inviteCollaborator = async (
  portfolioId,
  inviteeEmail,
  role = 'editor',
  message = '',
  inviterId
) => {
  const { inviteCollaborator: _inviteCollaborator } =
    await import('./operations.js');
  return await _inviteCollaborator({
    portfolioId,
    inviteeEmail,
    role,
    message,
    inviterId,
  });
};

export const getPortfolioInvitations = async portfolioId => {
  const { getPortfolioInvitations: _getPortfolioInvitations } =
    await import('./operations.js');
  return await _getPortfolioInvitations({ portfolioId });
};

export const getPortfolioCollaborators = async portfolioId => {
  const { getPortfolioCollaborators: _getPortfolioCollaborators } =
    await import('./operations.js');
  return await _getPortfolioCollaborators({ portfolioId });
};

export const removeCollaborator = async (portfolioId, userId) => {
  const { removeCollaborator: _removeCollaborator } =
    await import('./operations.js');
  return await _removeCollaborator({ portfolioId, userId });
};

export const updateCollaboratorRole = async (portfolioId, userId, role) => {
  const { updateCollaboratorRole: _updateCollaboratorRole } =
    await import('./operations.js');
  return await _updateCollaboratorRole({ portfolioId, userId, role });
};

export const updateUserProfile = async (userId, updates) => {
  const { _updateUserProfile } = await import('./users.js');
  return await _updateUserProfile({ userId, updates });
};

export const seedPackages = async () => {
  const { seedPackages: _seedPackages } = await import('./operations.js');
  return await _seedPackages();
};

export const createUserSubscription = async (
  userId,
  packageId,
  subscriptionData = {}
) => {
  const { createUserSubscription: _createUserSubscription } =
    await import('./operations.js');
  return await _createUserSubscription({ userId, packageId, subscriptionData });
};

export const getUserBilling = async userId => {
  const { getUserBilling: _getUserBilling } = await import('./operations.js');
  return await _getUserBilling({ userId });
};

export const markNotificationRead = async (notificationId, userId) => {
  const { markNotificationRead: _markNotificationRead } =
    await import('./operations.js');
  return await _markNotificationRead({ notificationId, userId });
};

export const getUserInvitations = async userEmail => {
  const { _getUserInvitations } = await import('./collaboration.js');
  return await _getUserInvitations({ userEmail });
};

export const respondToInvitation = async (invitationId, status) => {
  const { _respondToInvitation } = await import('./collaboration.js');
  return await _respondToInvitation({ invitationId, status });
};

export const addTask = async (task, projectId, userId = null) => {
  try {
    const { _addTask } = await import('./operations.js');
    const result = await _addTask({ task, projectId, userId });
    if (result && typeof result === 'object' && 'id' in result) {
      return result.id;
    } else {
      console.error('[addTask] Unexpected result structure:', result);
      return undefined;
    }
  } catch (error) {
    console.error('[addTask] Error:', error);
    throw error;
  }
};

export const clearAllTasks = async () => {
  const { clearAllTasks: _clearAllTasks } = await import('./operations.js');
  return await _clearAllTasks({});
};

export const getProjectById = async id => {
  const { _getProjectById } = await import('./operations.js');
  return await _getProjectById({ id });
};

export const getProjectByName = async name => {
  const { _getProjectByName } = await import('./votes.js');
  return await _getProjectByName({ name });
};

export const getTasks = async projectId => {
  const { getTasks } = await import('./operations.js');
  return await getTasks({ projectId });
};

export const updateTask = async (id, updates) => {
  const { _updateTask } = await import('./projects.js');
  return await _updateTask({ id, ...updates });
};

export const deleteTask = async id => {
  await dbInstance.query(`DELETE FROM tasks WHERE id = $1`, [id]);
};

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Import user profile data
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to import
 * @returns {Promise<Object>}
 */
export const importUserProfile = async (userId, profileData) => {
  try {
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();

    const { _createUserProfile } = await import('./users.js');
    return await _createUserProfile({ userId, profileData });
  } catch (error) {
    console.error('Error importing user profile:', error);
    throw error;
  }
};

/**
 * Import a single project
 * @param {Object} projectData - Project data to import
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Project ID
 */
export const importProject = async (projectData, userId) => {
  try {
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();

    const { addProject: _addProject } = await import('./projects.js');
    return await _addProject({ project: projectData, userId });
  } catch (error) {
    console.error('Error importing project:', error);
    throw error;
  }
};

/**
 * Import a single task
 * @param {Object} taskData - Task data to import
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Task ID
 */
export const importTask = async (taskData, projectId, userId) => {
  try {
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();

    const { addTask: _addTask } = await import('./projects.js');
    return await _addTask({ task: taskData, projectId, userId });
  } catch (error) {
    console.error('Error importing task:', error);
    throw error;
  }
};

/**
 * Import all data from a backup file
 * @param {Object} backupData - Backup data object
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Import summary
 */
export const importAllData = async (backupData, userId) => {
  const summary = {
    profileImported: false,
    projectsImported: 0,
    tasksImported: 0,
    errors: [],
  };

  try {
    const { ensureDatabaseReady } = await import('./core.js');
    await ensureDatabaseReady();

    // Import profile
    if (backupData.profile) {
      try {
        await importUserProfile(userId, {
          name: backupData.profile.name,
          bio: backupData.profile.bio,
          avatar: backupData.profile.avatar,
          preferences:
            typeof backupData.profile.preferences === 'string'
              ? JSON.parse(backupData.profile.preferences)
              : backupData.profile.preferences,
        });
        summary.profileImported = true;
      } catch (error) {
        summary.errors.push(`Profile import failed: ${error.message}`);
      }
    }

    // Import projects
    const projects = backupData.projects || backupData.data || [];
    for (const project of projects) {
      try {
        const projectId = await importProject(project, userId);
        summary.projectsImported++;

        // Import tasks for this project
        const tasks = project.tasks || [];
        for (const task of tasks) {
          try {
            await importTask(task, projectId, userId);
            summary.tasksImported++;
          } catch (error) {
            summary.errors.push(`Task import failed: ${error.message}`);
          }
        }
      } catch (error) {
        summary.errors.push(`Project import failed: ${error.message}`);
      }
    }

    return summary;
  } catch (error) {
    console.error('Error importing all data:', error);
    throw error;
  }
};
