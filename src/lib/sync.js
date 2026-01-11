import { supabase, fromSupabase, insertIntoSupabase, updateInSupabase, deleteFromSupabase, selectFromSupabase, getCurrentUser } from './supabase';
import { createSignal } from "solid-js";
import { getPg, updateEntity } from './db';

// Sync status constants
export const SYNC_STATUS = {
  LOCAL: 'local',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  DELETED: 'deleted'
};

// Generate UUID for local IDs
function generateUUID() {
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
    if (!this.isOnline || syncInProgress()) return;

    // Check if user is authenticated
    const user = await getCurrentUser();
    console.log('Sync check user:', user);
    if (!user) {
      console.log('Sync skipped: User not authenticated');
      return;
    }

    setSyncInProgress(true);
    console.log('Starting sync...');

    try {
      // Sync tables sequentially to respect foreign key dependencies
      for (const { name: table, idField } of SYNC_TABLES) {
        await this.syncTable(table, idField);
      }

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncInProgress(false);
    }
  }

  debouncedSync() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, 5000); // Debounce sync by 5 seconds
  }

  async syncTable(tableName, idField) {
    console.log(`Syncing table: ${tableName}`);

    // Always get local changes
    const localChanges = await this.getLocalChanges(tableName);

    // Always get remote changes (rely on RLS for filtering)
    const remoteChanges = await this.getRemoteChanges(tableName);

    // Resolve conflicts and apply changes
    await this.applyChanges(tableName, idField, localChanges, remoteChanges);

    // Update last sync time for this table
    this.lastSyncTime[tableName] = new Date();
  }

  async getLocalChanges(tableName) {
    const pg = await getPg();
    return await pg.getLocalChanges(tableName);
  }

  async getRemoteChanges(tableName) {
    // Get changes from Supabase since last sync for this table
    const lastSync = this.lastSyncTime[tableName] || new Date(0);
    const changes = await selectFromSupabase(tableName, {
      gt: { last_modified: lastSync.toISOString() }
    });

    // RLS handles user filtering, no client-side filtering needed
    return changes;
  }

  async applyChanges(tableName, idField, localChanges, remoteChanges) {
    // Upload local changes to remote
    for (const localItem of localChanges) {
      await this.uploadToRemote(tableName, idField, localItem);
    }

    // Download remote changes to local
    for (const remoteItem of remoteChanges) {
      await this.downloadToLocal(tableName, idField, remoteItem);
    }
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
          await updateInSupabase(tableName, this.getItemId(localItem, idField), { deleted_at: localItem.deleted_at, version: remoteData.version }, idField);
        } else if (this.getItemId(localItem, idField)) {
          await updateInSupabase(tableName, this.getItemId(localItem, idField), remoteData, idField);
        } else {
          const result = await insertIntoSupabase(tableName, remoteData);
          // Local IDs are already UUIDs, no remapping needed
        }

        // Mark as synced and increment version
        const pg = await getPg();
        await pg.markItemSynced(tableName, idField, this.getItemId(localItem, idField), (localItem.version || 0) + 1);
        return;

      } catch (error) {
        console.warn(`Upload attempt ${attempt + 1} failed for ${tableName} item:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        } else {
          // Mark as conflict with error details
          const pg = await getPg();
          await pg.markItemConflict(tableName, idField, this.getItemId(localItem, idField), error.message, retryCount + 1);
        }
      }
    }
  }

  async downloadToLocal(tableName, idField, remoteItem) {
    try {
      const pg = await getPg();
      const remoteId = this.getItemId(remoteItem, idField);
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
      console.error(`Failed to download ${tableName} item:`, error);
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
      return idField.map(field => item[field]);
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