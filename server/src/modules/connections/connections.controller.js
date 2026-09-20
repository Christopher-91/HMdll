import { query } from '../../config/database.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../middleware/errorHandler.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the bidirectional connection_key from two user IDs.
 * Always sorts alphabetically so uuidA:uuidB === uuidB:uuidA.
 */
const buildConnectionKey = (idA, idB) => [idA, idB].sort().join(':');

// ─── Send a connection request ────────────────────────────────────────────────
export const sendRequest = async (req, res, next) => {
  try {
    const requesterId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) throw new BadRequestError('recipientId is required');
    if (requesterId === recipientId) throw new BadRequestError('Cannot connect with yourself');

    const connectionKey = buildConnectionKey(requesterId, recipientId);

    // Check if a relationship row already exists
    const existing = await query(
      'SELECT requester_id, status FROM connection_requests WHERE connection_key = $1',
      [connectionKey]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];

      if (row.status === 'accepted') {
        throw new BadRequestError('Already connected');
      }

      // Pending or rejected — silent: just return success so UI shows "Request Sent"
      return res.json({ success: true, data: { status: 'pending_sent' } });
    }

    // No existing row — insert fresh request
    await query(
      `INSERT INTO connection_requests (requester_id, recipient_id, connection_key, status)
       VALUES ($1, $2, $3, 'pending')`,
      [requesterId, recipientId, connectionKey]
    );

    res.status(201).json({ success: true, data: { status: 'pending_sent' } });
  } catch (err) {
    next(err);
  }
};

// ─── Accept an incoming request ───────────────────────────────────────────────
export const acceptRequest = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    const { requestId } = req.body;

    if (!requestId) throw new BadRequestError('requestId is required');

    const result = await query(
      `UPDATE connection_requests
       SET status = 'accepted', updated_at = NOW()
       WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, recipientId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Request not found or already actioned');
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── Reject an incoming request ───────────────────────────────────────────────
// Silent reject: status is set to 'rejected' in the DB, but the
// requester's status endpoint will still return 'pending_sent' to them.
export const rejectRequest = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    const { requestId } = req.body;

    if (!requestId) throw new BadRequestError('requestId is required');

    const result = await query(
      `UPDATE connection_requests
       SET status = 'rejected', updated_at = NOW()
       WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, recipientId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Request not found or already actioned');
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ─── Get pending incoming requests ────────────────────────────────────────────
export const getPending = async (req, res, next) => {
  try {
    const recipientId = req.user.id;

    const result = await query(
      `SELECT
         cr.id,
         cr.created_at,
         u.id          AS requester_id,
         u.first_name  AS requester_first_name,
         u.last_name   AS requester_last_name,
         u.avatar_url  AS requester_avatar_url,
         u.username    AS requester_username
       FROM connection_requests cr
       JOIN users u ON u.id = cr.requester_id
       WHERE cr.recipient_id = $1 AND cr.status = 'pending'
       ORDER BY cr.created_at DESC`,
      [recipientId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── Get connection status between current user and a target ──────────────────
// Silent reject: requester sees 'pending_sent' even if rejected.
export const getStatus = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { userId: targetUserId } = req.params;

    if (!targetUserId) throw new BadRequestError('userId param is required');
    if (currentUserId === targetUserId) {
      return res.json({ success: true, data: { status: 'self' } });
    }

    const connectionKey = buildConnectionKey(currentUserId, targetUserId);

    const result = await query(
      'SELECT requester_id, recipient_id, status FROM connection_requests WHERE connection_key = $1',
      [connectionKey]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: { status: 'none' } });
    }

    const row = result.rows[0];

    if (row.status === 'accepted') {
      return res.json({ success: true, data: { status: 'accepted' } });
    }

    if (row.status === 'pending') {
      const status = row.requester_id === currentUserId ? 'pending_sent' : 'pending_received';
      return res.json({ success: true, data: { status } });
    }

    if (row.status === 'rejected') {
      // Silent reject: requester never knows — always returns 'pending_sent' to them.
      // Recipient sees 'none' (the request is dead but they already acted on it).
      const status = row.requester_id === currentUserId ? 'pending_sent' : 'none';
      return res.json({ success: true, data: { status } });
    }

    res.json({ success: true, data: { status: 'none' } });
  } catch (err) {
    next(err);
  }
};
