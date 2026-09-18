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
        ) as unread_count,
        -- For DIRECT chats: get the OTHER participant's info
        other_u.id         AS other_user_id,
        other_u.first_name AS other_first_name,
        other_u.last_name  AS other_last_name,
        other_u.avatar_url AS other_avatar_url,
        -- Last message preview
        (SELECT content FROM messages lm WHERE lm.conversation_id = c.id ORDER BY lm.created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages lm WHERE lm.conversation_id = c.id ORDER BY lm.created_at DESC LIMIT 1) AS last_message_at
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
      LEFT JOIN conversation_participants other_cp 
        ON other_cp.conversation_id = c.id AND other_cp.user_id <> $1
      LEFT JOIN users other_u ON other_u.id = other_cp.user_id
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
        other_u.id         AS other_user_id,
        other_u.first_name AS other_first_name,
        other_u.last_name  AS other_last_name,
        other_u.avatar_url AS other_avatar_url
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
      LEFT JOIN conversation_participants other_cp 
        ON other_cp.conversation_id = c.id AND other_cp.user_id <> $2
      LEFT JOIN users other_u ON other_u.id = other_cp.user_id
      WHERE c.id = $1
    `, [id, userId]);

    if (result.rows.length === 0) throw new ForbiddenError('Conversation not found');
    res.json({ success: true, data: result.rows[0] });
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

    // Cursor-based pagination: fetch messages older than the cursor
    let sql = 'SELECT * FROM messages WHERE conversation_id = $1';
    const params = [id];
    if (cursor) {
      sql += ' AND created_at < $2';
      params.push(cursor);
    }
    sql += ' ORDER BY created_at DESC LIMIT 30';

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

    const ids = [userId, targetUserId].sort();
    const directKey = `${ids[0]}:${ids[1]}`;

    // Try to find existing by direct_key to prevent duplicates (as per schema constraints)
    const existing = await query('SELECT id FROM conversations WHERE direct_key = $1', [directKey]);
    if (existing.rows.length > 0) {
      return res.json({ success: true, data: existing.rows[0] });
    }

    // Insert new
    await query('BEGIN');
    
    const convResult = await query(`
      INSERT INTO conversations (type, direct_key) 
      VALUES ('DIRECT', $1) 
      ON CONFLICT (direct_key) DO UPDATE SET updated_at = NOW()
      RETURNING id, type, direct_key, created_at, updated_at
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

export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const check = await query('SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) throw new ForbiddenError('Not a participant');

    const result = await query(`
      INSERT INTO messages (conversation_id, sender_id, content) 
      VALUES ($1, $2, $3) RETURNING *
    `, [id, userId, content]);

    const message = result.rows[0];

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

    if (!channel_name.startsWith('private-conversation-') && !channel_name.startsWith('presence-conversation-')) {
      throw new ForbiddenError('Invalid channel requested');
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
