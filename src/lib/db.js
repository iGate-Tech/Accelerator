// Main database module - combines all database functionality
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

// Import core database functionality
export { query, exec, transaction, close, getEntities, updateEntity, getPg } from './db-core.js';

// Import user functions
export { _createUser, _getUserById, _getUserByEmail, _updateUser, _deleteUser, _createUserProfile, _getUserProfile } from './db-users.js';

// Import project functions
export { _createProject, _getProjectById, _updateProject, _deleteProject, _deleteAllProjects, _toggleProjectPublic, _getTasks, _addTask, _updateTask, _getProjects } from './db-projects.js';

// Import group functions
export {
  _getGroups,
  _getGroupById,
  _addGroup,
  _updateGroup,
  _deleteGroup,
  _addProjectToGroup,
  _removeProjectFromGroup,
  _getProjectsInGroup,
  _getUngroupedProjects,
  _getGroupsWithProjects,
  _exportAllProjects
} from './db-groups.js';

// Import credit functions
export {
  _addCreditTransaction,
  _getUserCredits,
  _getCreditTransactions,
  _getCreditBalance,
  _getUserCreditBalance,
  _consumeCredits,
  _addBillingRecord,
  _getUserBilling,
  _updateBillingStatus
} from './db-credits.js';

// Import activity functions
export {
  _logActivity,
  _getUserActivities,
  _createNotification,
  _getUserNotifications,
  _markNotificationRead
} from './db-activities.js';

// Import package functions
export {
  _seedPackages,
  _getPackages,
  _createUserSubscription,
  _getUserSubscription,
  _changeUserSubscription,
  _updateUserSubscription
} from './db-packages.js';

// Import voting functions
export {
  _voteOnProject,
  _getProjectVotes,
  _getPublicProjectsWithVotes,
  _getPublicProjects,
  _getProjectByName
} from './db-votes.js';

// Import seeding functions
export {
  _seedSampleNotifications,
  _seedInitialData,
  _isSeeded,
  _createSession,
  _getSessionByToken,
  _deleteSession,
  _deleteExpiredSessions
} from './db-seeding.js';

// Import collaboration functions
export {
  _inviteCollaborator,
  _getPortfolioInvitations,
  _getUserInvitations,
  _respondToInvitation,
  _getPortfolioCollaborators,
  _removeCollaborator,
  _updateCollaboratorRole
} from './db-collaboration.js';

// Local user management for PGLite only
let currentUser = { id: 1 };
const getCurrentUser = async () => {
  return currentUser;
};
export const setCurrentUser = (user) => {
  currentUser = user || { id: 1 };
};

// Exported API functions (wrappers for the internal functions)
export const createUser = async (email, passwordHash, profile = {}, userId = null) => {
  const { _createUser } = await import('./db-users.js');
  return await _createUser({ email, passwordHash, profile, userId });
};

export const getUserById = async (id) => {
  const { _getUserById } = await import('./db-users.js');
  return await _getUserById({ id });
};

export const getUserByEmail = async (email) => {
  const { _getUserByEmail } = await import('./db-users.js');
  return await _getUserByEmail({ email });
};

export const updateUser = async (id, updates) => {
  const { _updateUser } = await import('./db-users.js');
  return await _updateUser({ id, updates });
};

export const deleteUser = async (id) => {
  const { _deleteUser } = await import('./db-users.js');
  return await _deleteUser({ id });
};

export const createUserProfile = async (userId, profileData = {}) => {
  const { _createUserProfile } = await import('./db-users.js');
  return await _createUserProfile({ userId, profileData });
};

export const getUserProfile = async (userId) => {
  try {
    const { getPg } = await import('./db-core.js');
    const db = await getPg();
    const res = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error getting user profile:', err);
    return null;
  }
};

export const addProject = async (project) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    project.public = 0; // Ensure private by default

    const { _createProject } = await import('./db-projects.js');
    const newProject = await _createProject({ project, userId: user.id });
    logger.debug('Added project:', newProject);

    // Dispatch event to notify UI components
    window.dispatchEvent(new CustomEvent('projectAdded'));

    // TODO: Add activity logging when implemented
    // await logActivity(user.id, 'project_created', 'project', newProject.id, `Created project "${project.name}"`);

    return newProject.id;
  } catch (e) {
    logger.debug('Error adding project:', e);
    throw e;
  }
};

export const getProjectById = async (id) => {
  const { _getProjectById } = await import('./db-projects.js');
  return await _getProjectById({ id });
};

export const updateProject = async (id, project) => {
  const { _updateProject } = await import('./db-projects.js');
  return await _updateProject({ id, updates: project });
};

export const deleteProject = async (id) => {
  const { _deleteProject } = await import('./db-projects.js');
  return await _deleteProject({ id });
};

export const deleteAllProjects = async () => {
  const user = await getCurrentUser();
  const { _deleteAllProjects } = await import('./db-projects.js');
  return await _deleteAllProjects({ userId: user.id });
};

export const toggleProjectPublic = async (projectId, isPublic) => {
  const { _toggleProjectPublic } = await import('./db-projects.js');
  return await _toggleProjectPublic({ id: projectId });
};

export const getTasks = async (project_id = null, userId = null) => {
  const { _getTasks } = await import('./db-projects.js');
  return await _getTasks({ projectId: project_id });
};

export const addTask = async (task, project_id, user_id) => {
  const taskWithProjectId = { ...task, projectId: project_id, userId: user_id };
  const { _addTask } = await import('./db-projects.js');
  return await _addTask({ task: taskWithProjectId });
};

export const updateTask = async (id, content) => {
  const { _updateTask } = await import('./db-projects.js');
  return await _updateTask({ id, content });
};

export const getProjects = async (userId = null) => {
  if (!userId) {
    const user = await getCurrentUser();
    userId = user?.id;
  }
  if (!userId) return [];
  const { _getProjects } = await import('./db-projects.js');
  return await _getProjects({ userId });
};

// Initialize database on module load
export const initDb = async () => {
  try {
    const { initDatabase } = await import('./db-core.js');
    await initDatabase();
  } catch (error) {
    console.warn('Database initialization failed, but continuing with limited functionality:', error.message);
  }
};

// Placeholder functions for now (to be implemented in other modules)
export const clearAllTasks = async () => {
  const user = await getCurrentUser();
  await dbInstance.query('DELETE FROM tasks WHERE user_id = $1', [user.id]);
};

export const getPublicProjects = async () => {
  return await _getPublicProjects();
};

export const getPublicProjectsWithVotes = async (currentUserId) => {
  const { _getPublicProjectsWithVotes } = await import('./db-votes.js');
  return await _getPublicProjectsWithVotes({ currentUserId });
};

export const getProjectByName = async (name) => {
  return await _getProjectByName({ name });
};

export const getGroups = async (userId = null) => {
  const { _getGroups } = await import('./db-groups.js');
  return await _getGroups({ userId });
};

export const getGroupById = async (id) => {
  const { _getGroupById } = await import('./db-groups.js');
  return await _getGroupById({ id });
};

export const addGroup = async (group) => {
  const user = await getCurrentUser();
  const { _addGroup } = await import('./db-groups.js');
  return await _addGroup({ group, userId: user.id });
};

export const updateGroup = async (id, group) => {
  const { _updateGroup } = await import('./db-groups.js');
  return await _updateGroup({ id, group });
};

export const deleteGroup = async (id) => {
  const { _deleteGroup } = await import('./db-groups.js');
  return await _deleteGroup({ id });
};

export const exportAllProjects = async (userId = null) => {
  if (!userId) {
    const user = await getCurrentUser();
    userId = user?.id;
  }
  if (!userId) return null;
  const { _exportAllProjects } = await import('./db-groups.js');
  return await _exportAllProjects({ userId });
};

export const exportAllData = async (userId = null) => {
  if (!userId) {
    const user = await getCurrentUser();
    userId = user?.id;
  }
  if (!userId) return null;
  try {
    const projects = await exportAllProjects(userId);
    // Add other data as needed
    return {
      projects: projects?.data || [],
      exportedAt: new Date().toISOString(),
      userId
    };
  } catch (error) {
    console.error('Export all data failed:', error);
    throw error;
  }
};

export const exportProject = async (projectId) => {
  try {
    const project = await getProjectById(projectId);
    if (!project) throw new Error('Project not found');
    const tasks = await getTasks(projectId);
    return {
      project,
      tasks,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Export project failed:', error);
    throw error;
  }
};

export const exportReports = async (projectId) => {
  try {
    const project = await getProjectById(projectId);
    if (!project) throw new Error('Project not found');
    const tasks = await getTasks(projectId);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return {
      projectName: project.name,
      description: project.description,
      status: project.uiStatus,
      progress: `${progress.toFixed(1)}%`,
      totalTasks,
      completedTasks,
      creditsUsed: project.consumedCredits || 0,
      timeSpent: project.consumedTime || 0,
      createdAt: project.createdAt,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Export reports failed:', error);
    throw error;
  }
};

export const addProjectToGroup = async (projectId, groupId) => {
  const user = await getCurrentUser();
  const { _addProjectToGroup } = await import('./db-groups.js');
  return await _addProjectToGroup({ projectId, groupId, userId: user.id });
};

export const removeProjectFromGroup = async (projectId, groupId) => {
  const { _removeProjectFromGroup } = await import('./db-groups.js');
  return await _removeProjectFromGroup({ projectId, groupId });
};

export const getProjectsInGroup = async (groupId) => {
  const { _getProjectsInGroup } = await import('./db-groups.js');
  return await _getProjectsInGroup({ groupId });
};

export const getUngroupedProjects = async (userId = null) => {
  if (!userId) {
    const user = await getCurrentUser();
    userId = user?.id;
  }
  const { _getUngroupedProjects } = await import('./db-groups.js');
  return await _getUngroupedProjects({ userId });
};

export const getGroupsWithProjects = async (userId = null) => {
  const { _getGroupsWithProjects } = await import('./db-groups.js');
  return await _getGroupsWithProjects({ userId });
};

export const addCreditTransaction = async (userId, type, amount, description) => {
  const { _addCreditTransaction } = await import('./db-credits.js');
  return await _addCreditTransaction({ userId, type, amount, description });
};

export const getUserCredits = async (userId) => {
  const { _getUserCredits } = await import('./db-credits.js');
  return await _getUserCredits({ userId });
};

export const getUserCreditBalance = async (userId) => {
  const { _getUserCreditBalance } = await import('./db-credits.js');
  return await _getUserCreditBalance({ userId });
};

export const addBillingRecord = async (userId, type, amount, description, dueDate = null) => {
  const { _addBillingRecord } = await import('./db-credits.js');
  return await _addBillingRecord({ userId, type, amount, description, dueDate });
};

export const getUserBilling = async (userId) => {
  const { _getUserBilling } = await import('./db-credits.js');
  return await _getUserBilling({ userId });
};

export const consumeCredits = async (userId, amount, description) => {
  const { _consumeCredits } = await import('./db-credits.js');
  return await _consumeCredits({ userId, amount, description });
};

export const getCreditBalance = async (userId) => {
  const { _getCreditBalance } = await import('./db-credits.js');
  return await _getCreditBalance({ userId });
};

export const getCreditTransactions = async (userId) => {
  const { _getCreditTransactions } = await import('./db-credits.js');
  return await _getCreditTransactions({ userId });
};

export const logActivity = async (userId, actionType, entityType, entityId, description, metadata = {}) => {
  const { _logActivity } = await import('./db-activities.js');
  return await _logActivity({ userId, actionType, entityType, entityId, description, metadata });
};

export const getUserActivities = async (userId, limit = 50, offset = 0) => {
  const { _getUserActivities } = await import('./db-activities.js');
  return await _getUserActivities({ userId, limit, offset });
};

export const createNotification = async (userId, type, title, message, createdAt = null) => {
  const { _createNotification } = await import('./db-activities.js');
  return await _createNotification({ userId, type, title, message });
};

export const getUserNotifications = async (userId) => {
  const { _getUserNotifications } = await import('./db-activities.js');
  return await _getUserNotifications({ userId });
};

export const markNotificationRead = async (notificationId, userId) => {
  const { _markNotificationRead } = await import('./db-activities.js');
  return await _markNotificationRead({ notificationId, userId });
};

export const getPackages = async () => {
  const { _getPackages } = await import('./db-packages.js');
  return await _getPackages();
};

export const getUserSubscription = async (userId) => {
  const { _getUserSubscription } = await import('./db-packages.js');
  return await _getUserSubscription({ userId });
};

export const createUserSubscription = async (userId, packageId, subscriptionData = {}) => {
  const { _createUserSubscription } = await import('./db-packages.js');
  return await _createUserSubscription({ userId, packageId, subscriptionData });
};

export const changeUserSubscription = async (userId, newPackageId, currentSubscription = null) => {
  const { _changeUserSubscription } = await import('./db-packages.js');
  return await _changeUserSubscription({ userId, newPackageId, currentSubscription });
};

export const updateUserSubscription = async (userId, subscriptionId, updates) => {
  const { _updateUserSubscription } = await import('./db-packages.js');
  return await _updateUserSubscription({ userId, subscriptionId, updates });
};

export const isSeeded = async () => {
  const { _isSeeded } = await import('./db-packages.js');
  return await _isSeeded();
};

export const seedPackages = async () => {
  const { _seedPackages } = await import('./db-packages.js');
  return await _seedPackages();
};

export const seedInitialData = async () => {
  return await _seedInitialData();
};

export const seedSampleNotifications = async (userId) => {
  return await _seedSampleNotifications({ userId });
};

export const voteOnProject = async (projectId, userId, voteType) => {
  return await _voteOnProject({ projectId, userId, voteType });
};

export const createSession = async (userId, token, expiresAt) => {
  return await _createSession({ userId, token, expiresAt });
};

export const getSessionByToken = async (token) => {
  return await _getSessionByToken({ token });
};

export const deleteSession = async (token) => {
  return await _deleteSession({ token });
};

export const deleteExpiredSessions = async () => {
  return await _deleteExpiredSessions();
};

export const inviteCollaborator = async (portfolioId, inviteeEmail, role = 'editor', message = '') => {
  return await _inviteCollaborator({ portfolioId, inviteeEmail, role, message });
};

export const getPortfolioInvitations = async (portfolioId) => {
  return await _getPortfolioInvitations({ portfolioId });
};

export const getUserInvitations = async (userEmail) => {
  return await _getUserInvitations({ userEmail });
};

export const respondToInvitation = async (invitationId, status) => {
  return await _respondToInvitation({ invitationId, status });
};

export const getPortfolioCollaborators = async (portfolioId) => {
  return await _getPortfolioCollaborators({ portfolioId });
};

export const removeCollaborator = async (portfolioId, userId) => {
  return await _removeCollaborator({ portfolioId, userId });
};

export const updateCollaboratorRole = async (portfolioId, userId, role) => {
  return await _updateCollaboratorRole({ portfolioId, userId, role });
};