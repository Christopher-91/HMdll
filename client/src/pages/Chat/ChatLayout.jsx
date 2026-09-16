import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';
import { Search, MessageSquare, ArrowLeft, X, Plus } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';
import './Chat.css';

// ─── UserSearch ────────────────────────────────────────────────────────────────
function UserSearch({ onStartChat }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(val)}`);
        setResults(res.data.data || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      }
    }, 350); // 350ms debounce
  };

  const handleSelect = (user) => {
    onStartChat(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
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
          <button className="chat-search-clear" onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}>
            <X size={13} />
          </button>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <ul className="chat-search-results" role="listbox">
          {results.map((u) => (
            <li
              key={u.id}
              role="option"
              className="chat-search-result-item"
              onMouseDown={() => handleSelect(u)}
            >
              <div className="chat-avatar chat-avatar-sm">
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" />
                  : <span>{u.first_name?.[0]}{u.last_name?.[0]}</span>}
              </div>
              <div>
                <p className="chat-result-name">{u.first_name} {u.last_name}</p>
                {u.username && <p className="chat-result-handle">@{u.username}</p>}
              </div>
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

// ─── ConversationItem ──────────────────────────────────────────────────────────
function ConversationItem({ conv, isActive }) {
  const { conversationId } = useParams();
  const displayName = conv.name || 'Direct Message';
  const unread = Number(conv.unread_count || 0);

  return (
    <Link
      to={`/chat/${conv.id}`}
      id={`conv-item-${conv.id}`}
      className={`chat-conv-item ${isActive || conversationId === conv.id ? 'active' : ''}`}
    >
      <div className="chat-avatar chat-avatar-md">
        <span>{displayName[0]}</span>
      </div>
      <div className="chat-conv-meta">
        <p className="chat-conv-name">{displayName}</p>
      </div>
      {unread > 0 && (
        <span className="chat-unread-badge">{unread > 99 ? '99+' : unread}</span>
      )}
    </Link>
  );
}

// ─── ConversationList (Sidebar) ────────────────────────────────────────────────
function ConversationList({ conversations, loading, onStartChat }) {
  const { conversationId } = useParams();

  return (
    <aside className={`chat-sidebar ${conversationId ? 'chat-sidebar--hidden-mobile' : ''}`}>
      <div className="chat-sidebar-header">
        <h2 className="chat-sidebar-title">Messages</h2>
        <button
          id="chat-new-btn"
          className="chat-new-btn"
          title="New direct message"
          onClick={() => {}}
        >
          <Plus size={16} />
        </button>
      </div>

      <UserSearch onStartChat={onStartChat} />

      <div className="chat-conv-list">
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
            <p className="chat-empty-sub">Search for a student above to start chatting.</p>
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
      <p>Choose a chat from the list or search for a student to get started.</p>
    </div>
  );
}

// ─── ChatLayout (Root Page) ────────────────────────────────────────────────────
export default function ChatLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.data || []);
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Start a DIRECT conversation with a searched user
  const handleStartChat = useCallback(async (targetUser) => {
    try {
      const res = await api.post('/chat/conversations/direct', { targetUserId: targetUser.id });
      const conv = res.data.data;
      // Ensure conversation appears in the list
      setConversations((prev) =>
        prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]
      );
      navigate(`/chat/${conv.id}`);
    } catch {
      // TODO: surface error toast
    }
  }, [navigate]);

  return (
    // The page fills the screen below the fixed Navbar (64px top header + ~76px floating nav)
    <div className="chat-layout">
      <ConversationList
        conversations={conversations}
        loading={loading}
        onStartChat={handleStartChat}
      />

      {/* Right pane — child routes render here */}
      <div className="chat-main">
        <Routes>
          {/* /chat — desktop shows empty state; mobile already shows the sidebar */}
          <Route index element={<EmptyWindow />} />
          {/* /chat/:conversationId — rendered by ChatWindow (Phase 3b) */}
          <Route
            path=":conversationId"
            element={<ChatWindow />}
          />
        </Routes>
      </div>
    </div>
  );
}
