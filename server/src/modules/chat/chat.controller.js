import { query } from '../../config/database.js';
import pusher from '../../services/pusher.js';
import { ForbiddenError, BadRequestError } from '../../middleware/errorHandler.js';

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        c.*,
        cp.last_read_at,
        (
          SELECT count(*) FROM messages m 
          WHERE m.conversation_id = c.id 
          AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')
          AND m.sender_id != $1
        ) as unread_count,
        -- For DIRECT chats: get the OTHER participant's info
        -- For GROUP chats: these will be NULL (we use c.name instead)
        CASE WHEN c.is_group = false THEN other_u.id END         AS other_user_id,
        CASE WHEN c.is_group = false THEN other_u.first_name END AS other_first_name,
        CASE WHEN c.is_group = false THEN other_u.last_name END  AS other_last_name,
        CASE WHEN c.is_group = false THEN other_u.avatar_url END AS other_avatar_url,
        -- Last message preview
        (SELECT content FROM messages lm WHERE lm.conversation_id = c.id ORDER BY lm.created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages lm WHERE lm.conversation_id = c.id ORDER BY lm.created_at DESC LIMIT 1) AS last_message_at,
        -- For GROUP chats: participant count
        CASE WHEN c.is_group = true THEN (
          SELECT count(*) FROM conversation_participants gcp WHERE gcp.conversation_id = c.id
        ) END AS participant_count
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
      LEFT JOIN LATERAL (
        SELECT ocp.user_id FROM conversation_participants ocp
        WHERE ocp.conversation_id = c.id AND ocp.user_id <> $1
        LIMIT 1
      ) single_other ON c.is_group = false
      LEFT JOIN users other_u ON other_u.id = single_other.user_id
      ORDER BY COALESCE(c.updated_at, c.created_at) DESC
    `, [userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        c.*,
        CASE WHEN c.is_group = false THEN other_u.id END         AS other_user_id,
        CASE WHEN c.is_group = false THEN other_u.first_name END AS other_first_name,
        CASE WHEN c.is_group = false THEN other_u.last_name END  AS other_last_name,
        CASE WHEN c.is_group = false THEN other_u.avatar_url END AS other_avatar_url
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
      LEFT JOIN LATERAL (
        SELECT ocp.user_id FROM conversation_participants ocp
        WHERE ocp.conversation_id = c.id AND ocp.user_id <> $2
        LIMIT 1
      ) single_other ON c.is_group = false
      LEFT JOIN users other_u ON other_u.id = single_other.user_id
      WHERE c.id = $1
    `, [id, userId]);

    if (result.rows.length === 0) throw new ForbiddenError('Conversation not found');

    const conv = result.rows[0];

    // For group chats, also fetch all participants
    if (conv.is_group) {
      const participantsResult = await query(`
        SELECT u.id, u.first_name, u.last_name, u.avatar_url
        FROM conversation_participants gcp
        JOIN users u ON u.id = gcp.user_id
        WHERE gcp.conversation_id = $1
        ORDER BY u.first_name
      `, [id]);
      conv.participants = participantsResult.rows;
    }

    res.json({ success: true, data: conv });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cursor } = req.query; // created_at timestamp string
    const userId = req.user.id;

    // Check membership
    const check = await query('SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) throw new ForbiddenError('Not a participant of this conversation');

    // If fetching the first page (no cursor), mark as read
    if (!cursor) {
      await query('UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2', [id, userId]);
    }


    // Cursor-based pagination: fetch messages older than the cursor
    let sql = `
      SELECT m.*, u.first_name AS sender_first_name, u.last_name AS sender_last_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
    `;
    const params = [id];
    if (cursor) {
      sql += ' AND m.created_at < $2';
      params.push(cursor);
    }
    sql += ' ORDER BY m.created_at DESC LIMIT 30';

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

export const createDirectConversation = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.id;

    if (userId === targetUserId) throw new BadRequestError('Cannot create a chat with yourself');

    // ── Connection gate ──────────────────────────────────────────────────────
    // Users must have an accepted connection before a direct conversation can be opened.
    const connKey = [userId, targetUserId].sort().join(':');
    const connCheck = await query(
      'SELECT 1 FROM connection_requests WHERE connection_key = $1 AND status = $2',
      [connKey, 'accepted']
    );
    if (connCheck.rows.length === 0) {
      throw new ForbiddenError('You must be connected with this user before messaging them');
    }
    // ────────────────────────────────────────────────────────────────────────

    const ids = [userId, targetUserId].sort();
    const directKey = `${ids[0]}:${ids[1]}`;

    // Try to find existing by direct_key to prevent duplicates (as per schema constraints)
    const existing = await query('SELECT id FROM conversations WHERE direct_key = $1', [directKey]);
    if (existing.rows.length > 0) {
      // Re-fetch with full participant info so the frontend header can hydrate immediately
      const enriched = await query(`
        SELECT c.*, 
          other_u.id AS other_user_id,
          other_u.first_name AS other_first_name,
          other_u.last_name  AS other_last_name,
          other_u.avatar_url AS other_avatar_url
        FROM conversations c
        JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
        LEFT JOIN conversation_participants other_cp ON other_cp.conversation_id = c.id AND other_cp.user_id <> $2
        LEFT JOIN users other_u ON other_u.id = other_cp.user_id
        WHERE c.id = $1
      `, [existing.rows[0].id, userId]);
      return res.json({ success: true, data: enriched.rows[0] });
    }

    // Insert new
    await query('BEGIN');
    
    const convResult = await query(`
      INSERT INTO conversations (type, direct_key, is_group) 
      VALUES ('DIRECT', $1, false) 
      ON CONFLICT (direct_key) WHERE is_group = false AND direct_key IS NOT NULL DO UPDATE SET updated_at = NOW()
      RETURNING id, type, direct_key, is_group, name, created_at, updated_at
    `, [directKey]);
    
    const conv = convResult.rows[0];
    
    // Add participants only if this was newly inserted (by checking if we actually created it or updated)
    // To be safe with concurrent requests, we use INSERT ON CONFLICT DO NOTHING
    await query(`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES ($1, $2, 'member'), ($1, $3, 'member')
      ON CONFLICT DO NOTHING
    `, [conv.id, userId, targetUserId]);
    
    await query('COMMIT');
    res.status(201).json({ success: true, data: conv });
  } catch (err) {
    await query('ROLLBACK');
    next(err);
  }
};

// ─── Create a group conversation ──────────────────────────────────────────────
export const createGroupConversation = async (req, res, next) => {
  try {
    const { name, participantIds } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!name || !name.trim()) throw new BadRequestError('Group name is required');
    if (!Array.isArray(participantIds) || participantIds.length < 1) {
      throw new BadRequestError('At least one other participant is required');
    }

    // Prevent adding yourself to the participant list (you're always added as creator)
    const uniqueParticipants = [...new Set(participantIds.filter(id => id !== userId))];
    if (uniqueParticipants.length === 0) {
      throw new BadRequestError('At least one other participant is required');
    }

    // ── Connection gate ──────────────────────────────────────────────────────
    // Verify that the creator has an accepted connection with EVERY participant.
    // You cannot add strangers to a group chat.
    for (const participantId of uniqueParticipants) {
      const connKey = [userId, participantId].sort().join(':');
      const connCheck = await query(
        'SELECT 1 FROM connection_requests WHERE connection_key = $1 AND status = $2',
        [connKey, 'accepted']
      );
      if (connCheck.rows.length === 0) {
        throw new ForbiddenError(`You must be connected with all participants before adding them to a group`);
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    await query('BEGIN');

    // Create the group conversation
    const convResult = await query(`
      INSERT INTO conversations (type, is_group, name)
      VALUES ('GROUP', true, $1)
      RETURNING *
    `, [name.trim()]);

    const conv = convResult.rows[0];

    // Insert all participants (creator + selected friends)
    const allMembers = [userId, ...uniqueParticipants];
    const valuePlaceholders = allMembers
      .map((_, i) => `($1, $${i + 2}, $${allMembers.length + 2})`)
      .join(', ');
    
    // Build a simpler insert: creator gets 'admin', others get 'member'
    // First insert the creator as admin
    await query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [conv.id, userId]
    );
    // Then insert all other participants as members
    for (const pid of uniqueParticipants) {
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ($1, $2, 'member')`,
        [conv.id, pid]
      );
    }

    await query('COMMIT');

    // Fetch participant info for the response
    const participantsResult = await query(`
      SELECT u.id, u.first_name, u.last_name, u.avatar_url
      FROM conversation_participants gcp
      JOIN users u ON u.id = gcp.user_id
      WHERE gcp.conversation_id = $1
      ORDER BY u.first_name
    `, [conv.id]);

    conv.participants = participantsResult.rows;
    conv.participant_count = participantsResult.rows.length;

    res.status(201).json({ success: true, data: conv });
  } catch (err) {
    await query('ROLLBACK');
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const check = await query('SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) throw new ForbiddenError('Not a participant');

    // ── Connection revocation gate ───────────────────────────────────────────
    // Even though a conversation exists, verify the two users are still connected.
    // This closes the loophole where an unfriended user could still send messages.
    // NOTE: This gate only applies to DIRECT conversations, not group chats.
    const convMeta = await query(
      'SELECT type, direct_key, is_group FROM conversations WHERE id = $1',
      [id]
    );
    if (convMeta.rows[0]?.is_group === false && convMeta.rows[0]?.direct_key) {
      const directKey = convMeta.rows[0].direct_key;
      const connRevoke = await query(
        'SELECT 1 FROM connection_requests WHERE connection_key = $1 AND status = $2',
        [directKey, 'accepted']
      );
      if (connRevoke.rows.length === 0) {
        throw new ForbiddenError('You are no longer connected with this user');
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    // Fetch sender info for group message display
    const senderResult = await query(
      'SELECT first_name, last_name FROM users WHERE id = $1', [userId]
    );

    const result = await query(`
      INSERT INTO messages (conversation_id, sender_id, content) 
      VALUES ($1, $2, $3) RETURNING *
    `, [id, userId, content]);

    const message = result.rows[0];
    // Attach sender name for group chats
    if (senderResult.rows[0]) {
      message.sender_first_name = senderResult.rows[0].first_name;
      message.sender_last_name = senderResult.rows[0].last_name;
    }

    // Bump conversation updated_at for sorting
    await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [id]);

    // Broadcast in real-time
    pusher.trigger(`presence-conversation-${id}`, 'new-message', message);

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

export const pusherAuth = async (req, res, next) => {
  try {
    const { socket_id, channel_name } = req.body;
    const userId = req.user.id;

    if (!channel_name.startsWith('private-conversation-') && !channel_name.startsWith('presence-conversation-') && !channel_name.startsWith('private-user-')) {
      throw new ForbiddenError('Invalid channel requested');
    }

    if (channel_name.startsWith('private-user-')) {
      const targetUserId = channel_name.replace('private-user-', '');
      if (targetUserId !== userId) {
        throw new ForbiddenError('Not authorized for this user channel');
      }
      const auth = pusher.authorizeChannel(socket_id, channel_name);
      return res.send(auth);
    }

    const conversationId = channel_name.replace('private-conversation-', '').replace('presence-conversation-', '');

    // Critical Security Constraint: Ensure DB validation before authorization
    const check = await query('SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [conversationId, userId]);
    if (check.rows.length === 0) {
      throw new ForbiddenError('Not authorized for this channel');
    }

    // Authorize pusher subscription
    if (channel_name.startsWith('presence-')) {
      const presenceData = {
        user_id: userId,
        user_info: { id: userId, name: req.user.first_name }
      };
      const auth = pusher.authorizeChannel(socket_id, channel_name, presenceData);
      res.send(auth);
    } else {
      const auth = pusher.authorizeChannel(socket_id, channel_name);
      res.send(auth);
    }
  } catch (err) {
    next(err);
  }
};
