import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Phone, Video, MoreVertical, UserPlus, Clock, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePusher } from '../../hooks/usePusher';
import { useChatScroll } from '../../hooks/useChatScroll';
import { useCall } from '../../context/CallContext';
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
 *   - Connection status gating: none / pending_sent / pending_received / accepted
 */
export default function ChatWindow() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();

  const [messages, setMessages]             = useState([]);
  const [inputValue, setInputValue]         = useState('');
  const [showNewBadge, setShowNewBadge]     = useState(false);
  
  const [isLoadingMore, setIsLoadingMore]   = useState(false);
  const [hasMore, setHasMore]               = useState(true);
  const [isFetching, setIsFetching]         = useState(true);
  const [convInfo, setConvInfo]             = useState(null);

  // Backend returns: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
  // Internal states: 'loading' | 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'forbidden'
  const [connectionStatus, setConnectionStatus] = useState('loading');

  // Stable ref to the oldest message's created_at — used as the pagination cursor
  const cursorRef = useRef(null);

  // ─── Fetch conversation info (for the header) ──────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    setConnectionStatus('loading');
    api.get(`/chat/conversations/${conversationId}`)
      .then((res) => setConvInfo(res.data.data))
      .catch((err) => {
        if (err?.response?.status === 403 || err?.response?.status === 404) {
          setConnectionStatus('forbidden');
          setIsFetching(false);
        }
      });
  }, [conversationId]);

  // ─── Check connection status once convInfo (other_user_id) is available ────
  // Maps exact backend status strings to internal state.
  useEffect(() => {
    if (!convInfo?.other_user_id) return;
    api.get(`/connections/status/${convInfo.other_user_id}`)
      .then((res) => {
        const s = res.data.data?.status;
        // Accepted → normal chat. All others → gated view with appropriate CTA.
        if (s === 'accepted') {
          setConnectionStatus('accepted');
        } else if (s === 'pending_sent') {
          setConnectionStatus('pending_sent');
        } else if (s === 'pending_received') {
          setConnectionStatus('pending_received');
        } else {
          // 'none' or unknown
          setConnectionStatus('none');
        }
      })
      .catch(() => setConnectionStatus('accepted')); // fail-open for non-DIRECT conversations
  }, [convInfo?.other_user_id]);

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
      if (fetched.length === 0) { setHasMore(false); return; }
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

    try {
      const audio = new Audio('/receive.wav');
      audio.play().catch(() => {});
    } catch (err) {}
  }, [user?.id]);

  const isOnline = usePusher(conversationId, handleIncomingMessage);

  // ─── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    try {
      const audio = new Audio('/send.wav');
      audio.play().catch(() => {});
    } catch (err) {}

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

  // ─── Connection CTA actions ────────────────────────────────────────────────
  // These live in ChatWindow so the blocked state is self-contained and
  // can transition into an active chat without a full page reload.

  const handleSendRequest = useCallback(async () => {
    if (!convInfo?.other_user_id) return;
    setConnectionStatus('pending_sent'); // optimistic
    try {
      await api.post('/connections/request', { recipientId: convInfo.other_user_id });
    } catch {
      setConnectionStatus('none'); // rollback
    }
  }, [convInfo?.other_user_id]);

  const handleAcceptRequest = useCallback(async () => {
    if (!convInfo?.other_user_id) return;
    try {
      // Fetch the pending request id to accept it
      const pendingRes = await api.get('/connections/pending');
      const req = pendingRes.data.data?.find(r => r.requester_id === convInfo.other_user_id);
      if (req) {
        await api.post('/connections/accept', { requestId: req.id });
        // Transition immediately into an active chat — no page reload required
        setConnectionStatus('accepted');
      }
    } catch { /* non-blocking */ }
  }, [convInfo?.other_user_id]);

  // ─── Derived header info ────────────────────────────────────────────────────
  const otherName = convInfo
    ? `${convInfo.other_first_name || ''} ${convInfo.other_last_name || ''}`.trim() || 'Direct Message'
    : 'Loading…';
  const otherAvatar = convInfo?.other_avatar_url || null;
  const otherInitials = otherName !== 'Loading…'
    ? otherName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // ─── Render ────────────────────────────────────────────────────────────────

  // Loading skeleton — shown while fetching initial messages
  if (isFetching && connectionStatus !== 'forbidden' && connectionStatus !== 'loading') {
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

  // ─── Forbidden (no conversation access) ────────────────────────────────────
  if (connectionStatus === 'forbidden') {
    return (
      <div className="chat-window">
        <header className="chat-window-header">
          <button id="chat-back-btn" className="chat-back-btn" onClick={() => navigate('/chat')} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
        </header>
        <div className="chat-locked-state">
          <div className="chat-locked-icon-wrap">
            <UserPlus size={32} strokeWidth={1.5} />
          </div>
          <h3 className="chat-locked-title">Conversation not found</h3>
          <p className="chat-locked-sub">This conversation doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  // ─── Not connected / pending states ────────────────────────────────────────
  const isGated = connectionStatus === 'none' || connectionStatus === 'pending_sent' || connectionStatus === 'pending_received';

  if (isGated) {
    return (
      <div className="chat-window">
        {/* Header — still shows user info */}
        <header className="chat-window-header">
          <button id="chat-back-btn" className="chat-back-btn" onClick={() => navigate('/chat')} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          {convInfo && (
            <>
              <div className="chat-header-avatar">
                {otherAvatar
                  ? <img src={otherAvatar} alt={otherName} referrerPolicy="no-referrer" />
                  : <span>{otherInitials}</span>}
              </div>
              <div className="chat-header-info">
                <p className="chat-window-title">{otherName}</p>
                <span className="chat-header-status" style={{ color: 'var(--text-tertiary)' }}>Not connected</span>
              </div>
            </>
          )}
        </header>

        {/* Actionable locked state body */}
        <div className="chat-locked-state">
          <div className="chat-locked-icon-wrap">
            <UserPlus size={32} strokeWidth={1.5} />
          </div>

          {connectionStatus === 'none' && (
            <>
              <h3 className="chat-locked-title">Connect to message {otherName || 'this user'}</h3>
              <p className="chat-locked-sub">Send a connection request to start chatting.</p>
              <button
                id="chat-send-connection-btn"
                className="chat-locked-cta"
                onClick={handleSendRequest}
              >
                <UserPlus size={15} />
                Send Connection Request
              </button>
            </>
          )}

          {connectionStatus === 'pending_sent' && (
            <>
              <h3 className="chat-locked-title">Request Sent</h3>
              <p className="chat-locked-sub">Waiting for {otherName || 'them'} to accept your connection request.</p>
              <button className="chat-locked-cta chat-locked-cta--pending" disabled>
                <Clock size={15} />
                Request Sent
              </button>
            </>
          )}

          {connectionStatus === 'pending_received' && (
            <>
              <h3 className="chat-locked-title">{otherName || 'Someone'} wants to connect</h3>
              <p className="chat-locked-sub">Accept their request to start messaging.</p>
              <button
                id="chat-accept-connection-btn"
                className="chat-locked-cta chat-locked-cta--accept"
                onClick={handleAcceptRequest}
              >
                <Check size={15} />
                Accept Connection Request
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Active chat ────────────────────────────────────────────────────────────
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
          {isOnline && <span className="chat-header-online-dot" />}
        </div>

        <div className="chat-header-info">
          <p className="chat-window-title">{otherName}</p>
          {isOnline ? (
            <span className="chat-header-status">Active now</span>
          ) : (
            <span className="chat-header-status" style={{ color: 'var(--text-tertiary)' }}>Offline</span>
          )}
        </div>

        <div className="chat-header-actions">
          <button
            className="chat-header-action-btn"
            aria-label="Voice call"
            title="Voice call"
            onClick={() => startCall(convInfo.other_user_id, otherName, false)}
          >
            <Phone size={17} />
          </button>
          <button
            className="chat-header-action-btn"
            aria-label="Video call"
            title="Video call"
            onClick={() => startCall(convInfo.other_user_id, otherName, true)}
          >
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

      {/* ── Input Bar — only rendered when fully connected ── */}
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
