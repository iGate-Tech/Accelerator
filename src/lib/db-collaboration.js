import { v4 as uuidv4 } from 'uuid';
import { dbInstance, updateEntity } from './db-core.js';

// Collaboration and portfolio management functions
export async function _inviteCollaborator({ portfolioId, inviteeEmail, role = 'editor', message = '' }) {
  try {
    // Check if user exists
    const existingUser = await dbInstance.query('SELECT id FROM users WHERE email = $1', [inviteeEmail]);
    if (existingUser.rows.length === 0) {
      throw new Error('User with this email does not exist');
    }

    const inviteeId = existingUser.rows[0].id;

    // Check if invitation already exists
    const existingInvitation = await dbInstance.query(
      'SELECT id FROM portfolio_invitations WHERE portfolio_id = $1 AND invitee_email = $2 AND status = $3',
      [portfolioId, inviteeEmail, 'pending']
    );

    if (existingInvitation.rows.length > 0) {
      throw new Error('Invitation already sent to this user');
    }

    // Check if user is already a collaborator
    const existingCollaborator = await dbInstance.query(
      'SELECT id FROM portfolio_collaborators WHERE portfolio_id = $1 AND user_id = $2',
      [portfolioId, inviteeId]
    );

    if (existingCollaborator.rows.length > 0) {
      throw new Error('User is already a collaborator on this portfolio');
    }

    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await dbInstance.query(
      'INSERT INTO portfolio_invitations (id, portfolio_id, inviter_id, invitee_email, role, status, message, invited_at, expires_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
      [id, portfolioId, null, inviteeEmail, role, 'pending', message, new Date().toISOString(), expiresAt, new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
    );

    return { id, portfolioId, inviteeEmail, role, message, expiresAt };
  } catch (err) {
    console.error('Error inviting collaborator:', err);
    throw err;
  }
}

export async function _getPortfolioInvitations({ portfolioId }) {
  try {
    const res = await dbInstance.query(
      'SELECT * FROM portfolio_invitations WHERE portfolio_id = $1 ORDER BY invited_at DESC',
      [portfolioId]
    );
    return res.rows;
  } catch (err) {
    console.error('Error getting portfolio invitations:', err);
    return [];
  }
}

export async function _getUserInvitations({ userEmail }) {
  try {
    const res = await dbInstance.query(
      'SELECT pi.*, p.name as portfolio_name FROM portfolio_invitations pi LEFT JOIN projects p ON pi.portfolio_id = p.id WHERE pi.invitee_email = $1 AND pi.status = $2 ORDER BY pi.invited_at DESC',
      [userEmail, 'pending']
    );
    return res.rows;
  } catch (err) {
    console.error('Error getting user invitations:', err);
    return [];
  }
}

export async function _respondToInvitation({ invitationId, status }) {
  try {
    if (!['accepted', 'rejected'].includes(status)) {
      throw new Error('Invalid status. Must be "accepted" or "rejected"');
    }

    // Get invitation details
    const invitation = await dbInstance.query(
      'SELECT * FROM portfolio_invitations WHERE id = $1',
      [invitationId]
    );

    if (invitation.rows.length === 0) {
      throw new Error('Invitation not found');
    }

    const inv = invitation.rows[0];

    if (inv.status !== 'pending') {
      throw new Error('Invitation has already been responded to');
    }

    // Update invitation status
    await dbInstance.query(
      'UPDATE portfolio_invitations SET status = $1, responded_at = $2, last_modified = $3 WHERE id = $4',
      [status, new Date().toISOString(), new Date().toISOString(), invitationId]
    );

    // If accepted, add as collaborator
    if (status === 'accepted') {
      const user = await dbInstance.query('SELECT id FROM users WHERE email = $1', [inv.invitee_email]);
      if (user.rows.length > 0) {
        const userId = user.rows[0].id;
        await _addPortfolioCollaborator({ portfolioId: inv.portfolio_id, userId, role: inv.role });
      }
    }

    return { success: true, status };
  } catch (err) {
    console.error('Error responding to invitation:', err);
    throw err;
  }
}

export async function _getPortfolioCollaborators({ portfolioId }) {
  try {
    const res = await dbInstance.query(`
      SELECT pc.*, u.email, u.avatar
      FROM portfolio_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.portfolio_id = $1
      ORDER BY pc.joined_at ASC
    `, [portfolioId]);
    return res.rows;
  } catch (err) {
    console.error('Error getting portfolio collaborators:', err);
    return [];
  }
}

export async function _removeCollaborator({ portfolioId, userId }) {
  try {
    await dbInstance.query(
      'DELETE FROM portfolio_collaborators WHERE portfolio_id = $1 AND user_id = $2',
      [portfolioId, userId]
    );
    return { success: true };
  } catch (err) {
    console.error('Error removing collaborator:', err);
    throw err;
  }
}

export async function _updateCollaboratorRole({ portfolioId, userId, role }) {
  try {
    const result = await updateEntity({
      table: 'portfolio_collaborators',
      idField: ['portfolio_id', 'user_id'],
      id: [portfolioId, userId],
      updates: { role }
    });
    return result;
  } catch (err) {
    console.error('Error updating collaborator role:', err);
    throw err;
  }
}

export async function _addPortfolioCollaborator({ portfolioId, userId, role = 'editor' }) {
  try {
    // Check if already exists
    const existing = await dbInstance.query(
      'SELECT id FROM portfolio_collaborators WHERE portfolio_id = $1 AND user_id = $2',
      [portfolioId, userId]
    );

    if (existing.rows.length > 0) {
      // Update role if different
      await dbInstance.query(
        'UPDATE portfolio_collaborators SET role = $1, last_modified = $2 WHERE portfolio_id = $3 AND user_id = $4',
        [role, new Date().toISOString(), portfolioId, userId]
      );
      return existing.rows[0];
    }

    // Add new collaborator
    const id = uuidv4();
    await dbInstance.query(
      'INSERT INTO portfolio_collaborators (id, portfolio_id, user_id, role, joined_at, synced_at, last_modified, sync_status, deleted_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [id, portfolioId, userId, role, new Date().toISOString(), new Date().toISOString(), new Date().toISOString(), 'local', null, 1]
    );

    return { id, portfolioId, userId, role };
  } catch (err) {
    console.error('Error adding portfolio collaborator:', err);
    throw err;
  }
}