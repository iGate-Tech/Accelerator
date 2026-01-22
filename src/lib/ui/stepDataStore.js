import { createStore } from 'solid-js/store';

async function getDb() {
  const { getPg } = await import('../database/core.js');
  return await getDbWithSchema();
}

async function getDbWithSchema() {
  const { getPg, initDatabase } = await import('../database/core.js');
  try {
    const db = await getPg();
    if (!db) {
      await initDatabase();
      return await getPg();
    }
    return db;
  } catch (e) {
    console.warn('Failed to get database:', e);
    try {
      await initDatabase();
      return await getPg();
    } catch (initError) {
      console.warn('Failed to initialize database:', initError);
      return null;
    }
  }
}

async function ensureTableExists(db) {
  if (!db) return false;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS step_data (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value JSONB,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, key)
      )
    `);
    return true;
  } catch (e) {
    console.warn('Failed to ensure step_data table exists:', e);
    return false;
  }
}

async function loadFromStorage(projectId) {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('loadFromStorage: No database available');
      return {};
    }
    
    const tableExists = await ensureTableExists(db);
    if (!tableExists) {
      console.warn('loadFromStorage: Table does not exist');
      return {};
    }
    
    const result = await db.query(
      'SELECT key, value FROM step_data WHERE project_id = $1 ORDER BY updated_at DESC',
      [projectId]
    );
    const data = {};
    for (const row of result.rows) {
      try {
        data[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      } catch (parseError) {
        data[row.key] = row.value;
      }
    }
    console.log('loadFromStorage: Loaded', Object.keys(data).length, 'items for project', projectId, '- keys:', Object.keys(data));
    return data;
  } catch (e) {
    console.warn('Failed to load step data from PGLite:', e);
    return {};
  }
}

async function saveToStorage(data, projectId) {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('saveToStorage: No database available');
      return;
    }
    
    const tableExists = await ensureTableExists(db);
    if (!tableExists) {
      console.warn('step_data table does not exist, skipping save');
      return;
    }
    
    await db.query('DELETE FROM step_data WHERE project_id = $1', [projectId]);
    const now = new Date().toISOString();
    
    for (const [key, value] of Object.entries(data)) {
      const jsonValue = JSON.stringify(value);
      const id = `${projectId}_${key}`;
      await db.query(
        'INSERT INTO step_data (id, project_id, key, value, updated_at) VALUES ($1, $2, $3, $4, $5)',
        [id, projectId, key, jsonValue, now]
      );
    }
    console.log('saveToStorage: Saved', Object.keys(data).length, 'items for project', projectId);
  } catch (e) {
    console.warn('Failed to save step data to PGLite:', e);
  }
}

// Deep merge function for nested objects
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

const stores = new Map();

async function getStore(projectId) {
  if (!stores.has(projectId)) {
    const initialData = await loadFromStorage(projectId);
    const [store, setStore] = createStore(initialData);
    stores.set(projectId, { store, setStore });
  }
  return stores.get(projectId);
}

async function updateStepData(projectId, newData) {
  console.log('updateStepData: Called with projectId:', projectId, 'data:', newData);
  const { store, setStore } = await getStore(projectId);
  
  // Preserve the original problem statement if it exists and newData doesn't have it
  const existingProblem = store?.problem;
  const dataWithProblem = { ...newData };
  
  if (existingProblem && !dataWithProblem.problem) {
    console.log('updateStepData: Preserving existing problem statement');
    dataWithProblem.problem = existingProblem;
  }
  
  // Also preserve originalProblem if it exists
  if (store?.originalProblem && !dataWithProblem.originalProblem) {
    console.log('updateStepData: Preserving original problem statement');
    dataWithProblem.originalProblem = store.originalProblem;
  }
  
  setStore(prev => {
    const merged = deepMerge(prev, dataWithProblem);
    console.log('updateStepData: Merged result:', merged);
    saveToStorage(merged, projectId);
    return merged;
  });
}

async function resetStepData(projectId) {
  const { setStore } = await getStore(projectId);
  setStore({});
  await saveToStorage({}, projectId);
}

async function getStepData(projectId) {
  const { store } = await getStore(projectId);
  console.log('getStepData: Returning store for project', projectId, ':', store);
  return store;
}

export { getStepData, updateStepData, resetStepData };