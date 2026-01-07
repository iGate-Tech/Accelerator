import { PGlite } from '@electric-sql/pglite';

let dbPromise;

const getDb = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = new PGlite({ dataDir: 'idb://accelerator-db-v3' });
       await db.exec(`
         CREATE TABLE IF NOT EXISTS tasks (
           id SERIAL PRIMARY KEY,
           project_id INTEGER,
           content TEXT,
           timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           model TEXT,
           prompt TEXT
         );
       `);
      await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          type TEXT,
          content TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await db.exec(`
        CREATE TABLE IF NOT EXISTS portfolio (
          id SERIAL PRIMARY KEY,
          title TEXT,
          description TEXT
        );
      `);
       await db.exec(`
         CREATE TABLE IF NOT EXISTS settings (
           id SERIAL PRIMARY KEY,
           key TEXT UNIQUE,
           value TEXT
         );
       `);
       await db.exec(`
         CREATE TABLE IF NOT EXISTS projects (
           id SERIAL PRIMARY KEY,
           name TEXT,
           createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         );
       `);
      console.log('Database initialized lazily');
      return db;
    })();
  }
  return dbPromise;
};

export const initDb = async () => {
  await getDb();
};

 export const getTasks = async (project_id = null) => {
   console.log('getTasks called with project_id:', project_id);
   try {
     const db = await getDb();
     let query = 'SELECT * FROM tasks';
     let params = [];
     if (project_id) {
       query += ' WHERE project_id = $1';
       params = [project_id];
     }
     query += ' ORDER BY timestamp DESC';
     const res = await db.query(query, params);
     console.log('Query executed, res:', res);
     console.log('Tasks loaded:', res.rows);
     return res.rows;
   } catch (e) {
     console.log('DB error in getTasks:', e);
     return [];
   }
 };

 export const addTask = async (task, project_id) => {
   try {
     const db = await getDb();
     await db.query('INSERT INTO tasks (content, model, prompt, project_id) VALUES ($1, $2, $3, $4)', [task.content, task.model, task.prompt, project_id]);
     console.log('Task added:', task, 'for project:', project_id);
   } catch (e) {
     console.log('DB error in addTask:', e);
   }
 };

export const getMessages = async () => {
  try {
    const db = await getDb();
    const res = await db.query('SELECT * FROM messages ORDER BY timestamp ASC');
    return res.rows;
  } catch (e) {
    return [];
  }
};

export const addMessage = async (message) => {
  try {
    const db = await getDb();
    await db.query('INSERT INTO messages (type, content) VALUES ($1, $2)', [message.type, message.content]);
  } catch (e) {
    console.log('DB not ready, skipping addMessage');
  }
};

export const clearAllTasks = async () => {
  try {
    const db = await getDb();
    await db.query('DELETE FROM tasks');
  } catch (e) {
    console.log('DB not ready, skipping clearAllTasks');
  }
};

export const clearAllMessages = async () => {
  try {
    const db = await getDb();
    await db.query('DELETE FROM messages');
  } catch (e) {
    console.log('DB not ready, skipping clearAllMessages');
  }
};

export const updateTask = async (id, content) => {
  try {
    const db = await getDb();
    await db.query('UPDATE tasks SET content = $1 WHERE id = $2', [content, id]);
  } catch (e) {
    console.log('DB not ready, skipping updateTask');
  }
};

export const getPortfolio = async () => {
  try {
    const db = await getDb();
    const res = await db.query('SELECT * FROM portfolio');
    return res.rows;
  } catch (e) {
    return [];
  }
};

export const addPortfolioItem = async (item) => {
  try {
    const db = await getDb();
    await db.query('INSERT INTO portfolio (title, description) VALUES ($1, $2)', [item.title, item.description]);
  } catch (e) {
    console.log('DB not ready, skipping addPortfolioItem');
  }
};

export const getSetting = async (key) => {
  try {
    const db = await getDb();
    const res = await db.query('SELECT value FROM settings WHERE key = $1', [key]);
    return res.rows.length > 0 ? res.rows[0].value : null;
  } catch (e) {
    return null;
  }
};

export const setSetting = async (key, value) => {
  try {
    const db = await getDb();
    await db.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, value]);
  } catch (e) {
    console.log('Failed to save setting');
  }
};

export const saveProgress = async (progress) => {
  await setSetting('progress', JSON.stringify(progress));
};

export const loadProgress = async () => {
  const data = await getSetting('progress');
  return data ? JSON.parse(data) : null;
};

 export const getProjects = async () => {
   try {
     const db = await getDb();
     const res = await db.query('SELECT * FROM projects ORDER BY createdAt DESC');
     console.log('Projects loaded:', res.rows);
     return res.rows;
   } catch (e) {
     console.log('DB error in getProjects:', e);
     return [];
   }
 };

 export const getProjectByName = async (name) => {
   try {
     const db = await getDb();
     const res = await db.query('SELECT * FROM projects WHERE name = $1', [name]);
     return res.rows[0];
   } catch (e) {
     console.log('DB not ready, returning null');
     return null;
   }
 };

 export const addProject = async (project) => {
   try {
     const db = await getDb();
     const res = await db.query('INSERT INTO projects (name) VALUES ($1) RETURNING id', [project.name]);
     return res.rows[0].id;
   } catch (e) {
     console.log('DB error in addProject:', e);
   }
 };

export const updateProject = async (id, project) => {
  try {
    const db = await getDb();
    await db.query('UPDATE projects SET name = $1 WHERE id = $2', [project.name, id]);
  } catch (e) {
    console.log('DB not ready, skipping updateProject');
  }
};

export const deleteProject = async (id) => {
  try {
    const db = await getDb();
    await db.query('DELETE FROM projects WHERE id = $1', [id]);
  } catch (e) {
    console.log('DB not ready, skipping deleteProject');
  }
};