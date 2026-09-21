import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar/UserAvatar';
import { Landmark, BookOpen, Globe2, Award, Briefcase, Calculator, Plane, MessageSquare } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    const handleScroll = () => {
      // Toggle logo color after scrolling past the dark hero gradient (~400px)
      setIsScrolled(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position
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
  // On /chat routes, suppress the navbar gradient/blur overlay — it bleeds into the fixed chat layout
  const isChat = location.pathname.startsWith('/chat');

  return (
    <>
      {/* Top Header */}
      <nav className={`navbar-top ${!isLandingTop && !isChat ? 'with-blur' : ''}`}>
        <div className="navbar-inner container">
          <Link to="/" className="navbar-logo">
            <span className={`logo-text ${isLandingTop ? 'landing-override' : ''}`}>HMdll<span className="blinking-dot"></span></span>
          </Link>

          <div className="navbar-actions">
            <div className="theme-toggle" role="group" aria-label="Color theme">
              <button
                type="button"
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
                aria-label="Use light theme"
              >
                {theme === 'light' && (
                  <motion.div
                    layoutId="theme-pill"
                    className="theme-active-bg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
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
                {theme === 'dark' && (
                  <motion.div
                    layoutId="theme-pill"
                    className="theme-active-bg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
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

      {/* Floating Fluid Glass Navigation */}
      <div className={`floating-nav-container ${isLandingTop ? 'nav-landing-override' : ''}`}>
        <nav className="fluid-glass-nav">
          {mainNavLinks.map((link) => {
            const active = link.isSubMenuTrigger ? isSubNavOpen : isActive(link.path);
            const Icon = link.icon;
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`fluid-nav-item ${active ? 'active' : ''}`}
              >
                {active && (
                  <motion.div
                    layoutId="active-pill"
                    className="fluid-active-bg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="fluid-nav-content">
                  <Icon className="fluid-nav-icon" size={18} strokeWidth={active ? 2.5 : 2} />
                  <span className="fluid-nav-label">{link.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <AnimatePresence>
          {isSubNavOpen && (
            <motion.nav 
              className="fluid-glass-nav sub-nav"
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {subNavLinks.map((link) => {
                const active = isActive(link.path);
                const Icon = link.icon;
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`fluid-nav-item ${active ? 'active' : ''}`}
                  >
                    {active && (
                      <motion.div
                        layoutId="sub-active-pill"
                        className="fluid-active-bg"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="fluid-nav-content">
                      <Icon className="fluid-nav-icon" size={18} strokeWidth={active ? 2.5 : 2} />
                      <span className="fluid-nav-label">{link.label}</span>
                    </span>
                  </Link>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
