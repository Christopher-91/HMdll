import pusher from '../../services/pusher.js';
import { ForbiddenError } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';

export const signal = async (req, res, next) => {
  try {
    const { type, recipientId, payload } = req.body;
    const callerId = req.user.id;

    if (!recipientId || !type) {
      return res.status(400).json({ success: false, error: 'recipientId and type are required' });
    }

    // Optional: Add DB validation to ensure the users are allowed to call each other.
    // For now, we trust the callerId if they're authenticated.

    // Payload enrichment with caller info
    const fullPayload = {
      type, // 'ring', 'accept', 'decline', 'offer', 'answer', 'ice-candidate', 'end'
      callerId,
      callerName: `${req.user.first_name} ${req.user.last_name || ''}`.trim(),
      payload // Any SDP or candidate objects
    };

    // Broadcast the signal to the recipient's private user channel
    pusher.trigger(`private-user-${recipientId}`, 'call-signal', fullPayload);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
