// Activity logging utility
import { logActivity } from './db';
import { useUser } from '../context/UserContext';

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
      console.warn('Cannot log activity: User not set');
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
      } catch (error) {
        console.error('Failed to log activity:', error);
        // Re-queue failed activities (simple retry)
        if (this.queue.length < 10) { // Prevent infinite loops
          this.queue.unshift(activity);
          break;
        }
      }
    }

    this.isProcessing = false;
  }

  // Convenience methods for common activities
  async logAuth(action, details = {}) {
    await this.log(`auth_${action}`, null, null, `User ${action}`, details);
  }

  async logProject(action, projectId, projectName, details = {}) {
    await this.log(`project_${action}`, 'project', projectId, `Project "${projectName}" ${action}`, details);
  }

  async logCredit(action, amount, details = {}) {
    await this.log(`credit_${action}`, 'credit', null, `Credits ${action}: ${amount}`, { ...details, amount });
  }

  async logAI(action, projectId, stepName, details = {}) {
    await this.log(`ai_${action}`, 'project', projectId, `AI ${action}: ${stepName}`, details);
  }

  async logProfile(action, details = {}) {
    await this.log(`profile_${action}`, 'profile', this.user.id, `Profile ${action}`, details);
  }

  async logPageVisit(page, details = {}) {
    await this.log('page_visit', 'page', page, `Visited ${page} page`, details);
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