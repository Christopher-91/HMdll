import { useEffect, useRef, useState } from 'react';
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
 * Subscribes to a Pusher presence channel and binds one event handler.
 * Tracks and returns whether the other participant is currently online in this conversation.
 *
 * @param {string|null} conversationId  - The UUID of the active conversation.
 * @param {Function}    onNewMessage    - Callback invoked with each new message event payload.
 * @returns {boolean}   isOnline        - True if the other user is currently in the presence channel.
 */
export function usePusher(conversationId, onNewMessage) {
  const [isOnline, setIsOnline] = useState(false);
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    if (!conversationId) {
      setIsOnline(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const pusher = getPusherInstance(token);
    const channelName = `presence-conversation-${conversationId}`;
    const channel = pusher.subscribe(channelName);

    const messageHandler = (data) => callbackRef.current(data);
    channel.bind('new-message', messageHandler);

    // Presence events
    channel.bind('pusher:subscription_succeeded', (members) => {
      // If there's more than 1 member (us + them), they are online
      setIsOnline(members.count > 1);
    });

    channel.bind('pusher:member_added', () => {
      setIsOnline(true);
    });

    channel.bind('pusher:member_removed', () => {
      // Recheck count
      setIsOnline(channel.members.count > 1);
    });

    return () => {
      channel.unbind('new-message', messageHandler);
      channel.unbind('pusher:subscription_succeeded');
      channel.unbind('pusher:member_added');
      channel.unbind('pusher:member_removed');
      pusher.unsubscribe(channelName);
      setIsOnline(false);
    };
  }, [conversationId]);

  return isOnline;
}
