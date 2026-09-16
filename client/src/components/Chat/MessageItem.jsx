import { memo } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

/**
 * MessageItem
 *
 * Renders a single message bubble with three possible states:
 *   - 'sending'  → rendered at reduced opacity (optimistic, not yet confirmed)
 *   - 'failed'   → red error text + Retry button
 *   - undefined  → fully confirmed message
 *
 * Deduplication contract: the parent (ChatWindow) is responsible for skipping
 * Pusher events where sender_id === currentUser.id. This component renders
 * whatever it receives without any dedup logic of its own.
 */
function MessageItem({ message, isOwn, onRetry }) {
  const isSending = message.status === 'sending';
  const isFailed  = message.status === 'failed';

  const bubbleClass = [
    'chat-bubble',
    isOwn ? 'chat-bubble--own' : 'chat-bubble--other',
    isSending ? 'chat-bubble--sending' : '',
    isFailed  ? 'chat-bubble--failed'  : '',
  ].filter(Boolean).join(' ');

  // Format timestamp — only show if message is confirmed
  const timestamp = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`chat-message-row ${isOwn ? 'chat-message-row--own' : ''}`} id={`msg-${message.id}`}>
      <div className={bubbleClass}>
        <p className="chat-bubble-text">{message.content}</p>

        <div className="chat-bubble-meta">
          {timestamp && <span className="chat-bubble-time">{timestamp}</span>}

          {isSending && (
            <span className="chat-bubble-status chat-bubble-status--sending" title="Sending…">
              <RefreshCw size={11} className="chat-status-spin" />
            </span>
          )}

          {isFailed && (
            <span className="chat-bubble-status chat-bubble-status--failed">
              <AlertCircle size={11} />
              <span>Failed</span>
              <button
                className="chat-retry-btn"
                onClick={() => onRetry(message)}
                aria-label="Retry sending message"
              >
                Retry
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// memo prevents re-renders when sibling messages update
export default memo(MessageItem);
