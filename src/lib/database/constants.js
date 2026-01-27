// src/lib/database/constants.js
// Unified database configuration - single source of truth for all database settings

export const DATABASE_CONFIG = {
  // Single definitive database name (used by all modules)
  name: 'accelerator-db-v23',

  // Schema version for migration tracking
  schemaVersion: 1,

  // Pglite configuration
  pglite: {
    // Use relaxedDurability for better performance with IndexedDB
    relaxedDurability: true,
    // Operation timeout to prevent hangs
    timeout: 30000,
    // Max concurrent operations (1 for deterministic behavior)
    maxConcurrent: 1,
    // Enable WAL mode for better crash recovery
    wal: true,
    // Additional recommended settings for browser environments
    debug: 0  // Set to 1-5 for debugging if needed
  },

  // Storage limits
  storage: {
    // Max localStorage usage (4MB - safe for all browsers)
    maxLocalStorageBytes: 4 * 1024 * 1024,
    // Max individual item size (2MB)
    maxItemBytes: 2 * 1024 * 1024,
    // IndexedDB quota buffer (keep 10% free)
    quotaBufferPercent: 10
  },

  // Initialization settings
  init: {
    // Max initialization time before timeout
    timeoutMs: 30000,
    // Number of retry attempts on failure
    maxRetries: 3,
    // Delay between retries (ms)
    retryDelayMs: 1000
  }
};

// Derived constants for convenience
export const MEMORY_URL = 'memory://';

// Schema tables (single source of truth for expected tables)
export const SCHEMA_TABLES = [
  'db_version',
  'users',
  'profiles',
  'projects',
  'tasks',
  'step_data',
  'groups',
  'project_groups',
  'credits',
  'billing',
  'notifications',
  'sessions',
  'packages',
  'user_subscriptions',
  'portfolio_collaborators',
  'portfolio_invitations',
  'user_activities',
  'project_votes',
  'password_reset_tokens'
];

// Sensitive keys that should be encrypted in localStorage
export const SENSITIVE_STORAGE_KEYS = [
  'userToken',
  'userData',
  'accelerator_backup_'
];

export default DATABASE_CONFIG;
