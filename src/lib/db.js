import { PGliteWorker } from '@electric-sql/pglite/worker';
import { toastManager } from './feedback';
import { performSync, syncService } from './sync';
import { getCurrentUser } from './supabase';
import { v4 as uuidv4 } from 'uuid';

let pgInstance = null;

export const getPg = async () => {
  if (!pgInstance) {
    console.log('Creating PGLiteWorker instance');
    pgInstance = new PGliteWorker(
      new Worker(new URL('../workers/pglite-worker.js', import.meta.url), {
        type: 'module'
      }),
      { dataDir: 'idb://accelerator-db-v19' }
    );
    console.log('PGLiteWorker instance created');

    // Seed initial data after database is ready
    await seedInitialData();
  }
  return pgInstance;
};

export const triggerSync = () => {
  // Temporarily disabled sync due to schema mismatch with Supabase
  // syncService.debouncedSync();
};

export const initDb = async () => {
  // Worker initializes automatically
  await seedInitialData();
};

// Generic helper for SELECT operations
export const getEntities = async (table, selectFields = '*', whereClause = '', orderBy = '', params = []) => {
  try {
    const pg = await getPg();
    const query = `SELECT ${selectFields} FROM ${table} ${whereClause} ${orderBy}`;
    const res = await pg.query(query, params);
    return res.rows;
  } catch (error) {
    console.log(`DB error in getEntities for ${table}: ${error.message}`);
    return [];
  }
};

// Generic helper for UPDATE operations
export const updateEntity = async (table, idField, id, updates, options = { noTrigger: false }) => {
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

  // Always update sync fields
  if (!updates.last_modified) {
    fields.push(`last_modified = CURRENT_TIMESTAMP`);
  }
  if (!updates.sync_status) {
    fields.push(`sync_status = 'local'`);
  }

  if (fields.length === 0) {
    console.log(`No fields to update for ${table} with id ${id}`);
    return { success: false, error: 'No fields to update' };
  }

  // Add always-update fields (skip if already in updates)
  if (options.alwaysUpdate) {
    for (const [field, value] of Object.entries(options.alwaysUpdate)) {
      if (!updates.hasOwnProperty(field)) {
        fields.push(`${field} = ${value}`);
      }
    }
  }

  values.push(id);
  const query = `UPDATE ${table} SET ${fields.join(', ')} WHERE ${idField} = $${paramIndex}`;

    try {
     const res = await pg.query(query, values);
     console.log(`Updated ${table}:`, id, 'with query:', query, 'values:', values);
     if (!options.noTrigger) {
       triggerSync();
     }
     return { success: true, data: res.rows[0] };
     } catch (error) {
       console.log(`DB error in updateEntity for ${table}: ${error.message}`);
       return { success: false, error: error.message };
     }
};

  export const getTasks = async (project_id = null, userId = null) => {
    console.log('getTasks called with project_id:', project_id, 'userId:', userId);
    try {
      const pg = await getPg();
      let query = 'SELECT * FROM tasks';
      let params = [];
      let conditions = [];

      if (project_id) {
        conditions.push('project_id = $' + (params.length + 1));
        params.push(project_id);
      }

      if (userId) {
        conditions.push('user_id = $' + (params.length + 1));
        params.push(userId);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
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
       await pg.query('INSERT INTO tasks (content, model, llm_model, section, stepName, prompt, project_id, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, \'local\')', [task.content, task.model, task.llm_model, task.section, task.stepName, task.prompt, project_id]);
       console.log('Task added:', task, 'for project:', project_id);
       triggerSync();
     } catch (e) {
       console.log('DB error in addTask:', e);
     }
  };

export const clearAllTasks = async () => {
   try {
     const pg = await getPg();
     await pg.query('DELETE FROM tasks');
     triggerSync();
   } catch (e) {
     console.log('DB not ready, skipping clearAllTasks');
   }
};

export const updateTask = async (id, content) => {
   try {
     const pg = await getPg();
     await pg.query('UPDATE tasks SET content = $1 WHERE id = $2', [content, id]);
     triggerSync();
   } catch (e) {
     console.log('DB not ready, skipping updateTask');
   }
};





    export const getProjects = async (userId = null) => {
      if (!userId) {
        const { getCurrentUser } = await import('./supabase');
        const user = await getCurrentUser();
        userId = user ? user.id : null;
      }
      const whereClause = userId ? 'WHERE user_id = $1' : '';
      const params = userId ? [userId] : [];
      const projects = await getEntities('projects', '*', whereClause, 'ORDER BY createdAt DESC', params);
      console.log('Projects loaded:', projects);
      return projects;
    };

    export const getPublicProjects = async () => {
      const projects = await getEntities('projects', '*', 'WHERE public = true', 'ORDER BY createdAt DESC');
      console.log('Public projects loaded:', projects);
      return projects;
    };

   export const getPublicProjectsWithVotes = async (currentUserId) => {
     try {
       const pg = await getPg();
        const res = await pg.query(`
          SELECT
            p.*,
            COALESCE(v.user_vote, null) as user_vote,
            COALESCE(vs.upvotes, 0) as upvotes,
            COALESCE(vs.downvotes, 0) as downvotes
          FROM projects p
         LEFT JOIN (
           SELECT project_id,
                  vote_type as user_vote
           FROM project_votes
           WHERE user_id = $1
         ) v ON p.id = v.project_id
         LEFT JOIN (
           SELECT project_id,
                  COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
                  COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes
           FROM project_votes
           GROUP BY project_id
         ) vs ON p.id = vs.project_id
         WHERE p.public = true
         ORDER BY (COALESCE(vs.upvotes, 0) - COALESCE(vs.downvotes, 0)) DESC, p.createdAt DESC
       `, [currentUserId]);
       console.log('Public projects with votes loaded:', res.rows);
       return res.rows;
     } catch (e) {
       console.log('Error getting public projects with votes:', e);
       return [];
     }
   };

   export const getProjectByName = async (name) => {
     try {
       const pg = await getPg();
       const res = await pg.query('SELECT * FROM projects WHERE name = $1', [name]);
       return res.rows[0];
     } catch (e) {
       console.log('DB not ready, returning null');
       return null;
     }
   };

   export const getProjectById = async (id) => {
     try {
       const pg = await getPg();
       const res = await pg.query('SELECT * FROM projects WHERE id = $1', [id]);
       return res.rows[0];
     } catch (e) {
       console.log('DB not ready, returning null');
       return null;
     }
   };

  export const addProject = async (project) => {
    try {
      const pg = await getPg();
      const { getCurrentUser } = await import('./supabase');
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');
       const defaultTotalSteps = 51;
       const totalSteps = project.totalSteps || defaultTotalSteps;
       const completedSteps = project.completedSteps || 0;
          const res = await pg.query('INSERT INTO projects (user_id, name, description, currentStep, completedSteps, stepName, currentModel, currentSection, uiProgress, uiMessage, uiStatus, totalCredits, consumedCredits, totalTime, consumedTime, totalSteps, createdAt, public, problem, solution, currentPrompt, llmResponse, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, \'local\') RETURNING *', [
            user.id,
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
           project.createdAt || new Date(),
           project.public || false,
           project.problem || '',
           project.solution || '',
           project.currentPrompt || '',
           project.llmResponse || ''
         ]);
       const newProject = res.rows[0];
       console.log('Added project:', newProject);
       triggerSync();
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
        await pg.query('DELETE FROM projects WHERE id = $1', [id]);
       console.log('Deleted project:', id);
       triggerSync();
      } catch (e) {
        console.log('Error deleting project:', e);
        toastManager.error(`Failed to delete project ${id}: ${e.message}`);
      }
  };

  export const deleteAllProjects = async () => {
     try {
       const pg = await getPg();
        await pg.query('DELETE FROM projects');
       console.log('Deleted all projects');
     } catch (e) {
       console.log('Error deleting all projects:', e);
     }
   };

   export const toggleProjectPublic = async (projectId, isPublic) => {
     try {
       const result = await updateEntity('Projects', 'id', projectId, { public: isPublic });
       if (!result.success) {
         throw new Error(result.error);
       }
       console.log(`Project ${projectId} set to ${isPublic ? 'public' : 'private'}`);
       return result;
     } catch (e) {
       console.log('Error toggling project public status:', e);
       toastManager.error(`Failed to update project visibility: ${e.message}`);
       return { success: false, error: e.message };
     }
   };

   export const voteOnProject = async (projectId, userId, voteType) => {
     try {
       const pg = await getPg();

       // Check if user already voted
       const existingVote = await pg.query(
         'SELECT id, vote_type FROM project_votes WHERE project_id = $1 AND user_id = $2',
         [projectId, userId]
       );

       if (existingVote.rows.length > 0) {
         const currentVote = existingVote.rows[0];
         if (currentVote.vote_type === voteType) {
            // User is removing their vote
            await pg.query('DELETE FROM project_votes WHERE id = $1', [currentVote.id]);
            triggerSync();
            return { action: 'removed', voteType: null };
         } else {
            // User is changing their vote
            await pg.query('UPDATE project_votes SET vote_type = $1 WHERE id = $2', [voteType, currentVote.id]);
            triggerSync();
            return { action: 'changed', voteType };
         }
       } else {
          // User is adding a new vote
          await pg.query(
            'INSERT INTO project_votes (project_id, user_id, vote_type) VALUES ($1, $2, $3)',
            [projectId, userId, voteType]
          );
          triggerSync();
          return { action: 'added', voteType };
       }
     } catch (e) {
       console.log('Error voting on project:', e);
       toastManager.error(`Failed to vote on project: ${e.message}`);
       return { success: false, error: e.message };
     }
   };

   export const getProjectVotes = async (projectId) => {
     try {
       const pg = await getPg();
       const res = await pg.query(`
         SELECT vote_type, COUNT(*) as count
         FROM project_votes
         WHERE project_id = $1
         GROUP BY vote_type
       `, [projectId]);
       return res.rows;
     } catch (e) {
       console.log('Error getting project votes:', e);
       return [];
     }
   };

// Groups functions
 export const getGroups = async (userId = null) => {
   const whereClause = userId ? 'WHERE user_id = $1' : '';
   const params = userId ? [userId] : [];
   const groups = await getEntities('Groups', '*', whereClause, 'ORDER BY createdAt DESC', params);
   console.log('Groups loaded:', groups);
   return groups;
 };

export const getGroupById = async (id) => {
  try {
    const pg = await getPg();
    const res = await pg.query('SELECT * FROM groups WHERE id = $1', [id]);
    return res.rows[0];
  } catch (e) {
    console.log('Error loading group:', e);
    return null;
  }
};

export const addGroup = async (group) => {
  try {
    const pg = await getPg();
    const { getCurrentUser } = await import('./supabase');
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    const res = await pg.query(
      'INSERT INTO groups (user_id, name, description, color, createdAt) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user.id, group.name, group.description || '', group.color || '#6366f1', group.createdAt || new Date()]
    );
     const newGroup = res.rows[0];
     console.log('Added group:', newGroup);
     triggerSync();
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
    await pg.query('DELETE FROM project_groups WHERE group_id = $1', [id]);
     // Then delete the group
      await pg.query('DELETE FROM groups WHERE id = $1', [id]);
     console.log('Deleted group:', id);
     triggerSync();
   } catch (e) {
     console.log('Error deleting group:', e);
     toastManager.error(`Failed to delete group ${id}: ${e.message}`);
   }
};

export const exportAllProjects = async (userId = null) => {
  try {
    const projects = await getProjects(userId);
    return JSON.stringify(projects, null, 2);
  } catch (e) {
    return null;
  }
};

export const addProjectToGroup = async (projectId, groupId) => {
  try {
    const pg = await getPg();
     await pg.query(
       'INSERT INTO project_groups (project_id, group_id, addedAt) VALUES ($1, $2, $3) ON CONFLICT (project_id, group_id) DO NOTHING',
       [projectId, groupId, new Date()]
     );
     console.log('Added project', projectId, 'to group', groupId);
     triggerSync();
  } catch (e) {
    console.log('Error adding project to group:', e);
  }
};

export const removeProjectFromGroup = async (projectId, groupId) => {
  try {
    const pg = await getPg();
     await pg.query('DELETE FROM project_groups WHERE project_id = $1 AND group_id = $2', [projectId, groupId]);
     console.log('Removed project', projectId, 'from group', groupId);
     triggerSync();
  } catch (e) {
    console.log('Error removing project from group:', e);
  }
};

export const getProjectsInGroup = async (groupId) => {
  try {
    const pg = await getPg();
    const res = await pg.query(`
      SELECT p.*, pg.addedAt as addedToGroupAt
      FROM projects p
      JOIN project_groups pg ON p.id = pg.project_id
      WHERE pg.group_id = $1
      ORDER BY pg.addedAt DESC
    `, [groupId]);
    return res.rows;
  } catch (e) {
    console.log('Error getting projects in group:', e);
    return [];
  }
};

export const getUngroupedProjects = async (userId = null) => {
  try {
    const pg = await getPg();
    let query = `
      SELECT * FROM projects
      WHERE id NOT IN (SELECT project_id FROM project_groups)
    `;
    let params = [];

    if (userId) {
      query += ' AND user_id = $1';
      params.push(userId);
    }

    query += ' ORDER BY createdAt DESC';

    const res = await pg.query(query, params);
    return res.rows;
  } catch (e) {
    console.log('Error getting ungrouped projects:', e);
    return [];
  }
};

export const getGroupsWithProjects = async (userId = null) => {
  try {
    const groups = await getGroups(userId);
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
export const createUser = async (email, passwordHash, profile = {}, userId = null) => {
  try {
    const pg = await getPg();
    const id = userId || uuidv4();
    const res = await pg.query(
      'INSERT INTO users (id, email, password_hash, profile, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, email, passwordHash, JSON.stringify(profile), new Date(), new Date(), 'local']
     );
     console.log('User created:', res.rows[0]);
     triggerSync();
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
     triggerSync();
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
     triggerSync();
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
     triggerSync();
   } catch (e) {
     console.log('Error deleting session:', e);
   }
};

export const deleteExpiredSessions = async () => {
   try {
     const pg = await getPg();
     await pg.query('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
     console.log('Deleted expired sessions');
     triggerSync();
   } catch (e) {
     console.log('Error deleting expired sessions:', e);
   }
};

// Credits functions
export const addCreditTransaction = async (userId, type, amount, description) => {
  try {
    const pg = await getPg();
    const id = uuidv4();
    // Calculate current balance
    const balanceResult = await pg.query('SELECT SUM(amount) as balance FROM credits WHERE user_id = $1', [userId]);
    const currentBalance = balanceResult.rows[0]?.balance || 0;
    const balance_after = currentBalance + amount;

    const transaction = {
      id,
      user_id: userId,
      type,
      amount,
      description,
      balance_after,
      date: new Date().toISOString()
    };
    await pg.query(
      'INSERT INTO credits (id, user_id, type, amount, description, balance_after, date, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [id, userId, type, amount, description, transaction.balance_after, transaction.date, new Date(), new Date(), 'local']
    );
    triggerSync();
    return transaction;
  } catch (error) {
    console.error('Error adding credit transaction:', error);
    throw error;
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
    const id = uuidv4();
    const res = await pg.query(
      'INSERT INTO billing (id, user_id, type, amount, description, due_date, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, userId, type, amount, description, dueDate, new Date(), new Date(), 'local']
    );
     console.log('Billing record added:', res.rows[0]);
     triggerSync();
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

export const consumeCredits = async (userId, amount, description) => {
  try {
    // Add a consumption transaction
    await addCreditTransaction(userId, 'usage', -amount, description);
    return true;
  } catch (error) {
    console.error('Error consuming credits:', error);
    throw error;
  }
};

export const getCreditBalance = async (userId) => {
  try {
    const pg = await getPg();
    const result = await pg.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM credits WHERE user_id = $1',
      [userId]
    );
    return result.rows[0].balance || 0;
  } catch (error) {
    console.error('Error getting credit balance:', error);
    return 0;
  }
};

export const getCreditTransactions = async (userId) => {
  try {
    const pg = await getPg();
    const result = await pg.query(
      'SELECT * FROM credits WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting credit transactions:', error);
    return [];
  }
};

export const createNotification = async (userId, type, title, message, createdAt = null) => {
  try {
    const pg = await getPg();
    const id = uuidv4();
    const timestamp = createdAt || new Date().toISOString();
    const notification = {
      id,
      user_id: userId,
      type,
      title,
      message,
      read: false,
      created_at: timestamp
    };
     await pg.query(
       'INSERT INTO notifications (id, user_id, type, title, message, read, created_at, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
       [id, userId, type, title, message, false, timestamp, new Date(), new Date(), 'local']
     );
     triggerSync();
     return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
};

export const markNotificationRead = async (notificationId, userId) => {
   try {
     const pg = await getPg();
     await pg.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [notificationId, userId]);
     triggerSync();
     return true;
   } catch (error) {
     console.error('Error marking notification read:', error);
     return false;
   }
};

export const getPackages = async () => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT * FROM packages WHERE active = true ORDER BY price ASC'
    );
    return res.rows;
  } catch (error) {
    console.error('Error getting packages:', error);
    return [];
  }
};

export const getUserSubscription = async (userId) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT us.*, p.name, p.description, p.price, p.credits_included FROM user_subscriptions us JOIN packages p ON us.package_id = p.id WHERE us.user_id = $1 AND us.status = $2 ORDER BY us.start_date DESC LIMIT 1',
      [userId, 'active']
    );
    return res.rows[0] || null;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
};

export const createUserSubscription = async (userId, packageId, subscriptionData = {}) => {
  try {
    const pg = await getPg();
    const id = uuidv4();
    const startDate = subscriptionData.startDate || new Date();
    const endDate = subscriptionData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const res = await pg.query(
      'INSERT INTO user_subscriptions (id, user_id, package_id, status, start_date, end_date, auto_renew, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [id, userId, packageId, subscriptionData.status || 'active', startDate, endDate, subscriptionData.autoRenew !== false, new Date(), new Date(), 'local']
    );

    // Get package data
    const packageData = await pg.query('SELECT * FROM packages WHERE id = $1', [packageId]);
    if (packageData.rows[0]) {
      const pkg = packageData.rows[0];

      // Add initial credits for the subscription
      await addCreditTransaction(userId, 'subscription', pkg.credits_included, `Credits for ${pkg.name} subscription`);

      // Create billing record for paid subscriptions
      if (pkg.price > 0) {
        await addBillingRecord(
          userId,
          'subscription',
          pkg.price,
          `${pkg.name} subscription - ${pkg.price}/month`,
          endDate
        );
      }
    }

     console.log('User subscription created:', res.rows[0]);
     triggerSync();
     return res.rows[0];
  } catch (error) {
    console.error('Error creating user subscription:', error);
    throw error;
  }
};

export const changeUserSubscription = async (userId, newPackageId, currentSubscription = null) => {
  try {
    const pg = await getPg();

    // Cancel current subscription if it exists
    if (currentSubscription) {
      await updateEntity('user_subscriptions', 'id', currentSubscription.id, {
        status: 'cancelled',
        end_date: new Date(),
        last_modified: new Date()
      });
    }

    // Create new subscription
    const newSubscription = await createUserSubscription(userId, newPackageId);

    // Handle credit adjustments for plan changes
    if (currentSubscription) {
      const currentPackage = await pg.query('SELECT * FROM packages WHERE id = $1', [currentSubscription.package_id]);
      const newPackage = await pg.query('SELECT * FROM packages WHERE id = $1', [newPackageId]);

      if (currentPackage.rows[0] && newPackage.rows[0]) {
        const currentCredits = currentPackage.rows[0].credits_included;
        const newCredits = newPackage.rows[0].credits_included;

        // If upgrading, add the difference in credits
        if (newCredits > currentCredits) {
          const creditDifference = newCredits - currentCredits;
          await addCreditTransaction(
            userId,
            'subscription_upgrade',
            creditDifference,
            `Additional credits for upgrading to ${newPackage.rows[0].name}`
          );
        }
        // If downgrading, we could potentially remove credits, but for now let's keep them
        // In a real app, you might want to prorate or adjust credits
      }
    }

    return newSubscription;
  } catch (error) {
    console.error('Error changing user subscription:', error);
    throw error;
  }
};

export const updateUserSubscription = async (userId, subscriptionId, updates) => {
  try {
    const result = await updateEntity('user_subscriptions', 'id', subscriptionId, updates, {
      alwaysUpdate: { 'updated_at': 'CURRENT_TIMESTAMP' }
    });
    if (!result.success) {
      throw new Error(result.error);
    }
    console.log('Updated user subscription:', subscriptionId);
    return result.data;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );
    return res.rows[0] || null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const createUserProfile = async (userId, profileData = {}) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'INSERT INTO profiles (user_id, avatar, bio, preferences, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id) DO NOTHING RETURNING *',
      [
        userId,
        profileData.avatar || avatar,
        profileData.bio || '',
        JSON.stringify(profileData.preferences || {
          notifications: { email: true, browser: false, projectUpdates: true },
          privacy: { profileVisibility: 'private', dataSharing: false }
        }),
        new Date(),
        new Date(),
        'local'
      ]
    );
    if (res.rows[0]) triggerSync();
    return res.rows[0];
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateBillingStatus = async (id, status) => {
   try {
     const pg = await getPg();
     await pg.query('UPDATE billing SET status = $1 WHERE id = $2', [status, id]);
     console.log('Updated billing status:', id, status);
     triggerSync();
   } catch (e) {
     console.log('Error updating billing status:', e);
   }
};

// Seeding function for initial data
export const seedPackages = async () => {
  try {
    const pg = await getPg();

    // Check if packages table is empty
    const packageCount = await pg.query('SELECT COUNT(*) as count FROM packages');
    if (packageCount.rows[0].count > 0) {
      console.log('Packages already seeded');
      return;
    }

    console.log('Seeding packages...');

    // Production-ready packages with realistic features and pricing
    const packages = [
      {
        name: 'Free',
        description: 'Perfect for exploring our platform and testing basic features',
        price: 0,
        credits_included: 50,
        features: JSON.stringify([
          'AI-powered business plan generation',
          'Basic market analysis',
          'Financial projections',
          '3 projects maximum',
          'Community support',
          'Basic export options'
        ])
      },
      {
        name: 'Pro',
        description: 'Advanced tools for growing startups and entrepreneurs',
        price: 49.99,
        credits_included: 1000,
        features: JSON.stringify([
          'Everything in Free plan',
          'Unlimited projects',
          'Advanced market research',
          'Competitive analysis',
          'Pitch deck generation',
          'Financial modeling',
          'Priority customer support',
          'Advanced export formats',
          'API access',
          'Custom templates'
        ])
      },
      {
        name: 'Enterprise',
        description: 'Complete solution for scaling companies and teams',
        price: 199.99,
        credits_included: 5000,
        features: JSON.stringify([
          'Everything in Pro plan',
          'Team collaboration tools',
          'Advanced analytics dashboard',
          'Custom integrations',
          'White-label options',
          'Dedicated success manager',
          'Priority feature requests',
          'Advanced security features',
          'Custom AI model training',
          '24/7 premium support'
        ])
      }
    ];

    for (const pkg of packages) {
      const packageId = uuidv4();
      await pg.query(
        'INSERT INTO packages (id, name, description, price, credits_included, features, synced_at, last_modified, sync_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [packageId, pkg.name, pkg.description, pkg.price, pkg.credits_included, pkg.features, new Date(), new Date(), 'synced']
      );
    }

    console.log('Packages seeded successfully');
  } catch (e) {
    console.log('Error seeding packages:', e);
  }
};

export const seedInitialData = async () => {
  try {
    const pg = await getPg();

    console.log('Seeding initial data...');

    // Seed packages (these are system-wide, not user-specific)
    await seedPackages();

    console.log('Initial data seeded successfully');
  } catch (e) {
    console.log('Error seeding data:', e);
  }
};

export const seedSampleNotifications = async (userId) => {
  try {
    const pg = await getPg();

    // Check if user already has notifications
    const existingNotifications = await pg.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1', [userId]);
    if (existingNotifications.rows[0].count > 0) {
      return; // User already has notifications
    }

    const sampleNotifications = [
      {
        type: 'system',
        title: 'Welcome to Accelerator Platform',
        message: 'Your account has been successfully created. Complete your profile to unlock all features and start building your startup.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        type: 'credits',
        title: 'Welcome Credits Added',
        message: 'You\'ve received 50 free AI credits to explore our platform. Use them to generate business plans, market analysis, or pitch decks.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        type: 'system',
        title: 'Account Verification Complete',
        message: 'Your email has been verified. You now have full access to all platform features and can start creating projects.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        type: 'update',
        title: 'Platform Update: Enhanced AI Models',
        message: 'We\'ve upgraded our AI models with improved accuracy and faster processing. Your existing projects will automatically benefit from these improvements.',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        type: 'system',
        title: 'Getting Started Guide Available',
        message: 'Check out our comprehensive getting started guide in the Help section. Learn how to maximize your startup acceleration journey.',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
      }
    ];

    for (const notification of sampleNotifications) {
      await createNotification(userId, notification.type, notification.title, notification.message, notification.created_at);
    }
  } catch (e) {
    console.log('Error creating sample notifications:', e);
  }
};

// Sync data with Supabase
// Portfolio Collaboration Functions
export const inviteCollaborator = async (portfolioId, inviteeEmail, role = 'editor', message = '') => {
  try {
    const pg = await getPg();
    const inviterId = await getCurrentUserId(); // Need to implement this
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const res = await pg.query(
      'INSERT INTO portfolio_invitations (portfolio_id, inviter_id, invitee_email, role, message, expires_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (portfolio_id, invitee_email, status) DO NOTHING RETURNING *',
      [portfolioId, inviterId, inviteeEmail, role, message, expiresAt]
    );

     triggerSync();
     return res.rows[0];
   } catch (error) {
     console.error('Error inviting collaborator:', error);
     throw error;
   }
};

export const getPortfolioInvitations = async (portfolioId) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT pi.*, g.name as portfolio_name FROM portfolio_invitations pi JOIN groups g ON pi.portfolio_id = g.id WHERE pi.portfolio_id = $1 ORDER BY pi.invited_at DESC',
      [portfolioId]
    );
    return res.rows;
  } catch (error) {
    console.error('Error getting portfolio invitations:', error);
    return [];
  }
};

export const getUserInvitations = async (userEmail) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT pi.*, g.name as portfolio_name, u.email as inviter_email FROM portfolio_invitations pi JOIN groups g ON pi.portfolio_id = g.id LEFT JOIN users u ON pi.inviter_id = u.id WHERE pi.invitee_email = $1 AND pi.status = $2 AND pi.expires_at > CURRENT_TIMESTAMP ORDER BY pi.invited_at DESC',
      [userEmail, 'pending']
    );
    return res.rows;
  } catch (error) {
    console.error('Error getting user invitations:', error);
    return [];
  }
};

export const respondToInvitation = async (invitationId, status) => {
  try {
    const pg = await getPg();
    const userId = await getCurrentUserId(); // Need to implement this

    // Update invitation status
    await pg.query(
      'UPDATE portfolio_invitations SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, invitationId]
    );

    if (status === 'accepted') {
      // Get invitation details
      const invitation = await pg.query('SELECT * FROM portfolio_invitations WHERE id = $1', [invitationId]);
      if (invitation.rows[0]) {
        const inv = invitation.rows[0];

        // Add user as collaborator
        await pg.query(
          'INSERT INTO portfolio_collaborators (portfolio_id, user_id, inviter_id, role) VALUES ($1, $2, $3, $4)',
          [inv.portfolio_id, userId, inv.inviter_id, inv.role]
        );

        // Create notification for inviter
        await createNotification(
          inv.inviter_id,
          'system',
          'Invitation Accepted',
          `Your invitation to collaborate on portfolio "${await getGroupName(inv.portfolio_id)}" has been accepted.`
         );
       }
     }

     triggerSync();
     return true;
  } catch (error) {
    console.error('Error responding to invitation:', error);
    throw error;
  }
};

export const getPortfolioCollaborators = async (portfolioId) => {
  try {
    const pg = await getPg();
    const res = await pg.query(
      'SELECT pc.*, u.email, p.bio, p.avatar FROM portfolio_collaborators pc JOIN users u ON pc.user_id = u.id LEFT JOIN profiles p ON pc.user_id = p.user_id WHERE pc.portfolio_id = $1 ORDER BY pc.joined_at ASC',
      [portfolioId]
    );
    return res.rows;
  } catch (error) {
    console.error('Error getting portfolio collaborators:', error);
    return [];
  }
};

export const removeCollaborator = async (portfolioId, userId) => {
  try {
    const pg = await getPg();
    await pg.query(
      'DELETE FROM portfolio_collaborators WHERE portfolio_id = $1 AND user_id = $2',
      [portfolioId, userId]
    );

    // Create notification for removed user
    await createNotification(
      userId,
      'system',
      'Removed from Portfolio',
      `You have been removed from portfolio "${await getGroupName(portfolioId)}".`
     );

     triggerSync();
     return true;
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
};

export const updateCollaboratorRole = async (portfolioId, userId, role) => {
  try {
    const pg = await getPg();
    await pg.query(
      'UPDATE portfolio_collaborators SET role = $1 WHERE portfolio_id = $2 AND user_id = $3',
      [role, portfolioId, userId]
    );
    triggerSync();
    return true;
  } catch (error) {
    console.error('Error updating collaborator role:', error);
    throw error;
  }
};

// Helper functions
const getCurrentUserId = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

const getGroupName = async (groupId) => {
  try {
    const pg = await getPg();
    const res = await pg.query('SELECT name FROM groups WHERE id = $1', [groupId]);
    return res.rows[0]?.name || 'Unknown Portfolio';
  } catch (error) {
    return 'Unknown Portfolio';
  }
};

export const syncData = async () => {
  try {
    await performSync();
    console.log('Data sync completed');
  } catch (error) {
    console.error('Sync failed:', error);
  }
};