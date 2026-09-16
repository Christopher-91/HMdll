import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import MessageItem from './MessageItem';

/**
 * MessageList
 *
 * Receives refs and state from useChatScroll via ChatWindow. Renders:
 *   - A top sentinel div observed by the IntersectionObserver (upward pagination).
 *   - All MessageItem bubbles in chronological order.
 *   - A floating "New messages ↓" badge when the user is scrolled up.
 *
 * This component intentionally holds no scroll or fetch logic — that belongs in
 * useChatScroll and ChatWindow respectively.
 */
const MessageList = forwardRef(function MessageList(
  { messages, currentUserId, showNewBadge, onBadgeClick, onRetry, topSentinelRef, isLoadingMore },
  scrollRef
) {
  return (
    <div className="chat-message-list" ref={scrollRef} id="chat-message-list">
      {/* Top sentinel — observed by IntersectionObserver in useChatScroll */}
      <div ref={topSentinelRef} className="chat-top-sentinel" aria-hidden="true" />

      {isLoadingMore && (
        <div className="chat-loading-more" aria-label="Loading older messages">
          <span className="chat-loading-dot" />
          <span className="chat-loading-dot" />
          <span className="chat-loading-dot" />
        </div>
      )}

      {messages.length === 0 && !isLoadingMore && (
        <div className="chat-no-messages">
          <p>Send a message to start the conversation.</p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isOwn={msg.sender_id === currentUserId}
          onRetry={onRetry}
        />
      ))}

      {/* Floating "New messages" badge — shown when user scrolled up and a new message arrives */}
      {showNewBadge && (
        <button
          id="chat-new-messages-badge"
          className="chat-new-messages-badge"
          onClick={onBadgeClick}
          aria-label="Jump to new messages"
        >
          <ChevronDown size={14} />
          New messages
        </button>
      )}
    </div>
  );
});

export default MessageList;
