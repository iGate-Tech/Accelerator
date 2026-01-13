import { v4 as uuidv4 } from 'uuid';
import { dbInstance } from './db-core.js';

// Project management functions
export async function _createProject({ project, userId }) {
  try {
    const id = uuidv4();
      const totalSteps = parseInt(project.totalSteps, 10);
      const completedSteps = parseInt(project.completedSteps, 10);
      const consumedCredits = parseInt(project.consumedCredits, 10);
      const totalCredits = parseInt(project.totalCredits, 10);
       const values = [
         id,
         project.name,
         project.description,
         userId,
         new Date().toISOString(),
         new Date().toISOString(),
         new Date().toISOString(),
         'local',
         null,
         1,
         project.public ? 1 : 0,
         project.currentModel || null,
         isNaN(totalSteps) ? 51 : totalSteps,
         isNaN(completedSteps) ? 0 : completedSteps,
         isNaN(consumedCredits) ? 0 : consumedCredits,
         isNaN(totalCredits) ? 100 : totalCredits,
         project.uiStatus || 'idle'
       ];
      console.log('Insert values:', values);
       const res = await dbInstance.query(`
         INSERT INTO projects (id, name, description, user_id, created_at, last_modified, synced_at, sync_status, deleted_at, version, public, current_model, total_steps, completed_steps, consumed_credits, total_credits, ui_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *
       `, values);
    return res.rows[0];
  } catch (err) {
    console.error('DB error in addTask:', err);
    throw err;
  }
}

export async function _getProjectById({ id }) {
  try {
    const result = await dbInstance.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error getting project by id:', err);
    return null;
  }
}

export async function _updateProject({ id, updates }) {
  try {
    const { updateEntity } = await import('./db-core.js');
    const fieldMappings = {
      totalCredits: 'total_credits',
      consumedCredits: 'consumed_credits',
      totalTime: 'total_time',
      consumedTime: 'consumed_time',
      currentModel: 'current_model',
      currentSection: 'current_section',
      currentStep: 'current_step',
      completedSteps: 'completed_steps',
      stepName: 'step_name',
      uiProgress: 'ui_progress',
      uiMessage: 'ui_message',
      uiStatus: 'ui_status',
      currentPrompt: 'current_prompt',
      llmResponse: 'llm_response',
      createdAt: 'created_at',
      syncedAt: 'synced_at',
      lastModified: 'last_modified',
      syncStatus: 'sync_status',
      deletedAt: 'deleted_at'
    };
    return await updateEntity({ table: 'projects', idField: 'id', id, updates, options: { fieldMappings } });
  } catch (err) {
    console.error('Error updating project:', err);
    throw err;
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
    const result = await dbInstance.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
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
      INSERT INTO tasks (id, project_id, content, prompt, llm_response, model, section, step_name, created_at, last_modified, synced_at, sync_status, deleted_at, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      id,
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
    console.warn('Database not initialized, returning empty projects');
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