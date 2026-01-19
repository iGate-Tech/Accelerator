

// Activity logging utility
import { logActivity } from './db';
import { useUser } from '../context/UserContext';
import logger from './logger.js';

class ActivityLogger {
  constructor() {
    this.user = null;
    this.queue = [];
    this.isProcessing = false;
  }

  setUser(user) {
    this.user = user;
  }

  // Log an activity
  async log(actionType, entityType = null, entityId = null, description, metadata = {}) {
    if (!this.user || !this.user.id) {
      return;
    }

    // Add to queue for batch processing
    this.queue.push({
      actionType,
      entityType,
      entityId,
      description,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });

    // Process queue
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    logger.info('Processing activity queue, items:', this.queue.length);

    while (this.queue.length > 0) {
      const activity = this.queue.shift();
      try {
        await logActivity(
          this.user.id,
          activity.actionType,
          activity.entityType,
          activity.entityId,
          activity.description,
          activity.metadata
        );
        logger.debug('Activity logged:', activity.actionType, activity.description);
      } catch (error) {
        logger.error('Failed to log activity:', error);
        // Re-queue failed activities (simple retry)
        if (this.queue.length < 10) { // Prevent infinite loops
          this.queue.unshift(activity);
          break;
        }
      }
    }

    this.isProcessing = false;
    logger.info('Activity queue processing completed');
  }

  // Convenience methods for common activities
  async logAuth(action, details = {}) {
    await this.log(`auth_${action}`, null, null, `User ${action}`, details);
  }

  async logProject(action, projectId, projectName, details = {}) {
    await this.log(`project_${action}`, 'project', projectId, `Project "${projectName}" ${action}`, details);
  }

  async logTask(action, taskId, taskContent, projectId, details = {}) {
    const truncatedContent = taskContent ? taskContent.substring(0, 100) + (taskContent.length > 100 ? '...' : '') : '';
    await this.log(`task_${action}`, 'task', taskId, `Task ${action}: "${truncatedContent}"`, { ...details, projectId });
  }

  async logCredit(action, amount, details = {}) {
    await this.log(`credit_${action}`, 'credit', null, `Credits ${action}: ${amount}`, { ...details, amount });
  }

  async logAI(action, projectId, stepName, details = {}) {
    await this.log(`ai_${action}`, 'project', projectId, `AI ${action}: ${stepName}`, details);
  }

  async logSecurity(event, details = {}) {
    await this.log(`security_${event}`, 'security', null, `Security event: ${event}`, details);
  }

  async logData(action, dataType, details = {}) {
    await this.log(`data_${action}`, dataType, null, `Data ${action}: ${dataType}`, details);
  }

  async logProfile(action, details = {}) {
    await this.log(`profile_${action}`, 'profile', this.user.id, `Profile ${action}`, details);
  }

  async logPageVisit(page, details = {}) {
    await this.log('page_visit', 'page', page, `Visited ${page} page`, details);
  }

  async logValidation(event, field, details = {}) {
    await this.log(`validation_${event}`, 'validation', field, `Validation ${event} for ${field}`, details);
  }

  async logError(event, error, details = {}) {
    const errorMessage = error.message || error.toString();
    const truncatedError = errorMessage.substring(0, 200) + (errorMessage.length > 200 ? '...' : '');
    await this.log(`error_${event}`, 'error', null, `Error ${event}: ${truncatedError}`, { ...details, errorType: error.name });
  }
}

// Create singleton instance
export const activityLogger = new ActivityLogger();

// Hook to use activity logger with current user
export const useActivityLogger = () => {
  const { user } = useUser();

  // Update logger with current user
  activityLogger.setUser(user());

  return activityLogger;
};