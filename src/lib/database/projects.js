import { v4 as uuidv4 } from 'uuid';
import { dbInstance } from './core.js';
import { updateEntity } from './operations.js';

// Project management functions
export async function _createProject({ project, userId }) {
  try {
    // Import security functions dynamically to avoid circular dependencies
    const { validateAndSanitizeDbInput } = await import('../auth/security.js');

    // Validate and sanitize project inputs
    const nameValidation = validateAndSanitizeDbInput(project.name, 'project name');
    if (!nameValidation.valid) {
      throw new Error(`Project name validation failed: ${nameValidation.reason}`);
    }

    const descValidation = validateAndSanitizeDbInput(project.description, 'project description');
    if (!descValidation.valid) {
      throw new Error(`Project description validation failed: ${descValidation.reason}`);
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const totalSteps = parseInt(project.totalSteps, 10) || 60;
    const completedSteps = parseInt(project.completedSteps, 10) || 0;
    const consumedCredits = parseInt(project.consumedCredits, 10) || 0;
    const totalCredits = parseInt(project.totalCredits, 10) || 600;
    
    const values = [
      id,
      nameValidation.sanitized,
      descValidation.sanitized,
      userId,
      now,
      now,
      now,
      'local',
      null,
      1,
      project.public ? 1 : 0,
      project.currentModel || 'System',
      totalSteps,
      completedSteps,
      consumedCredits,
      totalCredits,
      project.ui_status || 'idle',
      project.currentStep || 'system',
      project.stepName || 'System Initialization',
      project.currentSection || 'Initialization',
      project.uiProgress || 0,
      project.uiMessage || 'Ready to start',
      project.currentPrompt || '',
      project.llmResponse || ''
    ];
    
    const res = await dbInstance.query(`
      INSERT INTO projects (
        id, name, description, user_id, created_at, last_modified, synced_at, 
        sync_status, deleted_at, version, public, current_model, total_steps, 
        completed_steps, consumed_credits, total_credits, ui_status, current_step,
        step_name, current_section, ui_progress, ui_message, current_prompt, llm_response
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `, values);
    
    return res.rows[0];
  } catch (err) {
    console.error('DB error in createProject:', err);
    throw err;
  }
}

export async function _getProjectById({ id }) {
  // Ensure database is initialized
  if (!dbInstance) {
    try {
      const { ensureDatabaseReady } = await import('./core.js');
      await ensureDatabaseReady();
    } catch (e) {
      console.warn('Database not initialized, skipping project fetch');
      return null;
    }
  }
  
  if (!dbInstance) return null;
  
  try {
    console.log('Getting project by id:', id);
    const result = await dbInstance.query('SELECT * FROM projects WHERE id = $1', [id]);
    console.log('Project query result:', result.rows);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error getting project by id:', err);
    return null;
  }
}

export async function _updateProject({ id, updates }) {
  if (!dbInstance) {
    console.warn('Database not initialized, skipping project update');
    return { success: false, error: 'Database not initialized' };
  }

  try {
    // Import security functions dynamically to avoid circular dependencies
    const { validateAndSanitizeDbInput } = await import('../auth/security.js');

    const allowedFields = [
      'current_step', 'completed_steps', 'step_name', 'current_model',
      'current_section', 'ui_progress', 'ui_message', 'ui_status',
      'current_prompt', 'llm_response', 'total_credits', 'consumed_credits',
      'total_time', 'consumed_time', 'name', 'description', 'status',
      'last_opened', 'last_modified', 'sync_status'
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbField)) {
        // Ensure value is a primitive JavaScript type (string, number, boolean, null)
        let primitiveValue = value;
        
        // Handle functions/signals by calling them if they're functions
        if (typeof value === 'function') {
          primitiveValue = value();
        }
        
        // Convert to appropriate type based on field
        if (dbField === 'completed_steps' || dbField === 'ui_progress' || 
            dbField === 'total_credits' || dbField === 'consumed_credits' ||
            dbField === 'total_time' || dbField === 'consumed_time') {
          // Integer fields
          primitiveValue = parseInt(primitiveValue, 10) || 0;
        } else if (typeof primitiveValue === 'object' && primitiveValue !== null) {
          // If it's still an object, stringify it or skip
          continue;
        } else {
          // String fields - ensure it's a string
          primitiveValue = String(primitiveValue ?? '');
        }
        
        // Validate and sanitize the value
        const validation = validateAndSanitizeDbInput(primitiveValue, `project ${key}`);
        if (!validation.valid) {
          // Skip invalid values instead of failing the entire update
          continue;
        }
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(validation.sanitized);
        paramIndex++;
      }
    }
    
    if (setClauses.length === 0) {
      return { success: true };
    }

    const now = new Date().toISOString();
    values.push(now);
    values.push(id);

    await dbInstance.query(
      `UPDATE projects SET ${setClauses.join(', ')}, last_modified = $${paramIndex} WHERE id = $${paramIndex + 1}`,
      values
    );
    
    return { success: true };
  } catch (err) {
    console.error('Error updating project:', err);
    return { success: false, error: err.message };
  }
}

export async function _deleteProject({ id }) {
  try {
    // Start a transaction to ensure data consistency
    await dbInstance.query('BEGIN');

    // Delete all tasks associated with the project
    await dbInstance.query('DELETE FROM tasks WHERE project_id = $1', [id]);

    // Delete step_data associated with the project
    await dbInstance.query('DELETE FROM step_data WHERE project_id = $1', [id]);

    // Delete the project itself
    await dbInstance.query('DELETE FROM projects WHERE id = $1', [id]);

    // Commit the transaction
    await dbInstance.query('COMMIT');

    // Log the deletion for audit purposes
    console.log(`Project ${id} and all associated data deleted successfully`);

    return { success: true };
  } catch (err) {
    // Rollback on error
    await dbInstance.query('ROLLBACK');
    console.error('Error deleting project:', err);
    throw err;
  }
}

export async function _deleteAllProjects({ userId }) {
  try {
    // First, delete all tasks associated with the user's projects
    await dbInstance.query(`
      DELETE FROM tasks 
      WHERE project_id IN (SELECT id FROM projects WHERE user_id = $1)
    `, [userId]);
    
    // Delete step_data associated with the projects
    await dbInstance.query(`
      DELETE FROM step_data 
      WHERE project_id IN (SELECT id FROM projects WHERE user_id = $1)
    `, [userId]);
    
    // Then delete all projects
    await dbInstance.query('DELETE FROM projects WHERE user_id = $1', [userId]);
    
    return { success: true };
  } catch (err) {
    console.error('Error deleting all projects:', err);
    throw err;
  }
}

export async function _toggleProjectPublic({ id }) {
  try {
    const result = await dbInstance.query(
      'UPDATE projects SET public = NOT public, last_modified = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error toggling project public status:', err);
    throw err;
  }
}

export async function _archiveProject({ id }) {
  try {
    const result = await dbInstance.query(
      'UPDATE projects SET archived = 1, archived_at = CURRENT_TIMESTAMP, last_modified = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error archiving project:', err);
    throw err;
  }
}

export async function _unarchiveProject({ id }) {
  try {
    const result = await dbInstance.query(
      'UPDATE projects SET archived = 0, archived_at = NULL, last_modified = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error unarchiving project:', err);
    throw err;
  }
}

export async function _getArchivedProjects(db, { userId }) {
  try {
    if (!db) return [];
    const result = await db.query(
      'SELECT * FROM projects WHERE user_id = $1 AND archived = 1 ORDER BY archived_at DESC',
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error('Error getting archived projects:', err);
    return [];
  }
}

export async function _getTasks({ projectId }) {
  // Ensure database is initialized
  if (!dbInstance) {
    try {
      const { ensureDatabaseReady } = await import('./core.js');
      await ensureDatabaseReady();
    } catch (e) {
      console.warn('Database not initialized, skipping tasks fetch');
      return [];
    }
  }
  
  if (!dbInstance) return [];
  
  try {
    const result = await dbInstance.query('SELECT * FROM tasks WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC', [projectId]);
    return result.rows;
  } catch (err) {
    console.error('Error getting tasks:', err);
    return [];
  }
}

export async function _addTask({ task }) {
  try {
    const id = uuidv4();
    await dbInstance.query(`
      INSERT INTO tasks (id, user_id, project_id, title, content, prompt, llm_response, model, section, step_name, created_at, last_modified, synced_at, sync_status, deleted_at, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      id,
      task.userId,
      task.projectId,
      task.title || null,
      task.content || null,
      task.prompt || null,
      task.llmResponse || null,
      task.model || null,
      task.section || null,
      task.stepName || null,
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      'local',
      null,
      1
    ]);
    return { success: true, id };
  } catch (err) {
    console.error('Error adding task:', err);
    throw err;
  }
}

export async function _updateTask({ id, content, llm_response }) {
  try {
    const { validateAndSanitizeDbInput } = await import('../auth/security.js');

    const updates = {};

    if (content !== undefined) {
      const validation = validateAndSanitizeDbInput(content, 'task content');
      if (!validation.valid) {
        throw new Error(`Task validation failed: ${validation.reason}`);
      }
      updates.content = validation.sanitized;
    }

    if (llm_response !== undefined) {
      const validation = validateAndSanitizeDbInput(llm_response, 'llm response');
      if (!validation.valid) {
        throw new Error(`LLM response validation failed: ${validation.reason}`);
      }
      updates.llm_response = validation.sanitized;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('No fields to update');
    }

    const result = await updateEntity({
      table: 'tasks',
      idField: 'id',
      id,
      updates
    });
    return result;
  } catch (err) {
    console.error('[_updateTask] Error updating task:', err);
    throw err;
  }
}

export async function _getProjects({ userId }) {
  if (!dbInstance) {
    // Try to ensure database is ready
    try {
      const { ensureDatabaseReady } = await import('./core.js');
      await ensureDatabaseReady();
    } catch (e) {
      console.debug('Database not initialized, returning empty projects');
      return [];
    }
  }
  
  if (!dbInstance) {
    console.debug('Database still not initialized, returning empty projects');
    return [];
  }
  
  try {
    const result = await dbInstance.query('SELECT * FROM projects WHERE user_id = $1 AND archived = 0 ORDER BY created_at DESC', [userId]);
    
    const projects = result.rows || [];
    
    return projects.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      userId: row.user_id,
      createdAt: row.created_at,
      lastModified: row.last_modified,
      currentStep: row.current_step,
      stepName: row.step_name,
      currentModel: row.current_model,
      uiStatus: row.ui_status,
      uiProgress: row.ui_progress,
      public: row.public,
      completedSteps: row.completed_steps
    }));
  } catch (err) {
    console.error('Error getting projects:', err);
    return [];
  }
}