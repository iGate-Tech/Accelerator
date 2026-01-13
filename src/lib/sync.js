import { supabase, fromSupabase, insertIntoSupabase, updateInSupabase, deleteFromSupabase, selectFromSupabase, getCurrentUser } from './supabase';
import { createSignal } from "solid-js";
import { getPg, updateEntity } from './db';
import logger from './logger.js';


// Sync status constants
export const SYNC_STATUS = {
  LOCAL: 'local',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  DELETED: 'deleted'
};

// Generate UUID for local IDs
function generateUUID() {
  logger.trace('generateUUID: Starting');
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Tables to sync in dependency order (parents before children)
const SYNC_TABLES = [
  { name: 'projects', idField: 'id' },
  { name: 'groups', idField: 'id' },
  { name: 'tasks', idField: 'id' }, // depends on projects
  { name: 'project_groups', idField: ['project_id', 'group_id'] }, // depends on projects, groups
  { name: 'credits', idField: 'id' },
  { name: 'billing', idField: 'id' },
  // { name: 'user_activities', idField: 'id' }, // Temporarily disabled until Supabase schema is updated
  { name: 'notifications', idField: 'id' },
  { name: 'profiles', idField: 'user_id' }
];

// Reactive sync status
export const [syncInProgress, setSyncInProgress] = createSignal(false);

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.lastSyncTime = {}; // Per-table last sync time
    this.syncTimeout = null;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.debouncedSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = null;
      }
    });
  }

  async performSync() {
    logger.debug('Sync: performSync called, isOnline:', this.isOnline, 'syncInProgress:', syncInProgress());
    if (!this.isOnline || syncInProgress()) {
      logger.debug('Sync: skipping sync - offline or already in progress');
      return;
    }

    // Check if user is authenticated
    logger.debug('Sync: checking user authentication');
    const user = await getCurrentUser();
    logger.debug('Sync: current user:', user);
    if (!user) {
      logger.debug('Sync: skipped - user not authenticated');
      return;
    }

    setSyncInProgress(true);
    logger.debug('Sync: starting sync process');

    try {
      // Sync tables sequentially to respect foreign key dependencies
      for (const { name: table, idField } of SYNC_TABLES) {
        logger.debug('Sync: syncing table:', table);
        await this.syncTable(table, idField);
      }

      logger.debug('Sync: sync completed successfully');
    } catch (error) {
      logger.error('Sync: sync failed:', error);
    } finally {
      logger.debug('Sync: setting syncInProgress to false');
      setSyncInProgress(false);
    }
  }

  debouncedSync() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, 1000); // Debounce sync by 1 second
    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, 5000); // Debounce sync by 5 seconds
  }

  async syncTable(tableName, idField) {
    logger.info(`Sync: Starting sync for table: ${tableName}, idField:`, idField);

    // Always get local changes
    logger.debug(`Sync: Getting local changes for ${tableName}`);
    const localChanges = await this.getLocalChanges(tableName);
    logger.debug(`Sync: Found ${localChanges.length} local changes for ${tableName}`);

    // Always get remote changes (rely on RLS for filtering)
    logger.debug(`Sync: Getting remote changes for ${tableName}`);
    const remoteChanges = await this.getRemoteChanges(tableName);
    logger.debug(`Sync: Found ${remoteChanges.length} remote changes for ${tableName}`);

    // Resolve conflicts and apply changes
    logger.debug(`Sync: Applying changes for ${tableName}`);
    await this.applyChanges(tableName, idField, localChanges, remoteChanges);

    // Update last sync time for this table
    this.lastSyncTime[tableName] = new Date();
    logger.info(`Sync: Completed sync for table ${tableName}`);
  }

  async getLocalChanges(tableName) {
    logger.trace(`Sync: getLocalChanges starting for ${tableName}`);
    const pg = await getPg();
    const changes = await pg.getLocalChanges(tableName);
    logger.info(`Sync: Found ${changes.length} local changes for ${tableName}`);
    return changes;
  }

  async getRemoteChanges(tableName) {
    logger.trace(`Sync: getRemoteChanges starting for ${tableName}`);
    // Get changes from Supabase since last sync for this table
    const lastSync = this.lastSyncTime[tableName] || new Date(0);
    logger.debug(`Sync: Fetching remote changes for ${tableName} since ${lastSync.toISOString()}`);
    const changes = await selectFromSupabase(tableName, {
      gt: { last_modified: lastSync.toISOString() }
    });
    logger.debug(`Sync: getRemoteChanges completed for ${tableName}, returned ${changes.length} changes`);
    // RLS handles user filtering, no client-side filtering needed
    return changes;
  }

  async applyChanges(tableName, idField, localChanges, remoteChanges) {
    logger.debug(`Sync: applyChanges starting for ${tableName}, local: ${localChanges.length}, remote: ${remoteChanges.length}`);

    // Upload local changes to remote
    logger.debug(`Sync: Uploading ${localChanges.length} local changes to remote for ${tableName}`);
    for (const localItem of localChanges) {
      await this.uploadToRemote(tableName, idField, localItem);
    }

    // Download remote changes to local
    logger.debug(`Sync: Downloading ${remoteChanges.length} remote changes to local for ${tableName}`);
    for (const remoteItem of remoteChanges) {
      await this.downloadToLocal(tableName, idField, remoteItem);
    }

    logger.debug(`Sync: applyChanges completed for ${tableName}`);
  }

  async uploadToRemote(tableName, idField, localItem) {
    const maxRetries = 3;
    let retryCount = localItem.retry_count || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const remoteData = { ...localItem };
        delete remoteData.sync_status; // Remove local fields
        delete remoteData.synced_at; // Remove local fields
        // Keep last_modified for conflict resolution

        if (localItem.deleted_at) {
          // Soft delete: set deleted_at on remote
          await updateInSupabase(tableName, String(this.getItemId(localItem, idField) || ''), { deleted_at: localItem.deleted_at, version: remoteData.version }, idField);
        } else if (this.getItemId(localItem, idField)) {
          await updateInSupabase(tableName, String(this.getItemId(localItem, idField) || ''), remoteData, idField);
        } else {
          await insertIntoSupabase(tableName, remoteData);
          // Local IDs are already UUIDs, no remapping needed
        }

        // Mark as synced and increment version
        const pg = await getPg();
        await pg.markItemSynced(tableName, idField, String(this.getItemId(localItem, idField) || ''), (localItem.version || 0) + 1);
        return;

      } catch (error) {
        logger.warn(`Upload attempt ${attempt + 1} failed for ${tableName} item:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        } else {
          // Mark as conflict with error details
          const pg = await getPg();
          await pg.markItemConflict(tableName, idField, String(this.getItemId(localItem, idField) || ''), error.message, retryCount + 1);
        }
      }
    }
  }

  async downloadToLocal(tableName, idField, remoteItem) {
    try {
      const pg = await getPg();
      const remoteId = String(this.getItemId(remoteItem, idField) || '');
      const localItem = await pg.getLocalItem(tableName, remoteId, idField);

      if (remoteItem.deleted_at && localItem) {
        // Remote item is soft deleted, remove locally
        await pg.deleteLocalItem(tableName, idField, remoteId);
      } else if (!localItem) {
        // Insert new item
        const localData = { ...remoteItem };
        delete localData.synced_at; // Remove remote fields
        delete localData.last_modified; // Remove remote fields
        localData.sync_status = SYNC_STATUS.SYNCED;
        await pg.insertLocalItem(tableName, localData);
      } else {
        // Update existing item
        const merged = await pg.resolveConflict(localItem, remoteItem);
        const updateData = { ...merged };
        delete updateData.sync_status; // Remove to avoid conflicts
        delete updateData.synced_at; // Remove remote fields
        delete updateData.last_modified; // Remove remote fields

        await pg.updateEntity(tableName, idField, remoteId, {
          ...updateData,
          synced_at: new Date(),
          sync_status: SYNC_STATUS.SYNCED
        }, { noTrigger: true });
      }
    } catch (error) {
      logger.error(`Failed to download ${tableName} item:`, error);
    }
  }

  async getLocalItem(tableName, id, idField) {
    const pg = await getPg();
    return await pg.getLocalItem(tableName, id, idField);
  }

  async insertLocalItem(tableName, data) {
    const pg = await getPg();
    return await pg.insertLocalItem(tableName, data);
  }

  async resolveConflict(localItem, remoteItem) {
    const pg = await getPg();
    return await pg.resolveConflict(localItem, remoteItem);
  }

  // Manual sync trigger
  async forceSync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await this.performSync();
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: syncInProgress(),
      lastSyncTime: this.lastSyncTime
    };
  }

  // Helper to get item ID (handles composite keys)
  getItemId(item, idField) {
    if (Array.isArray(idField)) {
      return idField.map(field => item[field]).join(':');
    }
    return item[idField] || item.id;
  }

  // Delete local item
  async deleteLocalItem(tableName, idField, id) {
    const pg = await getPg();
    await pg.deleteLocalItem(tableName, idField, id);
  }
}

// Create singleton instance
export const syncService = new SyncService();

// Export convenience functions
export const performSync = () => syncService.performSync();
export const forceSync = () => syncService.forceSync();
export const getSyncStatus = () => syncService.getSyncStatus();