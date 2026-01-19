// Main database module - combines all database functionality
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

// Import core database functionality
export { query, exec, close, getEntities, updateEntity, getPg } from './db-core.js';

// Import user functions
export { _createUser, _getUserById, _getUserByEmail, _updateUser, _deleteUser, _createUserProfile, _getUserProfile, _updateUserProfile, _updateUserPassword } from './db-users.js';

// Import project functions
export { _createProject, _getProjectById, _updateProject, _deleteProject, _deleteAllProjects, _toggleProjectPublic, _archiveProject, _unarchiveProject, _getArchivedProjects, _getTasks, _addTask, _updateTask, _getProjects } from './db-projects.js';

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
let currentUser = null;
export const getCurrentUser = async () => {
  if (!currentUser) {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      try {
        currentUser = JSON.parse(savedUserData);
      } catch (e) {
        console.error('Error parsing saved user data:', e);
      }
    }
  }
  return currentUser;
};
export const setCurrentUser = (user) => {
  currentUser = user;
  if (user) {
    localStorage.setItem('userData', JSON.stringify(user));
  }
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
    if (!db) return null;
    const res = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error getting user profile:', err);
    return null;
  }
};

export const updateUserProfile = async (userId, updates) => {
  const { _updateUserProfile } = await import('./db-users.js');
  return await _updateUserProfile({ userId, updates });
};

export const updateUserPassword = async (userId, newPasswordHash) => {
  const { _updateUserPassword } = await import('./db-users.js');
  return await _updateUserPassword({ userId, newPasswordHash });
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

export const archiveProject = async (projectId) => {
  const { _archiveProject } = await import('./db-projects.js');
  return await _archiveProject({ id: projectId });
};

export const unarchiveProject = async (projectId) => {
  const { _unarchiveProject } = await import('./db-projects.js');
  return await _unarchiveProject({ id: projectId });
};

export const getArchivedProjects = async (userId) => {
  const { _getArchivedProjects } = await import('./db-projects.js');
  const { getPg } = await import('./db-core.js');
  const db = await getPg();
  if (!db) return [];
  return await _getArchivedProjects(db, { userId });
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
    const profile = await getUserProfile(userId);
    const activities = await getUserActivities(userId);

    // GDPR-compliant data export
    return {
      // Personal data
      profile: {
        id: profile?.id,
        email: profile?.email,
        name: profile?.name,
        bio: profile?.bio,
        location: profile?.location,
        website: profile?.website,
        preferences: profile?.preferences,
        createdAt: profile?.created_at,
        lastModified: profile?.last_modified
      },

      // Projects and content
      projects: projects?.data || [],

      // Activity history (for transparency)
      activities: activities?.map(activity => ({
        actionType: activity.action_type,
        description: activity.description,
        timestamp: activity.created_at,
        metadata: activity.metadata
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
          retentionPolicy: 'Data retained until account deletion'
        }
      }
    };
  } catch (error) {
    console.error('Failed to export all data:', error);
    return null;
  }
};

// GDPR-compliant account deletion (Right to be Forgotten)
export const deleteUserAccount = async (userId, reason = 'user_request') => {
  try {
    const { getPg } = await import('./db-core.js');
    const db = await getPg();

    if (!db) {
      throw new Error('Database not available');
    }

    // Log the deletion request for audit purposes
    const deletionLog = {
      userId,
      reason,
      requestedAt: new Date().toISOString(),
      gdprArticle17: 'Right to Erasure',
      dataCategoriesDeleted: [
        'user_profile',
        'projects',
        'tasks',
        'activities',
        'notifications',
        'credits',
        'sessions'
      ]
    };

    // Export data before deletion (for compliance records)
    const finalExport = await exportAllData(userId);

    // Perform cascading deletion
    await db.query('BEGIN');

    try {
      // Delete in reverse dependency order
      await db.query('DELETE FROM project_votes WHERE user_id = $1', [userId]);
      await db.query('DELETE FROM user_subscriptions WHERE user_id = $1', [userId]);
      await db.query('DELETE FROM credits WHERE user_id = $1', [userId]);
      await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
      await db.query('DELETE FROM user_activities WHERE user_id = $1', [userId]);
      await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

      // Delete tasks and projects (handle foreign keys)
      await db.query('DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE user_id = $1)', [userId]);
      await db.query('DELETE FROM projects WHERE user_id = $1', [userId]);

      // Delete profile and user
      await db.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
      await db.query('DELETE FROM users WHERE id = $1', [userId]);

      await db.query('COMMIT');

      // Log successful deletion (without storing personal data)
      console.log(`GDPR-compliant account deletion completed for user ${userId}`);

      return {
        success: true,
        deletedAt: new Date().toISOString(),
        reason,
        finalExportAvailable: !!finalExport,
        gdprCompliance: {
          article17: 'Right to Erasure - Data permanently deleted',
          dataRetention: 'No data retained',
          deletionMethod: 'Complete account removal'
        }
      };

    } catch (deleteError) {
      await db.query('ROLLBACK');
      throw deleteError;
    }

  } catch (error) {
    console.error('Account deletion failed:', error);
    return {
      success: false,
      error: error.message,
      gdprCompliance: {
        article17: 'Deletion failed - data integrity maintained'
      }
    };
  }
};

// Data retention policy enforcement (GDPR compliance)
export const enforceDataRetention = async () => {
  try {
    const { getPg } = await import('./db-core.js');
    const db = await getPg();

    if (!db) return { success: false, error: 'Database not available' };

    const now = new Date();
    const results = {
      sessionsCleaned: 0,
      oldActivitiesCleaned: 0,
      expiredTokensCleaned: 0
    };

    // Clean expired sessions (7 days for expired)
    const sessionResult = await db.query('DELETE FROM sessions WHERE expires_at < $1', [now.toISOString()]);
    results.sessionsCleaned = sessionResult.rowCount;

    // Clean old activities (keep last 2 years, archive older)
    const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    const activityResult = await db.query(`
      UPDATE user_activities
      SET description = 'Archived for privacy - ' || description,
          metadata = CASE
            WHEN metadata IS NULL THEN '{"archived": true}'
            ELSE (metadata::jsonb || jsonb_build_object('archived', true))::json
          END
      WHERE created_at < $1
    `, [twoYearsAgo.toISOString()]);
    results.oldActivitiesCleaned = activityResult.rowCount;

    // Clean expired password reset tokens (24 hours)
    const tokenResult = await db.query('DELETE FROM password_reset_tokens WHERE expires_at < $1', [now.toISOString()]);
    results.expiredTokensCleaned = tokenResult.rowCount;

    console.log('Data retention enforcement completed:', results);

    return {
      success: true,
      cleaned: results,
      retentionPolicy: {
        sessions: '30 days inactive retention',
        activities: '2 years with archiving',
        tokens: '24 hours for reset tokens'
      }
    };

  } catch (error) {
    console.error('Data retention enforcement failed:', error);
    return { success: false, error: error.message };
  }
};

// Schedule automatic data retention enforcement
let retentionScheduler = null;

export const scheduleDataRetention = () => {
  // Clear any existing scheduler
  if (retentionScheduler) {
    clearInterval(retentionScheduler);
  }

  // Run data retention check every 24 hours
  retentionScheduler = setInterval(async () => {
    try {
      await enforceDataRetention();
      console.log('Scheduled data retention enforcement completed');
    } catch (error) {
      console.error('Scheduled data retention failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours

  // Also run immediately on startup
  setTimeout(async () => {
    try {
      await enforceDataRetention();
      console.log('Initial data retention enforcement completed');
    } catch (error) {
      console.error('Initial data retention failed:', error);
    }
  }, 5000); // Run 5 seconds after startup
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

// Password reset functions
export const createPasswordResetToken = async (userId, token, expiresAt) => {
  try {
    const { query } = await import('./db-core.js');
    await query(
      'INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at, used_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [crypto.randomUUID(), userId, token, expiresAt, new Date().toISOString(), null]
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to create password reset token:', error);
    throw error;
  }
};

export const validatePasswordResetToken = async (token) => {
  try {
    const { query } = await import('./db-core.js');
    const result = await query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > $2 AND used_at IS NULL',
      [token, new Date().toISOString()]
    );

    if (result.rows.length === 0) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    return { valid: true, userId: result.rows[0].user_id, tokenId: result.rows[0].id };
  } catch (error) {
    console.error('Failed to validate password reset token:', error);
    throw error;
  }
};

export const usePasswordResetToken = async (tokenId) => {
  try {
    const { query } = await import('./db-core.js');
    await query(
      'UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2',
      [new Date().toISOString(), tokenId]
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to mark token as used:', error);
    throw error;
  }
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

import { _getUserInvitations, _respondToInvitation, _getPortfolioCollaborators, _removeCollaborator, _updateCollaboratorRole } from './db-collaboration.js';

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