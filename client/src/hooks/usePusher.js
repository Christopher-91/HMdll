import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Module-level singleton so we never create more than one Pusher connection.
let pusherInstance = null;

function getPusherInstance(token) {
  if (!pusherInstance) {
    pusherInstance = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
      authEndpoint: `${API_URL}/chat/pusher/auth`,
      auth: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
  }
  return pusherInstance;
}

/**
 * usePusher
 *
 * Subscribes to a single Pusher private channel and binds one event handler.
 * Strictly cleans up (unbind + unsubscribe) when conversationId changes or the
 * component unmounts — this prevents duplicate event listeners on re-renders.
 *
 * @param {string|null} conversationId  - The UUID of the active conversation.
 * @param {Function}    onNewMessage    - Callback invoked with each new message event payload.
 */
export function usePusher(conversationId, onNewMessage) {
  // Keep a stable ref to the callback so the effect never needs to re-run
  // when the caller re-creates the function reference.
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    if (!conversationId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const pusher = getPusherInstance(token);
    const channelName = `private-conversation-${conversationId}`;
    const channel = pusher.subscribe(channelName);

    const handler = (data) => callbackRef.current(data);
    channel.bind('new-message', handler);

    return () => {
      // Strict cleanup: unbind the specific handler, then unsubscribe the channel.
      // This prevents duplicate listeners when conversationId changes mid-session.
      channel.unbind('new-message', handler);
      pusher.unsubscribe(channelName);
    };
  }, [conversationId]);
}
