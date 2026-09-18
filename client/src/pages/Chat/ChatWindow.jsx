import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePusher } from '../../hooks/usePusher';
import { useChatScroll } from '../../hooks/useChatScroll';
import MessageList from '../../components/Chat/MessageList';
import api from '../../lib/api';

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

  const [messages, setMessages]           = useState([]);
  const [inputValue, setInputValue]       = useState('');
  const [showNewBadge, setShowNewBadge]   = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const [isFetching, setIsFetching]       = useState(true);
  const [convInfo, setConvInfo]           = useState(null);

  // Stable ref to the oldest message's created_at — used as the pagination cursor
  const cursorRef = useRef(null);

  // ─── Fetch conversation info (for the header) ──────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    api.get(`/chat/conversations/${conversationId}`)
      .then((res) => setConvInfo(res.data.data))
      .catch(() => {});
  }, [conversationId]);

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

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
      const confirmed = res.data.data;
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...confirmed, status: undefined } : m))
      );
    } catch {
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

  const handleRetry = useCallback((failedMsg) => {
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    sendMessage(failedMsg.content);
  }, [sendMessage]);

  // ─── Derived header info ────────────────────────────────────────────────────
  const otherName = convInfo
    ? `${convInfo.other_first_name || ''} ${convInfo.other_last_name || ''}`.trim() || 'Direct Message'
    : 'Loading…';
  const otherAvatar = convInfo?.other_avatar_url || null;
  const otherInitials = otherName !== 'Loading…'
    ? otherName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

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
      {/* ── Premium Header ── */}
      <header className="chat-window-header">
        <button
          id="chat-back-btn"
          className="chat-back-btn"
          onClick={() => navigate('/chat')}
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="chat-header-avatar">
          {otherAvatar
            ? <img src={otherAvatar} alt={otherName} referrerPolicy="no-referrer" />
            : <span>{otherInitials}</span>
          }
          <span className="chat-header-online-dot" />
        </div>

        <div className="chat-header-info">
          <p className="chat-window-title">{otherName}</p>
          <span className="chat-header-status">Active now</span>
        </div>

        <div className="chat-header-actions">
          <button className="chat-header-action-btn" aria-label="Voice call" title="Voice call">
            <Phone size={17} />
          </button>
          <button className="chat-header-action-btn" aria-label="Video call" title="Video call">
            <Video size={17} />
          </button>
          <button className="chat-header-action-btn" aria-label="More options" title="More options">
            <MoreVertical size={17} />
          </button>
        </div>
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
        <textarea
          id="chat-message-input"
          className="chat-input"
          placeholder="Type a message…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          autoComplete="off"
          maxLength={4000}
          rows={1}
        />
        <button
          id="chat-send-btn"
          type="submit"
          className="chat-send-btn"
          disabled={!inputValue.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
