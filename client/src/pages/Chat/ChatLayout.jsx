import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, MessageSquare, X, Plus,
  UserPlus, Clock, Check, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../../lib/api';
import ChatWindow from './ChatWindow';
import './Chat.css';

// ─── UserSearch ────────────────────────────────────────────────────────────────
// Shows a context-aware action button for each search result based on connection status.
function UserSearch({ onStartChat }) {
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState([]);
  const [statuses, setStatuses]       = useState({}); // userId → status string
  const [loadingAction, setLoading]   = useState(null); // userId being actioned
  const [isOpen, setIsOpen]           = useState(false);
  const debounceRef                   = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setStatuses({}); setIsOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(val)}`);
        const users = res.data.data || [];
        setResults(users);
        setIsOpen(true);
        // Fetch all connection statuses in parallel — N is small (≤10 results)
        const pairs = await Promise.all(
          users.map(async (u) => {
            try {
              const r = await api.get(`/connections/status/${u.id}`);
              return [u.id, r.data.data?.status || 'none'];
            } catch { return [u.id, 'none']; }
          })
        );
        setStatuses(Object.fromEntries(pairs));
      } catch { setResults([]); }
    }, 350);
  };

  const handleConnect = async (user) => {
    setStatuses(prev => ({ ...prev, [user.id]: 'pending_sent' })); // optimistic
    setLoading(user.id);
    try {
      await api.post('/connections/request', { recipientId: user.id });
    } catch {
      setStatuses(prev => ({ ...prev, [user.id]: 'none' })); // rollback
    } finally { setLoading(null); }
  };

  const handleAcceptFromSearch = async (user) => {
    setLoading(user.id);
    try {
      const pendingRes = await api.get('/connections/pending');
      const req = pendingRes.data.data?.find(r => r.requester_id === user.id);
      if (req) {
        await api.post('/connections/accept', { requestId: req.id });
        setStatuses(prev => ({ ...prev, [user.id]: 'accepted' }));
      }
    } catch { /* non-blocking */ }
    finally { setLoading(null); }
  };

  const handleMessage = (user) => {
    onStartChat(user);
    setQuery(''); setResults([]); setStatuses({}); setIsOpen(false);
  };

  const clear = () => { setQuery(''); setResults([]); setStatuses({}); setIsOpen(false); };

  const renderActionBtn = (user) => {
    const status  = statuses[user.id];
    const busy    = loadingAction === user.id;

    // Show spinner-style disabled until status is loaded
    if (status === undefined) {
      return <button className="conn-action-btn conn-action-btn--pending" disabled><Clock size={11} /></button>;
    }

    if (status === 'accepted') return (
      <button className="conn-action-btn conn-action-btn--message" onMouseDown={() => handleMessage(user)} disabled={busy}>
        <MessageSquare size={11} /> Message
      </button>
    );
    if (status === 'pending_sent') return (
      <button className="conn-action-btn conn-action-btn--pending" disabled>
        <Clock size={11} /> Sent
      </button>
    );
    if (status === 'pending_received') return (
      <button className="conn-action-btn conn-action-btn--accept" onMouseDown={() => handleAcceptFromSearch(user)} disabled={busy}>
        <Check size={11} /> Accept
      </button>
    );
    // default: 'none'
    return (
      <button className="conn-action-btn conn-action-btn--connect" onMouseDown={() => handleConnect(user)} disabled={busy}>
        <UserPlus size={11} /> Connect
      </button>
    );
  };

  return (
    <div className="chat-user-search">
      <div className="chat-search-input-wrapper">
        <Search className="chat-search-icon" size={15} />
        <input
          id="chat-user-search-input"
          type="text"
          placeholder="Find a student…"
          value={query}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          className="chat-search-input"
          autoComplete="off"
        />
        {query && (
          <button className="chat-search-clear" onClick={clear}><X size={13} /></button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="chat-search-results" role="listbox">
          {results.map((u) => (
            <li key={u.id} role="option" className="chat-search-result-item">
              <div className="chat-avatar chat-avatar-sm">
                {u.avatar_url ? <img src={u.avatar_url} alt="" /> : <span>{u.first_name?.[0]}{u.last_name?.[0]}</span>}
              </div>
              <div className="chat-result-info">
                <p className="chat-result-name">{u.first_name} {u.last_name}</p>
                {u.username && <p className="chat-result-handle">@{u.username}</p>}
              </div>
              {renderActionBtn(u)}
            </li>
          ))}
        </ul>
      )}
      {isOpen && results.length === 0 && query.trim() && (
        <div className="chat-search-empty">No students found</div>
      )}
    </div>
  );
}

// ─── RequestItem ───────────────────────────────────────────────────────────────
function RequestItem({ request, onAccept, onDecline }) {
  const [busy, setBusy]  = useState(false);
  const displayName      = `${request.requester_first_name} ${request.requester_last_name || ''}`.trim();
  const initials         = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const wrap = (fn) => async () => { setBusy(true); await fn(request); setBusy(false); };

  return (
    <div className="conn-request-item">
      <div className="chat-avatar chat-avatar-sm">
        {request.requester_avatar_url
          ? <img src={request.requester_avatar_url} alt="" referrerPolicy="no-referrer" />
          : <span>{initials}</span>}
      </div>
      <div className="conn-request-info">
        <p className="conn-request-name">{displayName}</p>
        {request.requester_username && (
          <p className="conn-request-handle">@{request.requester_username}</p>
        )}
      </div>
      <div className="conn-request-actions">
        <button
          id={`req-accept-${request.id}`}
          className="conn-req-btn conn-req-btn--accept"
          onClick={wrap(onAccept)}
          disabled={busy}
          title="Accept"
          aria-label="Accept connection request"
        >
          <Check size={13} />
        </button>
        <button
          id={`req-decline-${request.id}`}
          className="conn-req-btn conn-req-btn--decline"
          onClick={wrap(onDecline)}
          disabled={busy}
          title="Decline"
          aria-label="Decline connection request"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── RequestsSection ──────────────────────────────────────────────────────────
// Collapsible sidebar section listing all incoming pending connection requests.
function RequestsSection({ onRequestAccepted }) {
  const [requests, setRequests] = useState([]);
  const [isOpen, setIsOpen]     = useState(true);

  useEffect(() => {
    api.get('/connections/pending')
      .then(res => setRequests(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleAccept = useCallback(async (request) => {
    setRequests(prev => prev.filter(r => r.id !== request.id)); // optimistic remove
    try {
      await api.post('/connections/accept', { requestId: request.id });
      onRequestAccepted(request); // let parent open/prepend the conversation
    } catch {
      setRequests(prev => [request, ...prev]); // rollback
    }
  }, [onRequestAccepted]);

  const handleDecline = useCallback(async (request) => {
    setRequests(prev => prev.filter(r => r.id !== request.id)); // optimistic remove
    try {
      await api.post('/connections/reject', { requestId: request.id });
    } catch {
      setRequests(prev => [request, ...prev]); // rollback
    }
  }, []);

  if (requests.length === 0) return null;

  return (
    <div className="conn-requests-section">
      <button className="conn-requests-header" onClick={() => setIsOpen(v => !v)}>
        <span className="conn-requests-label">
          Message Requests
          <span className="conn-requests-badge">{requests.length}</span>
        </span>
        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {isOpen && (
        <div className="conn-requests-list">
          {requests.map(req => (
            <RequestItem
              key={req.id}
              request={req}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ConversationItem ──────────────────────────────────────────────────────────
function ConversationItem({ conv }) {
  const { conversationId } = useParams();
  const isActive           = conversationId === conv.id;

  const displayName = conv.other_first_name
    ? `${conv.other_first_name} ${conv.other_last_name || ''}`.trim()
    : (conv.name || 'Direct Message');
  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const unread   = Number(conv.unread_count || 0);

  return (
    <Link
      to={`/chat/${conv.id}`}
      id={`conv-item-${conv.id}`}
      className={`chat-conv-item ${isActive ? 'active' : ''}`}
    >
      <div className="chat-avatar chat-avatar-md">
        {conv.other_avatar_url
          ? <img src={conv.other_avatar_url} alt="" referrerPolicy="no-referrer" />
          : <span>{initials}</span>}
      </div>
      <div className="chat-conv-meta">
        <p className="chat-conv-name">{displayName}</p>
        {conv.last_message && <p className="chat-conv-preview">{conv.last_message}</p>}
      </div>
      {unread > 0 && (
        <span className="chat-unread-badge">{unread > 99 ? '99+' : unread}</span>
      )}
    </Link>
  );
}

// ─── ConversationList (Sidebar) ────────────────────────────────────────────────
function ConversationList({ conversations, loading, onStartChat, onRequestAccepted }) {
  const { conversationId } = useParams();

  return (
    <aside className={`chat-sidebar ${conversationId ? 'chat-sidebar--hidden-mobile' : ''}`}>
      <div className="chat-sidebar-header">
        <h2 className="chat-sidebar-title">Messages</h2>
        <button id="chat-new-btn" className="chat-new-btn" title="New direct message" onClick={() => {}}>
          <Plus size={16} />
        </button>
      </div>

      <UserSearch onStartChat={onStartChat} />

      <div className="chat-conv-list">
        {/* ── Pending Requests Section ── */}
        <RequestsSection onRequestAccepted={onRequestAccepted} />

        {loading && (
          <div className="chat-conv-skeleton-list">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="chat-conv-skeleton">
                <div className="skeleton chat-skeleton-avatar" />
                <div className="chat-skeleton-lines">
                  <div className="skeleton chat-skeleton-name" />
                  <div className="skeleton chat-skeleton-sub" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="chat-empty-state">
            <MessageSquare size={32} className="chat-empty-icon" />
            <p>No conversations yet.</p>
            <p className="chat-empty-sub">Connect with a student above to start messaging.</p>
          </div>
        )}
        {!loading && conversations.map((conv) => (
          <ConversationItem key={conv.id} conv={conv} />
        ))}
      </div>
    </aside>
  );
}

// ─── EmptyWindow ───────────────────────────────────────────────────────────────
function EmptyWindow() {
  return (
    <div className="chat-window-empty">
      <MessageSquare size={48} className="chat-empty-icon" />
      <h3>Select a conversation</h3>
      <p>Choose a chat from the list or connect with a student to get started.</p>
    </div>
  );
}

// ─── ChatLayout (Root Page) ────────────────────────────────────────────────────
export default function ChatLayout() {
  const navigate          = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.data || []);
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Standard: open/create a chat with a connected user from search results
  const handleStartChat = useCallback(async (targetUser) => {
    try {
      const res  = await api.post('/chat/conversations/direct', { targetUserId: targetUser.id });
      const conv = res.data.data;
      setConversations(prev =>
        prev.some(c => c.id === conv.id) ? prev : [conv, ...prev]
      );
      navigate(`/chat/${conv.id}`);
    } catch { /* TODO: surface toast */ }
  }, [navigate]);

  // Called by RequestsSection after a connection request is accepted.
  // Optimistically creates/fetches the now-unlocked direct conversation
  // and prepends it to the sidebar list.
  const handleRequestAccepted = useCallback(async (request) => {
    try {
      const res  = await api.post('/chat/conversations/direct', { targetUserId: request.requester_id });
      const conv = res.data.data;
      setConversations(prev => {
        const without = prev.filter(c => c.id !== conv.id);
        return [conv, ...without];
      });
      navigate(`/chat/${conv.id}`);
    } catch { /* Conversation will appear on next refresh */ }
  }, [navigate]);

  return (
    <div className="chat-layout">
      <ConversationList
        conversations={conversations}
        loading={loading}
        onStartChat={handleStartChat}
        onRequestAccepted={handleRequestAccepted}
      />

      <div className="chat-main">
        <Routes>
          <Route index element={<EmptyWindow />} />
          <Route path=":conversationId" element={<ChatWindow />} />
        </Routes>
      </div>
    </div>
  );
}
