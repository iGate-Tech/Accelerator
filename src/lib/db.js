import { PGliteWorker } from '@electric-sql/pglite/worker';

let pgInstance = null;

export const getPg = async () => {
  if (!pgInstance) {
    console.log('Creating PGLiteWorker instance');
    pgInstance = new PGliteWorker(
      new Worker(new URL('../workers/pglite-worker.js', import.meta.url), {
        type: 'module',
      }),
      {
        dataDir: 'idb://accelerator-db-v6',
      }
    );
    console.log('PGLiteWorker instance created');
  }
  return pgInstance;
};

export const initDb = async () => {
  // Worker initializes automatically
};

  export const getTasks = async (project_id = null) => {
    console.log('getTasks called with project_id:', project_id);
    try {
      const pg = await getPg();
      let query = 'SELECT * FROM tasks';
      let params = [];
      if (project_id) {
        query += ' WHERE project_id = $1';
        params = [project_id];
      }
      query += ' ORDER BY timestamp DESC';
      const res = await pg.query(query, params);
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
      const pg = await getPg();
      await pg.query('INSERT INTO tasks (content, model, llm_model, section, stepName, prompt, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7)', [task.content, task.model, task.llm_model, task.section, task.stepName, task.prompt, project_id]);
      console.log('Task added:', task, 'for project:', project_id);
    } catch (e) {
      console.log('DB error in addTask:', e);
    }
  };

export const clearAllTasks = async () => {
  try {
    const pg = await getPg();
    await pg.query('DELETE FROM tasks');
  } catch (e) {
    console.log('DB not ready, skipping clearAllTasks');
  }
};

export const updateTask = async (id, content) => {
  try {
    const pg = await getPg();
    await pg.query('UPDATE tasks SET content = $1 WHERE id = $2', [content, id]);
  } catch (e) {
    console.log('DB not ready, skipping updateTask');
  }
};





  export const getProjects = async () => {
    try {
      const pg = await getPg();
      const res = await pg.query('SELECT * FROM Projects ORDER BY createdAt DESC');
      console.log('Projects loaded:', res.rows);
      return res.rows;
    } catch (e) {
      console.log('Error loading projects:', e);
      return [];
    }
  };

 export const getProjectByName = async (name) => {
    try {
      const pg = await getPg();
      const res = await pg.query('SELECT * FROM Projects WHERE name = $1', [name]);
      return res.rows[0];
    } catch (e) {
      console.log('DB not ready, returning null');
      return null;
    }
  };

  export const getProjectById = async (id) => {
    try {
      const pg = await getPg();
      const res = await pg.query('SELECT * FROM Projects WHERE id = $1', [id]);
      return res.rows[0];
    } catch (e) {
      console.log('DB not ready, returning null');
      return null;
    }
  };

  export const addProject = async (project) => {
    try {
      const pg = await getPg();
       const defaultTotalSteps = 51;
       const totalSteps = project.totalSteps || defaultTotalSteps;
       const completedSteps = project.completedSteps || 0;
       const res = await pg.query('INSERT INTO Projects (name, description, currentStep, completedSteps, stepName, currentModel, currentSection, uiProgress, uiMessage, uiStatus, totalCredits, consumedCredits, totalTime, consumedTime, totalSteps, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *', [
         project.name,
         project.description,
         project.currentStep || 'system',
         completedSteps,
         project.stepName || 'System Initialization',
         project.currentModel || 'System',
         project.currentSection || 'Initialization',
         project.uiProgress || 0,
         project.uiMessage || 'Ready to start the 48-step accelerator process',
         project.uiStatus || 'idle',
         project.totalCredits || (totalSteps * 10),
         completedSteps * 10,
         totalSteps * 30,
         completedSteps * 30,
         totalSteps,
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
    console.log('Updating project', id, 'with fields:', Object.keys(project));
    try {
      const pg = await getPg();
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
         // Auto-calculate consumed credits and time based on completed steps
         fields.push(`consumedCredits = $${paramIndex++}`);
         values.push(project.completedSteps * 10);
         fields.push(`consumedTime = $${paramIndex++}`);
         values.push(project.completedSteps * 30);
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
       if (project.totalCredits !== undefined) {
         fields.push(`totalCredits = $${paramIndex++}`);
         values.push(project.totalCredits);
       }
       if (project.consumedCredits !== undefined) {
         fields.push(`consumedCredits = $${paramIndex++}`);
         values.push(project.consumedCredits);
       }
       if (project.totalTime !== undefined) {
         fields.push(`totalTime = $${paramIndex++}`);
         values.push(project.totalTime);
       }
       if (project.consumedTime !== undefined) {
         fields.push(`consumedTime = $${paramIndex++}`);
         values.push(project.consumedTime);
       }
       if (project.totalSteps !== undefined) {
         fields.push(`totalSteps = $${paramIndex++}`);
         values.push(project.totalSteps);
         // Recalculate totalCredits and totalTime when totalSteps changes
         fields.push(`totalCredits = $${paramIndex++}`);
         values.push(project.totalSteps * 10);
         fields.push(`totalTime = $${paramIndex++}`);
         values.push(project.totalSteps * 30);
       }

       if (fields.length > 0) {
        const query = `UPDATE Projects SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
        values.push(id);
        await pg.query(query, values);
        console.log('Updated project:', id, 'with query:', query, 'values:', values);
      }
    } catch (e) {
      console.log('Error updating project:', e);
    }
  };

 export const deleteProject = async (id) => {
    try {
      const pg = await getPg();
      await pg.query('DELETE FROM Projects WHERE id = $1', [id]);
      console.log('Deleted project:', id);
    } catch (e) {
      console.log('Error deleting project:', e);
    }
  };

 export const deleteAllProjects = async () => {
    try {
      const pg = await getPg();
      await pg.query('DELETE FROM Projects');
      console.log('Deleted all projects');
    } catch (e) {
      console.log('Error deleting all projects:', e);
    }
  };

// Groups functions
export const getGroups = async () => {
  try {
    const pg = await getPg();
    const res = await pg.query('SELECT * FROM Groups ORDER BY createdAt DESC');
    console.log('Groups loaded:', res.rows);
    return res.rows;
  } catch (e) {
    console.log('Error loading groups:', e);
    return [];
  }
};

export const getGroupById = async (id) => {
  try {
    const pg = await getPg();
    const res = await pg.query('SELECT * FROM Groups WHERE id = $1', [id]);
    return res.rows[0];
  } catch (e) {
    console.log('Error loading group:', e);
    return null;
  }
};

export const addGroup = async (group) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'INSERT INTO Groups (name, description, color, createdAt) VALUES ($1, $2, $3, $4) RETURNING id',
      [group.name, group.description || '', group.color || '#6366f1', group.createdAt || new Date()]
    );
    const newGroup = res.rows[0];
    console.log('Added group:', newGroup);
    return newGroup.id;
  } catch (e) {
    console.log('Error adding group:', e);
  }
};

export const updateGroup = async (id, group) => {
  try {
    const pg = await getPg();
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (group.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(group.name);
    }
    if (group.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(group.description);
    }
    if (group.color !== undefined) {
      fields.push(`color = $${paramIndex++}`);
      values.push(group.color);
    }

    if (fields.length > 0) {
      const query = `UPDATE Groups SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
      values.push(id);
      await pg.query(query, values);
      console.log('Updated group:', id);
    }
  } catch (e) {
    console.log('Error updating group:', e);
  }
};

export const deleteGroup = async (id) => {
  try {
    const pg = await getPg();
    // First remove all project-group relationships
    await pg.query('DELETE FROM ProjectGroups WHERE group_id = $1', [id]);
    // Then delete the group
    await pg.query('DELETE FROM Groups WHERE id = $1', [id]);
    console.log('Deleted group:', id);
  } catch (e) {
    console.log('Error deleting group:', e);
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

export const addProjectToGroup = async (projectId, groupId) => {
  try {
    const pg = await getPg();
    await pg.query(
      'INSERT INTO ProjectGroups (project_id, group_id, addedAt) VALUES ($1, $2, $3) ON CONFLICT (project_id, group_id) DO NOTHING',
      [projectId, groupId, new Date()]
    );
    console.log('Added project', projectId, 'to group', groupId);
  } catch (e) {
    console.log('Error adding project to group:', e);
  }
};

export const removeProjectFromGroup = async (projectId, groupId) => {
  try {
    const pg = await getPg();
    await pg.query('DELETE FROM ProjectGroups WHERE project_id = $1 AND group_id = $2', [projectId, groupId]);
    console.log('Removed project', projectId, 'from group', groupId);
  } catch (e) {
    console.log('Error removing project from group:', e);
  }
};

export const getProjectsInGroup = async (groupId) => {
  try {
    const pg = await getPg();
    const res = await pg.query(`
      SELECT p.*, pg.addedAt as addedToGroupAt
      FROM Projects p
      JOIN ProjectGroups pg ON p.id = pg.project_id
      WHERE pg.group_id = $1
      ORDER BY pg.addedAt DESC
    `, [groupId]);
    return res.rows;
  } catch (e) {
    console.log('Error getting projects in group:', e);
    return [];
  }
};

export const getUngroupedProjects = async () => {
  try {
    const pg = await getPg();
    const res = await pg.query(`
      SELECT * FROM Projects
      WHERE id NOT IN (SELECT project_id FROM ProjectGroups)
      ORDER BY createdAt DESC
    `);
    return res.rows;
  } catch (e) {
    console.log('Error getting ungrouped projects:', e);
    return [];
  }
};

export const getGroupsWithProjects = async () => {
  try {
    const groups = await getGroups();
    const groupsWithProjects = await Promise.all(
      groups.map(async (group) => ({
        ...group,
        projects: await getProjectsInGroup(group.id)
      }))
    );
    return groupsWithProjects;
  } catch (e) {
    console.log('Error getting groups with projects:', e);
    return [];
  }
};