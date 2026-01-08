import { PGliteWorker } from '@electric-sql/pglite/worker';
import { toastManager } from './feedback';

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

    // Seed initial data after database is ready
    await seedInitialData();
  }
  return pgInstance;
};

export const initDb = async () => {
  // Worker initializes automatically
  await seedInitialData();
};

// Generic helper for SELECT operations
export const getEntities = async (table, selectFields = '*', whereClause = '', orderBy = '', params = []) => {
  const pg = await getPg();
  const query = `SELECT ${selectFields} FROM ${table} ${whereClause} ${orderBy}`;
  try {
    const res = await pg.query(query, params);
    return res.rows;
  } catch (error) {
    console.log(`DB error in getEntities for ${table}: ${error.message}`);
    return [];
  }
};

// Generic helper for UPDATE operations
export const updateEntity = async (table, idField, id, updates, options = {}) => {
  const pg = await getPg();
  const fields = [];
  const values = [];
  let paramIndex = 1;

  // Handle special fields or calculations if provided
  if (options.beforeUpdate) {
    options.beforeUpdate(updates);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const dbField = options.fieldMappings?.[key] || key;
      fields.push(`${dbField} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  // Add always-update fields
  if (options.alwaysUpdate) {
    for (const [field, value] of Object.entries(options.alwaysUpdate)) {
      fields.push(`${field} = ${value}`);
    }
  }

  if (fields.length === 0) {
    console.log(`No fields to update for ${table} with id ${id}`);
    return { success: false, error: 'No fields to update' };
  }

  values.push(id);
  const query = `UPDATE ${table} SET ${fields.join(', ')} WHERE ${idField} = $${paramIndex}`;

  try {
    const res = await pg.query(query, values);
    console.log(`Updated ${table}:`, id, 'with query:', query, 'values:', values);
    return { success: true, data: res.rows[0] };
  } catch (error) {
    console.log(`DB error in updateEntity for ${table}: ${error.message}`);
    return { success: false, error: error.message };
  }
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
    const projects = await getEntities('Projects', '*', '', 'ORDER BY createdAt DESC');
    console.log('Projects loaded:', projects);
    return projects;
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
       toastManager.error(`Failed to add project "${project.name}" (${project.description?.length || 0} chars description): ${e.message}`);
     }
  };

  export const updateProject = async (id, project) => {
  console.log('Updating project', id, 'with fields:', Object.keys(project));
  try {
    // Handle special calculations
    const processedProject = { ...project };
    if (project.completedSteps !== undefined) {
      processedProject.consumedCredits = project.completedSteps * 10;
      processedProject.consumedTime = project.completedSteps * 30;
    }
    if (project.totalSteps !== undefined) {
      processedProject.totalCredits = project.totalSteps * 10;
      processedProject.totalTime = project.totalSteps * 30;
    }

    const result = await updateEntity('Projects', 'id', id, processedProject);
    if (!result.success) {
      throw new Error(result.error);
    }
    console.log('Updated project:', id);
   } catch (e) {
     console.log('Error updating project:', e);
     toastManager.error(`Failed to update project ${id} (${Object.keys(project).length} fields): ${e.message}`);
   }
};

 export const deleteProject = async (id) => {
    try {
      const pg = await getPg();
      await pg.query('DELETE FROM Projects WHERE id = $1', [id]);
      console.log('Deleted project:', id);
     } catch (e) {
       console.log('Error deleting project:', e);
       toastManager.error(`Failed to delete project ${id}: ${e.message}`);
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
  const groups = await getEntities('Groups', '*', '', 'ORDER BY createdAt DESC');
  console.log('Groups loaded:', groups);
  return groups;
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
     toastManager.error(`Failed to add group "${group.name}": ${e.message}`);
   }
};

export const updateGroup = async (id, group) => {
  try {
    const result = await updateEntity('Groups', 'id', id, group);
    if (!result.success) {
      throw new Error(result.error);
    }
    console.log('Updated group:', id);
   } catch (e) {
     console.log('Error updating group:', e);
     toastManager.error(`Failed to update group ${id} (${Object.keys(group).length} fields): ${e.message}`);
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
     toastManager.error(`Failed to delete group ${id}: ${e.message}`);
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

// User functions
export const createUser = async (email, passwordHash, profile = {}) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'INSERT INTO users (email, password_hash, profile) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, JSON.stringify(profile)]
    );
    console.log('User created:', res.rows[0]);
    return res.rows[0];
  } catch (e) {
    console.log('Error creating user:', e);
    throw e;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const pg = await getPg();
    const res = await pg.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  } catch (e) {
    console.log('Error getting user by email:', e);
    return null;
  }
};

export const getUserById = async (id) => {
  try {
    const pg = await getPg();
    const res = await pg.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
  } catch (e) {
    console.log('Error getting user by id:', e);
    return null;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const processedUpdates = { ...updates };
    if (updates.profile !== undefined) {
      processedUpdates.profile = JSON.stringify(updates.profile);
    }
    const result = await updateEntity('users', 'id', id, processedUpdates, {
      alwaysUpdate: { 'updated_at': 'CURRENT_TIMESTAMP' }
    });
    if (!result.success) {
      throw new Error(result.error);
    }
    console.log('Updated user:', id);
  } catch (e) {
    console.log('Error updating user:', e);
    throw e;
  }
};

export const deleteUser = async (id) => {
  try {
    const pg = await getPg();
    await pg.query('DELETE FROM users WHERE id = $1', [id]);
    console.log('Deleted user:', id);
  } catch (e) {
    console.log('Error deleting user:', e);
    throw e;
  }
};

// Session functions
export const createSession = async (userId, token, expiresAt) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [userId, token, expiresAt]
    );
    console.log('Session created:', res.rows[0]);
    return res.rows[0];
  } catch (e) {
    console.log('Error creating session:', e);
    throw e;
  }
};

export const getSessionByToken = async (token) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT s.*, u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP',
      [token]
    );
    return res.rows[0];
  } catch (e) {
    console.log('Error getting session by token:', e);
    return null;
  }
};

export const deleteSession = async (token) => {
  try {
    const pg = await getPg();
    await pg.query('DELETE FROM sessions WHERE token = $1', [token]);
    console.log('Deleted session:', token);
  } catch (e) {
    console.log('Error deleting session:', e);
  }
};

export const deleteExpiredSessions = async () => {
  try {
    const pg = await getPg();
    await pg.query('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
    console.log('Deleted expired sessions');
  } catch (e) {
    console.log('Error deleting expired sessions:', e);
  }
};

// Credits functions
export const addCreditTransaction = async (userId, type, amount, description) => {
  try {
    const pg = await getPg();
    // Get current balance
    const balanceRes = await pg.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE user_id = $1',
      [userId]
    );
    const currentBalance = balanceRes.rows[0].balance;
    const newBalance = currentBalance + amount;

    const res = await pg.query(
      'INSERT INTO credits (user_id, type, amount, description, balance_after) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, type, amount, description, newBalance]
    );
    console.log('Credit transaction added:', res.rows[0]);
    return res.rows[0];
  } catch (e) {
    console.log('Error adding credit transaction:', e);
    throw e;
  }
};

export const getUserCredits = async (userId) => {
  return await getEntities('credits', '*', 'WHERE user_id = $1', 'ORDER BY date DESC', [userId]);
};

export const getUserCreditBalance = async (userId) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE user_id = $1',
      [userId]
    );
    return res.rows[0].balance;
  } catch (e) {
    console.log('Error getting user credit balance:', e);
    return 0;
  }
};

// Billing functions
export const addBillingRecord = async (userId, type, amount, description, dueDate = null) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'INSERT INTO billing (user_id, type, amount, description, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, type, amount, description, dueDate]
    );
    console.log('Billing record added:', res.rows[0]);
    return res.rows[0];
  } catch (e) {
    console.log('Error adding billing record:', e);
    throw e;
  }
};

export const getUserBilling = async (userId) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT * FROM billing WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    return res.rows;
  } catch (e) {
    console.log('Error getting user billing:', e);
    return [];
  }
};

export const updateBillingStatus = async (id, status) => {
  try {
    const pg = await getPg();
    await pg.query('UPDATE billing SET status = $1 WHERE id = $2', [status, id]);
    console.log('Updated billing status:', id, status);
  } catch (e) {
    console.log('Error updating billing status:', e);
  }
};

// Seeding function for initial data
export const seedInitialData = async () => {
  try {
    const pg = await getPg();

    // Check if users table is empty
    const userCount = await pg.query('SELECT COUNT(*) as count FROM users');
    if (userCount.rows[0].count > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding initial data...');

    // Create a sample user
    const sampleProfile = {
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: "/src/assets/avatar.png",
      joinDate: new Date().toISOString().split('T')[0],
      bio: "Entrepreneur and startup enthusiast"
    };

    const user = await createUser('john.doe@example.com', 'password', sampleProfile);

    // Add sample credit transactions
    await addCreditTransaction(user.id, 'purchase', 500, 'Initial credit purchase');
    await addCreditTransaction(user.id, 'usage', -50, 'AI Accelerator Session - Project Analysis');

    // Add sample billing record
    await addBillingRecord(user.id, 'invoice', 29.99, 'Pro Plan Monthly Subscription', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    console.log('Initial data seeded successfully');
  } catch (e) {
    console.log('Error seeding data:', e);
  }
};

// Offline sync - placeholder for future Supabase sync
export const syncData = async () => {
  // For now, just clean up expired sessions
  await deleteExpiredSessions();
  console.log('Data sync completed');
};