import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePusher } from '../../hooks/usePusher';
import { useChatScroll } from '../../hooks/useChatScroll';
import MessageList from '../../components/Chat/MessageList';
import api from '../../lib/api';
import { useEffect } from 'react';

/**
 * ChatWindow
 *
 * Orchestrates the entire active chat session:
 *   - Initial message fetch (cursor-based, 30 messages)
 *   - Optimistic UI: messages are appended immediately as 'sending' → confirmed/failed
 *   - Pusher real-time: incoming messages are deduplicated against our own sends
 *   - Upward infinite scroll via useChatScroll's IntersectionObserver
 *   - Smart auto-scroll + "New messages ↓" badge
 */
export default function ChatWindow() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages]         = useState([]);
  const [inputValue, setInputValue]     = useState('');
  const [showNewBadge, setShowNewBadge] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore]           = useState(true);
  const [isFetching, setIsFetching]     = useState(true);

  // Stable ref to the oldest message's created_at — used as the pagination cursor
  const cursorRef = useRef(null);

  // ─── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    setMessages([]);
    setHasMore(true);
    cursorRef.current = null;
    setIsFetching(true);

    api.get(`/chat/conversations/${conversationId}/messages`)
      .then((res) => {
        const fetched = res.data.data || [];
        // API returns DESC; we want chronological order for display
        const ordered = [...fetched].reverse();
        setMessages(ordered);
        setHasMore(fetched.length === 30);
        if (fetched.length > 0) {
          // oldest message = first item in DESC result
          cursorRef.current = fetched[fetched.length - 1].created_at;
        }
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [conversationId]);

  // ─── Load older messages (upward scroll / IntersectionObserver trigger) ────
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !cursorRef.current) return;

    setIsLoadingMore(true);
    try {
      const res = await api.get(
        `/chat/conversations/${conversationId}/messages?cursor=${encodeURIComponent(cursorRef.current)}`
      );
      const fetched = res.data.data || [];
      if (fetched.length === 0) {
        setHasMore(false);
        return;
      }
      const ordered = [...fetched].reverse();
      setMessages((prev) => [...ordered, ...prev]);
      setHasMore(fetched.length === 30);
      cursorRef.current = fetched[fetched.length - 1].created_at;
    } catch {
      // non-blocking — user can scroll again
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore]);

  // ─── useChatScroll ─────────────────────────────────────────────────────────
  const { scrollRef, topSentinelRef, scrollToBottom } = useChatScroll({
    messageCount: messages.length,
    onLoadMore: hasMore ? loadMore : null,
    setShowBadge: setShowNewBadge,
  });

  // ─── Pusher real-time ──────────────────────────────────────────────────────
  const handleIncomingMessage = useCallback((incomingMsg) => {
    // DEDUPLICATION: drop events for messages WE sent.
    // Our optimistic message already covers these; echo would cause a duplicate.
    if (incomingMsg.sender_id === user?.id) return;

    setMessages((prev) => [...prev, incomingMsg]);
  }, [user?.id]);

  usePusher(conversationId, handleIncomingMessage);

  // ─── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMsg = {
      id:              tempId,
      conversation_id: conversationId,
      sender_id:       user.id,
      content,
      created_at:      new Date().toISOString(),
      status:          'sending',
    };

    // Immediately append to UI
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
      const confirmed = res.data.data;

      // Swap the temp entry with the real one from the DB
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...confirmed, status: undefined } : m))
      );
    } catch {
      // Mark the optimistic message as failed — user sees a Retry button
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      );
    }
  }, [conversationId, user?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
    setInputValue('');
  };

  // Retry failed message
  const handleRetry = useCallback((failedMsg) => {
    // Remove the failed entry and re-send its content
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    sendMessage(failedMsg.content);
  }, [sendMessage]);

  // ─── Render ────────────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <div className="chat-window-loading">
        <div className="chat-skeleton-messages">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`chat-message-skeleton ${i % 2 === 0 ? 'own' : ''}`}>
              <div className="skeleton chat-skeleton-bubble" style={{ width: `${40 + (i * 17) % 40}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* ── Header ── */}
      <header className="chat-window-header">
        <button
          id="chat-back-btn"
          className="chat-back-btn"
          onClick={() => navigate('/chat')}
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </button>
        <p className="chat-window-title">Conversation</p>
      </header>

      {/* ── Message Feed ── */}
      <MessageList
        ref={scrollRef}
        topSentinelRef={topSentinelRef}
        messages={messages}
        currentUserId={user?.id}
        showNewBadge={showNewBadge}
        onBadgeClick={() => { scrollToBottom(); setShowNewBadge(false); }}
        onRetry={handleRetry}
        isLoadingMore={isLoadingMore}
      />

      {/* ── Input Bar ── */}
      <form id="chat-message-form" className="chat-input-bar" onSubmit={handleSubmit}>
        <input
          id="chat-message-input"
          type="text"
          className="chat-input"
          placeholder="Type a message…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoComplete="off"
          maxLength={4000}
        />
        <button
          id="chat-send-btn"
          type="submit"
          className="chat-send-btn"
          disabled={!inputValue.trim()}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
