import { PGlite } from '@electric-sql/pglite';

let dbPromise;

const getDb = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
       const db = new PGlite({ dataDir: 'idb://accelerator-db-v4' });
      await db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
             id SERIAL PRIMARY KEY,
             project_id BIGINT,
             content TEXT,
             timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             model TEXT,
             llm_model TEXT,
             section TEXT,
             stepName TEXT,
             prompt TEXT
           );
      `);
           await db.exec(`
            CREATE TABLE IF NOT EXISTS Projects (
              id BIGSERIAL PRIMARY KEY,
              name TEXT,
              description TEXT,
              currentStep TEXT,
              completedSteps INTEGER,
              stepName TEXT,
              currentModel TEXT,
              currentSection TEXT,
              uiProgress REAL,
              uiMessage TEXT,
              uiStatus TEXT,
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
      await db.query('INSERT INTO tasks (content, model, llm_model, section, stepName, prompt, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7)', [task.content, task.model, task.llm_model, task.section, task.stepName, task.prompt, project_id]);
      console.log('Task added:', task, 'for project:', project_id);
    } catch (e) {
      console.log('DB error in addTask:', e);
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

export const updateTask = async (id, content) => {
  try {
    const db = await getDb();
    await db.query('UPDATE tasks SET content = $1 WHERE id = $2', [content, id]);
  } catch (e) {
    console.log('DB not ready, skipping updateTask');
  }
};





  export const getProjects = async () => {
    try {
      const db = await getDb();
      const res = await db.query('SELECT * FROM Projects ORDER BY createdAt DESC');
      console.log('Projects loaded:', res.rows);
      return res.rows;
    } catch (e) {
      console.log('Error loading projects:', e);
      return [];
    }
  };

 export const getProjectByName = async (name) => {
    try {
      const db = await getDb();
      const res = await db.query('SELECT * FROM Projects WHERE name = $1', [name]);
      return res.rows[0];
    } catch (e) {
      console.log('DB not ready, returning null');
      return null;
    }
  };

  export const getProjectById = async (id) => {
    try {
      const db = await getDb();
      const res = await db.query('SELECT * FROM Projects WHERE id = $1', [id]);
      return res.rows[0];
    } catch (e) {
      console.log('DB not ready, returning null');
      return null;
    }
  };

  export const addProject = async (project) => {
    try {
      const db = await getDb();
      const res = await db.query('INSERT INTO Projects (name, description, currentStep, completedSteps, stepName, currentModel, currentSection, uiProgress, uiMessage, uiStatus, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id', [
        project.name,
        project.description,
        project.currentStep || 'system',
        project.completedSteps || 0,
        project.stepName || 'System Initialization',
        project.currentModel || 'System',
        project.currentSection || 'Initialization',
        project.uiProgress || 0,
        project.uiMessage || 'Ready to start the 48-step accelerator process',
        project.uiStatus || 'idle',
        project.createdAt || new Date()
      ]);
      const newProject = res.rows[0];
      console.log('Added project:', newProject);
      return newProject.id;
    } catch (e) {
      console.log('Error adding project:', e);
    }
  };

 export const updateProject = async (id, project) => {
    try {
      const db = await getDb();
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (project.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(project.name);
      }
      if (project.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(project.description);
      }
      if (project.currentStep !== undefined) {
        fields.push(`currentStep = $${paramIndex++}`);
        values.push(project.currentStep);
      }
      if (project.completedSteps !== undefined) {
        fields.push(`completedSteps = $${paramIndex++}`);
        values.push(project.completedSteps);
      }
      if (project.stepName !== undefined) {
        fields.push(`stepName = $${paramIndex++}`);
        values.push(project.stepName);
      }
      if (project.currentModel !== undefined) {
        fields.push(`currentModel = $${paramIndex++}`);
        values.push(project.currentModel);
      }
      if (project.currentSection !== undefined) {
        fields.push(`currentSection = $${paramIndex++}`);
        values.push(project.currentSection);
      }
      if (project.uiProgress !== undefined) {
        fields.push(`uiProgress = $${paramIndex++}`);
        values.push(project.uiProgress);
      }
      if (project.uiMessage !== undefined) {
        fields.push(`uiMessage = $${paramIndex++}`);
        values.push(project.uiMessage);
      }
      if (project.uiStatus !== undefined) {
        fields.push(`uiStatus = $${paramIndex++}`);
        values.push(project.uiStatus);
      }

      if (fields.length > 0) {
        const query = `UPDATE Projects SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
        values.push(id);
        await db.query(query, values);
        console.log('Updated project:', id);
      }
    } catch (e) {
      console.log('Error updating project:', e);
    }
  };

 export const deleteProject = async (id) => {
   try {
     const db = await getDb();
     await db.query('DELETE FROM Projects WHERE id = $1', [id]);
     console.log('Deleted project:', id);
   } catch (e) {
     console.log('Error deleting project:', e);
   }
 };

 export const deleteAllProjects = async () => {
   try {
     const db = await getDb();
     await db.query('DELETE FROM Projects');
     console.log('Deleted all projects');
   } catch (e) {
     console.log('Error deleting all projects:', e);
   }
 };

export const exportAllProjects = async () => {
  try {
    const projects = await getProjects();
    return JSON.stringify(projects, null, 2);
  } catch (e) {
    return null;
  }
};