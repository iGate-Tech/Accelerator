import { supabase, fromSupabase, insertIntoSupabase, updateInSupabase, deleteFromSupabase, selectFromSupabase, getCurrentUser } from './supabase';
import { getPg, updateEntity } from './db';
import { v4 as uuidv4 } from 'uuid';

// Sync status constants
export const SYNC_STATUS = {
  LOCAL: 'local',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  DELETED: 'deleted'
};

// Tables to sync
const SYNC_TABLES = ['projects', 'tasks', 'groups', 'project_groups', 'credits', 'billing'];

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.lastSyncTime = null;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.performSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async performSync() {
    if (!this.isOnline || this.syncInProgress) return;

    // Refresh session to ensure valid token
    try {
      console.log('Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.log('Session refresh error:', error);
      } else {
        console.log('Session refreshed successfully');
      }
    } catch (error) {
      console.log('Session refresh failed:', error);
    }

    // Check if user is authenticated
    const user = await getCurrentUser();
    console.log('Sync check user:', user);
    if (!user) {
      console.log('Sync skipped: User not authenticated');
      return;
    }

    this.syncInProgress = true;
    console.log('Starting sync...');

    try {
      for (const table of SYNC_TABLES) {
        await this.syncTable(table);
      }

      this.lastSyncTime = new Date();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncTable(tableName) {
    console.log(`Syncing table: ${tableName}`);

    // Get local changes (modified after last sync)
    const localChanges = await this.getLocalChanges(tableName);

    // Get remote changes
    const remoteChanges = await this.getRemoteChanges(tableName);

    // Resolve conflicts and apply changes
    await this.applyChanges(tableName, localChanges, remoteChanges);
  }

  async getLocalChanges(tableName) {
    const pg = await getPg();
    const query = `
      SELECT * FROM ${tableName}
      WHERE last_modified > synced_at OR sync_status = '${SYNC_STATUS.LOCAL}'
    `;
    const res = await pg.query(query);
    return res.rows;
  }

  async getRemoteChanges(tableName) {
    const user = await getCurrentUser();
    if (!user) return [];

    // Get changes from Supabase since last sync
    const lastSync = this.lastSyncTime || new Date(0);
    const allChanges = await selectFromSupabase(tableName, {
      gt: { last_modified: lastSync.toISOString() }
    });

    // Filter by user_id client-side to avoid query issues
    return allChanges.filter(item => item.user_id === user.id);
  }

  async applyChanges(tableName, localChanges, remoteChanges) {
    // Upload local changes to remote
    for (const localItem of localChanges) {
      await this.uploadToRemote(tableName, localItem);
    }

    // Download remote changes to local
    for (const remoteItem of remoteChanges) {
      await this.downloadToLocal(tableName, remoteItem);
    }
  }

  async uploadToRemote(tableName, localItem) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const remoteData = { ...localItem, user_id: user.id };
      delete remoteData.sync_status; // Remove local fields
      delete remoteData.synced_at; // Remove local fields
      delete remoteData.last_modified; // Remove local fields

      if (localItem.sync_status === SYNC_STATUS.DELETED) {
        await deleteFromSupabase(tableName, localItem.id);
      } else if (localItem.id) {
        await updateInSupabase(tableName, localItem.id, remoteData);
      } else {
        const result = await insertIntoSupabase(tableName, remoteData);
        // Update local with remote ID if it was generated
        if (result && result[0] && result[0].id !== localItem.id) {
          await updateEntity(tableName, 'id', localItem.id, { id: result[0].id });
        }
      }

      // Mark as synced
      await updateEntity(tableName, 'id', localItem.id, {
        synced_at: new Date(),
        sync_status: SYNC_STATUS.SYNCED
      });

    } catch (error) {
      console.error(`Failed to upload ${tableName} item ${localItem.id}:`, error);
      // Mark as conflict
      await updateEntity(tableName, 'id', localItem.id, {
        sync_status: SYNC_STATUS.CONFLICT
      });
    }
  }

  async downloadToLocal(tableName, remoteItem) {
    try {
      const localItem = await this.getLocalItem(tableName, remoteItem.id);

      if (!localItem) {
        // Insert new item
        const localData = { ...remoteItem };
        delete localData.synced_at; // Remove remote fields
        delete localData.last_modified; // Remove remote fields
        localData.sync_status = SYNC_STATUS.SYNCED;
        await this.insertLocalItem(tableName, localData);
      } else {
        // Update existing item
        const merged = await this.resolveConflict(localItem, remoteItem);
        const updateData = { ...merged };
        delete updateData.sync_status; // Remove to avoid conflicts
        delete updateData.synced_at; // Remove remote fields
        delete updateData.last_modified; // Remove remote fields

        await updateEntity(tableName, 'id', localItem.id, {
          ...updateData,
          synced_at: new Date(),
          sync_status: SYNC_STATUS.SYNCED
        });
      }
    } catch (error) {
      console.error(`Failed to download ${tableName} item ${remoteItem.id}:`, error);
    }
  }

  async getLocalItem(tableName, id) {
    const pg = await getPg();
    const res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    return res.rows[0];
  }

  async insertLocalItem(tableName, data) {
    const pg = await getPg();
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`);

    const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    await pg.query(query, values);
  }

  async resolveConflict(localItem, remoteItem) {
    // Last-write-wins strategy
    const localTime = new Date(localItem.last_modified);
    const remoteTime = new Date(remoteItem.last_modified);

    if (localTime > remoteTime) {
      return localItem;
    } else {
      return remoteItem;
    }
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
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime
    };
  }
}

// Create singleton instance
export const syncService = new SyncService();

// Export convenience functions
export const performSync = () => syncService.performSync();
export const forceSync = () => syncService.forceSync();
export const getSyncStatus = () => syncService.getSyncStatus();