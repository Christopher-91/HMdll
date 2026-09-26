import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar/UserAvatar';
import { Landmark, BookOpen, Globe2, Award, Briefcase, Calculator, Plane, MessageSquare, Bell } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('hmdll-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('hmdll-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setProfileOpen(false);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const mainNavLinks = [
    { path: '/universities', label: 'Universities', icon: Landmark, isSubMenuTrigger: true },
    { path: '/countries', label: 'Countries', icon: Globe2 },
    { path: '/immigration', label: 'Immigration', icon: Plane },
    { path: '/careers', label: 'Careers', icon: Briefcase },
    { path: '/calculator', label: 'Calculator', icon: Calculator },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
  ];

  const subNavLinks = [
    { path: '/universities', label: 'Universities', icon: Landmark },
    { path: '/programs', label: 'Programs', icon: BookOpen },
    { path: '/scholarships', label: 'Scholarships', icon: Award },
  ];

  const isSubNavOpen = subNavLinks.some(link => isActive(link.path));
  const isLandingTop = location.pathname === '/' && !isScrolled;
  const isChat = location.pathname.startsWith('/chat');

  return (
    <>
      {/* Primary Navbar — Full-width anchored top bar */}
      <nav className={`navbar-top ${isLandingTop ? 'navbar-landing' : ''}`}>
        <div className="navbar-inner container">
          <Link to="/" className="navbar-logo">
            <span className="logo-text">HMdll<span className="blinking-dot"></span></span>
          </Link>

          {/* Main Navigation — Horizontal inline text links */}
          <div className="navbar-links">
            {mainNavLinks.map((link) => {
              const active = link.isSubMenuTrigger ? isSubNavOpen : isActive(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`navbar-link ${active ? 'active' : ''}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="navbar-actions">
            <div className="notification-wrapper" ref={notificationRef}>
              <button
                className="notification-bell"
                onClick={() => setNotificationOpen(!notificationOpen)}
                aria-label="Notifications"
              >
                <Bell size={20} strokeWidth={1.8} />
                <span className="notification-dot"></span>
              </button>

              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="notification-dropdown"
                  >
                    <h4 className="notification-heading">Zero Spam Guarantee</h4>
                    <p className="notification-body">
                      Unlike traditional study-abroad agencies, HMdll guarantees a call/spam-free research experience. We never share your contact information with consultants or third-party websites for that matter. Explore global universities with complete privacy and zero unsolicited calls.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="theme-toggle" role="group" aria-label="Color theme">
              <div
                className="theme-active-bg"
                style={{ left: theme === 'light' ? 3 : 37 }}
              />
              <button
                type="button"
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
                aria-label="Use light theme"
              >
                <span className="theme-icon-wrapper">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                </span>
              </button>
              <button
                type="button"
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
                aria-label="Use dark theme"
              >
                <span className="theme-icon-wrapper">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.4 14.8A8.5 8.5 0 0 1 9.2 3.6 8.5 8.5 0 1 0 20.4 14.8Z" />
                  </svg>
                </span>
              </button>
            </div>

            {isAuthenticated ? (
              <div className="profile-menu-wrapper">
                <button
                  className="profile-trigger"
                  onClick={() => setProfileOpen(!profileOpen)}
                  onBlur={() => setTimeout(() => setProfileOpen(false), 200)}
                  style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%' }}
                >
                  <UserAvatar user={user} size={36} showBadge />
                </button>

                {profileOpen && (
                  <div className="profile-dropdown animate-fadeIn">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{user?.firstName} {user?.lastName}</p>
                      <p className="dropdown-email">{user?.email}</p>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setProfileOpen(false)}>Dashboard</Link>
                    <Link to="/planner" className="dropdown-item" onClick={() => setProfileOpen(false)}>Planner</Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>Profile</Link>
                    <Link to="/applications" className="dropdown-item" onClick={() => setProfileOpen(false)}>Applications</Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="dropdown-item" onClick={() => setProfileOpen(false)}>Admin</Link>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/register" className="btn btn-ghost">Register</Link>
                <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sub-navigation — flat horizontal tabs below primary navbar */}
      <AnimatePresence>
        {isSubNavOpen && !isChat && (
          <motion.div
            className="sub-nav-bar"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="sub-nav-inner container">
              {subNavLinks.map((link) => {
                const active = isActive(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`sub-nav-link ${active ? 'active' : ''}`}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
