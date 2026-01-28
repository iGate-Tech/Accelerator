import { dbInstance } from './core.js';

// Voting and public project functions
export async function _voteOnProject({ projectId, userId, voteType }) {
  if (!dbInstance) {
    return { action: 'mock', voteType };
  }
  try {
    const existingVote = await dbInstance.query(
      'SELECT id, vote_type FROM project_votes WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0];
      if (currentVote.vote_type === voteType) {
        await dbInstance.query('DELETE FROM project_votes WHERE id = $1', [
          currentVote.id,
        ]);
        return { action: 'removed', voteType: null };
      } else {
        await dbInstance.query(
          'UPDATE project_votes SET vote_type = $1 WHERE id = $2',
          [voteType, currentVote.id]
        );
        return { action: 'changed', voteType };
      }
    } else {
      await dbInstance.query(
        'INSERT INTO project_votes (project_id, user_id, vote_type, created_at) VALUES ($1, $2, $3, $4)',
        [projectId, userId, voteType, new Date().toISOString()]
      );
      return { action: 'added', voteType };
    }
  } catch (err) {
    console.debug('Error voting on project:', err);
    throw err;
  }
}

export async function _getProjectVotes({ projectId }) {
  if (!dbInstance) {
    return [];
  }
  try {
    const res = await dbInstance.query(
      `
       SELECT vote_type, COUNT(*) as count
       FROM project_votes
       WHERE project_id = $1
       GROUP BY vote_type
     `,
      [projectId]
    );
    return res.rows;
  } catch (err) {
    console.debug('Error getting project votes:', err);
    return [];
  }
}

export async function _getPublicProjectsWithVotes({ currentUserId }) {
  if (!dbInstance) {
    return [];
  }
  try {
    const res = await dbInstance.query(
      `
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
      WHERE p.public = 1
      ORDER BY (COALESCE(vs.upvotes, 0) - COALESCE(vs.downvotes, 0)) DESC, p.last_modified DESC
    `,
      [currentUserId]
    );
    return res.rows;
  } catch (err) {
    console.debug('Error getting public projects with votes:', err);
    return [];
  }
}

export async function _getPublicProjects() {
  if (!dbInstance) {
    return [];
  }
  try {
    const res = await dbInstance.query(
      'SELECT * FROM projects WHERE public = 1 ORDER BY last_modified DESC'
    );
    return res.rows;
  } catch (err) {
    console.debug('Error getting public projects:', err);
    return [];
  }
}

export async function _getProjectByName({ name }) {
  if (!dbInstance) {
    return null;
  }
  try {
    const res = await dbInstance.query(
      'SELECT * FROM projects WHERE name = $1',
      [name]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.debug('Error getting project by name:', err);
    return null;
  }
}
