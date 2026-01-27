import { v4 as uuidv4 } from 'uuid';
import { dbInstance } from './core.js';
import { updateEntity } from './operations.js';
import { extractHighlightedText, generateContextString } from '../ui/llm-template.js';

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
      project.status || 'active',
      now,
      now,
      project.public ? 1 : 0,
      project.context || ''
    ];
    
    const res = await dbInstance.query(`
      INSERT INTO projects (
        id, name, description, user_id, status, created_at, last_modified, public, context
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      'name', 'description', 'status', 'last_modified', 'public', 'context', 'content'
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    // Get current project to access existing context
    let currentProject = null;
    if (updates.content || updates.context) {
      try {
        const result = await dbInstance.query('SELECT context FROM projects WHERE id = $1', [id]);
        currentProject = result.rows[0];
      } catch (err) {
        console.warn('Could not fetch current project for context update:', err.message);
      }
    }

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
        if (typeof primitiveValue === 'object' && primitiveValue !== null) {
          // If it's still an object, stringify it or skip
          continue;
        } else {
          // String fields - ensure it's a string
          primitiveValue = String(primitiveValue ?? '');
        }

        // Special handling for context aggregation
        if (dbField === 'context' || dbField === 'content') {
          // Extract highlighted text from the response/content
          const highlights = extractHighlightedText(primitiveValue);

          if (highlights.length > 0) {
            // Get existing context if available
            let existingContext = currentProject?.context || '';

            // Generate new context string from highlights
            const newHighlightsStr = generateContextString(highlights);

            // Combine existing context with new highlights
            let combinedContext = existingContext;
            if (combinedContext && newHighlightsStr) {
              combinedContext = `${combinedContext}; ${newHighlightsStr}`;
            } else if (newHighlightsStr) {
              combinedContext = newHighlightsStr;
            }

            // Add context to update if it's different from current
            if (combinedContext !== currentProject?.context) {
              setClauses.push(`context = $${paramIndex}`);
              values.push(combinedContext);
              paramIndex++;
            }
          }
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
    const { ensureDatabaseReady } = await import('./core.js');

    if (!id) {
      throw new Error('Task ID is required');
    }

    const db = await ensureDatabaseReady();

    const setClauses = [];
    const values = [];

    if (content !== undefined) {
      const validation = validateAndSanitizeDbInput(content, 'task content');
      if (!validation.valid) {
        throw new Error(`Task validation failed: ${validation.reason}`);
      }
      const idx = values.length + 1;
      setClauses.push(`content = $${idx}`);
      values.push(validation.sanitized);
    }

    if (llm_response !== undefined) {
      const validation = validateAndSanitizeDbInput(llm_response, 'llm response');
      if (!validation.valid) {
        throw new Error(`LLM response validation failed: ${validation.reason}`);
      }
      const idx = values.length + 1;
      setClauses.push(`llm_response = $${idx}`);
      values.push(validation.sanitized);
    }

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    const lastModifiedIdx = values.length + 1;
    setClauses.push(`last_modified = $${lastModifiedIdx}`);
    values.push(new Date().toISOString());

    const idIdx = values.length + 1;
    const query = `
      UPDATE tasks
      SET ${setClauses.join(', ')}
      WHERE id = $${idIdx}
      RETURNING *
    `;

    values.push(id);

    const result = await db.query(query, values);

    return { success: true, data: result.rows[0] };
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
    const result = await dbInstance.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

    const projects = result.rows || [];

    return projects.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      userId: row.user_id,
      createdAt: row.created_at,
      lastModified: row.last_modified,
      public: row.public,
      context: row.context
    }));
  } catch (err) {
    console.error('Error getting projects:', err);
    return [];
  }
}

/**
 * Check project completion status and display remaining steps
 * @param {string} projectId - The project ID to check
 * @returns {Object} Completion status information
 */
export async function checkProjectCompletion(projectId) {
  try {
    // Import steps from business models
    let steps = [];
    try {
      const stepsModule = await import('../business.js');
      steps = stepsModule.steps || [];
    } catch (importError) {
      console.warn('Could not import steps, using empty array:', importError.message);
      steps = [];
    }
    
    // Get all tasks for the project
    const tasks = await _getTasks({ projectId });
    
    // Total steps in the application
    const totalSteps = steps.length;
    
    // If we can't get steps, we can't check completion
    if (totalSteps === 0) {
      console.warn('[Project Completion Check] Could not determine total steps');
      return {
        totalSteps: 0,
        completedSteps: 0,
        remainingSteps: 0,
        isComplete: false,
        error: 'Could not determine total steps'
      };
    }
    
    // Count completed steps (tasks with content)
    const completedSteps = tasks.filter(task => 
      task.content && task.content.trim().length > 0
    ).length;
    
    // Calculate remaining steps
    const remainingSteps = totalSteps - completedSteps;
    
    // Get step names for completed tasks
    const completedStepNames = tasks
      .filter(task => task.content && task.content.trim().length > 0)
      .map(task => task.step_name || 'Unknown Step');
    
    // Get step names for all steps
    const allStepNames = steps.map(step => {
      if (typeof step.name === 'object' && step.name !== null) {
        return step.name['en'] || step.name['ar'] || 'Unknown Step';
      }
      return step.name || 'Unknown Step';
    });

    // Find remaining step names
    const remainingStepNames = allStepNames.filter(
      stepName => !completedStepNames.includes(stepName)
    );
    
    // Create result object
    const result = {
      totalSteps,
      completedSteps,
      remainingSteps,
      isComplete: remainingSteps === 0,
      completedStepNames,
      remainingStepNames
    };
    
    // Update project status in database
    try {
      if (dbInstance) {
        const now = new Date().toISOString();
        await dbInstance.query(
          `UPDATE projects SET
            last_modified = $1
          WHERE id = $2`,
          [
            now,
            projectId
          ]
        );
      }
    } catch (updateError) {
      console.warn('Could not update project status:', updateError.message);
    }
    
    // Display information in console
    console.log('[Project Completion Check]');
    console.log(`Total Steps: ${totalSteps}`);
    console.log(`Completed Steps: ${completedSteps}`);
    console.log(`Remaining Steps: ${remainingSteps}`);
    
    if (result.isComplete) {
      console.log('🎉 Project is complete!');
    } else {
      console.log('Remaining Steps:');
      remainingStepNames.forEach((stepName, index) => {
        console.log(`  ${index + 1}. ${stepName}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error checking project completion:', error);
    return {
      error: true,
      message: error.message
    };
  }
}
