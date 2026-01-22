import { v4 as uuidv4 } from 'uuid';
import { dbInstance } from './core.js';
import { updateEntity } from './operations.js';

// Group management functions
export async function _getGroups({ userId = null }) {
  if (!dbInstance) {
    console.debug('Database not initialized, returning empty groups');
    return [];
  }
  const whereClause = userId ? 'WHERE user_id = $1' : '';
  const params = userId ? [userId] : [];
  const query = `SELECT * FROM groups ${whereClause} ORDER BY created_at DESC`;
  const res = await dbInstance.query(query, params);
  return res.rows;
}

export async function _getGroupById({ id }) {
  try {
    const res = await dbInstance.query('SELECT * FROM groups WHERE id = $1', [id]);
    return res.rows[0];
  } catch (err) {
    console.debug('Error loading group:', err);
    return null;
  }
}

export async function _addGroup({ group, userId }) {
  try {
      const id = uuidv4();
      const res = await dbInstance.query(
        'INSERT INTO groups (id, user_id, name, description, color, created_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
        [id, userId, group.name, group.description || '', group.color || '#6366f1', group.createdAt || new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
      );
    return res.rows[0];
  } catch (err) {
    console.debug('Error adding group:', err);
    throw err;
  }
}

export async function _updateGroup({ id, group }) {
  try {
    const result = await updateEntity({ table: 'groups', idField: 'id', id, updates: group });
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (err) {
    console.debug('Error updating group:', err);
    throw err;
  }
}

export async function _deleteGroup({ id }) {
  try {
     await dbInstance.query('DELETE FROM project_groups WHERE group_id = $1', [id]);
     await dbInstance.query('DELETE FROM groups WHERE id = $1', [id]);
    return { success: true };
  } catch (err) {
    console.debug('Error deleting group:', err);
    throw err;
  }
}

export async function _addProjectToGroup({ projectId, groupId, userId }) {
  try {
     await dbInstance.query(
       'INSERT INTO project_groups (project_id, group_id, user_id, added_at) VALUES ($1, $2, $3, $4) ON CONFLICT (project_id, group_id) DO NOTHING',
       [projectId, groupId, userId, new Date().toISOString()]
     );
    return { success: true };
  } catch (err) {
    console.debug('Error adding project to group:', err);
    throw err;
  }
}

export async function _removeProjectFromGroup({ projectId, groupId }) {
  try {
     await dbInstance.query('DELETE FROM project_groups WHERE project_id = $1 AND group_id = $2', [projectId, groupId]);
    return { success: true };
  } catch (err) {
    console.debug('Error removing project from group:', err);
    throw err;
  }
}

export async function _getProjectsInGroup({ groupId }) {
  try {
     const res = await dbInstance.query(`
       SELECT p.*, pg.added_at as addedToGroupAt
       FROM projects p
       JOIN project_groups pg ON p.id = pg.project_id
       WHERE pg.group_id = $1
       ORDER BY pg.added_at DESC
     `, [groupId]);
    return res.rows;
  } catch (err) {
    console.debug('Error getting projects in group:', err);
    return [];
  }
}

export async function _getUngroupedProjects({ userId = null }) {
  if (!dbInstance) {
    console.debug('Database not initialized, returning empty ungrouped projects');
    return [];
  }
  try {
    const result = await dbInstance.query(`
      SELECT p.* FROM projects p
      LEFT JOIN project_groups pg ON p.id = pg.project_id
      WHERE pg.group_id IS NULL AND p.user_id = $1::text
    `, [userId]);
    return result.rows;
  } catch (err) {
    console.error('Error getting ungrouped projects:', err);
    return [];
  }
}

export async function _getGroupsWithProjects({ userId = null }) {
  if (!dbInstance) {
    console.debug('Database not initialized, returning empty groups with projects');
    return [];
  }
  try {
    const groups = await _getGroups({ userId });
    const groupsWithProjects = await Promise.all(
      groups.map(async (group) => ({
        ...group,
        projects: await _getProjectsInGroup({ groupId: group.id })
      }))
    );
    return groupsWithProjects;
  } catch (err) {
    console.debug('Error getting groups with projects:', err);
    return [];
  }
}

export async function _exportAllProjects({ userId = null }) {
  // Ensure database is initialized
  if (!dbInstance) {
    try {
      const { ensureDatabaseReady } = await import('./core.js');
      await ensureDatabaseReady();
    } catch (e) {
      console.error('Failed to initialize database:', e);
      return { projects: [], tasks: [], exportedAt: new Date().toISOString() };
    }
  }
  
  if (!dbInstance) {
    return { projects: [], tasks: [], exportedAt: new Date().toISOString() };
  }
  
  try {
    // Get all projects for the user
    const projects = await dbInstance.query(
      'SELECT * FROM projects WHERE user_id = $1::text ORDER BY created_at DESC',
      [userId]
    );

    // Get all tasks for these projects
    const projectIds = projects.rows.map(p => p.id);
    let tasks = [];
    if (projectIds.length > 0) {
      const tasksResult = await dbInstance.query(
        `SELECT * FROM tasks WHERE project_id = ANY($1) ORDER BY project_id, created_at`,
        [projectIds]
      );
      tasks = tasksResult.rows;
    }

    return {
      projects: projects.rows,
      tasks: tasks,
      exportedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error exporting all projects:', err);
    return { projects: [], tasks: [], exportedAt: new Date().toISOString() };
  }
}