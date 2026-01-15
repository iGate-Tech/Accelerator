import { v4 as uuidv4 } from 'uuid';
import { dbInstance } from './db-core.js';

// Project management functions
export async function _createProject({ project, userId }) {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    const totalSteps = parseInt(project.totalSteps, 10) || 60;
    const completedSteps = parseInt(project.completedSteps, 10) || 0;
    const consumedCredits = parseInt(project.consumedCredits, 10) || 0;
    const totalCredits = parseInt(project.totalCredits, 10) || 600;
    
    const values = [
      id,
      project.name,
      project.description,
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
      project.uiStatus || 'idle',
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
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (setClauses.length === 0) {
      return { success: true };
    }
    
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
    await dbInstance.query('DELETE FROM projects WHERE id = $1', [id]);
    return { success: true };
  } catch (err) {
    console.error('Error deleting project:', err);
    throw err;
  }
}

export async function _deleteAllProjects({ userId }) {
  try {
    await dbInstance.query('DELETE FROM projects WHERE user_id = $1', [userId]);
    return { success: true };
  } catch (err) {
    console.error('Error deleting all projects:', err);
    throw err;
  }
}

export async function _toggleProjectPublic({ id }) {
  try {
    await dbInstance.query('UPDATE projects SET public = NOT public WHERE id = $1', [id]);
    return { success: true };
  } catch (err) {
    console.error('Error toggling project public:', err);
    throw err;
  }
}

export async function _getTasks({ projectId }) {
  try {
    const result = await dbInstance.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC', [projectId]);
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
      INSERT INTO tasks (id, user_id, project_id, content, prompt, llm_response, model, section, step_name, created_at, last_modified, synced_at, sync_status, deleted_at, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      id,
      task.userId,
      task.projectId,
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
    return { success: true };
  } catch (err) {
    console.error('Error adding task:', err);
    throw err;
  }
}

export async function _updateTask({ id, content }) {
  try {
    const result = await updateEntity({
      table: 'tasks',
      idField: 'id',
      id,
      updates: { content }
    });
    return result;
  } catch (err) {
    console.error('Error updating task:', err);
    throw err;
  }
}

export async function _getProjects({ userId }) {
  if (!dbInstance) {
    console.debug('Database not initialized, returning empty projects');
    return [];
  }
  try {
    const result = await dbInstance.query('SELECT * FROM projects WHERE user_id = $1::text ORDER BY created_at DESC', [userId]);
    return result.rows;
  } catch (err) {
    console.error('Error getting projects:', err);
    return [];
  }
}