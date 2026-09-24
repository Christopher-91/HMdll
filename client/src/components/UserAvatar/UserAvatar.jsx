import { useState } from 'react';
import './UserAvatar.css';

/**
 * Deterministic color from a string (user id or name)
 */
export function getAvatarColor(seed = '') {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
    '#f97316', '#a855f7',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * UserAvatar — centralized avatar component used in Navbar, Profile, and Reviews.
 *
 * Props:
 *   user         — { firstName, lastName, avatarUrl, authProvider, id }
 *   size         — number (px), default 36
 *   className    — extra class names
 *   showBadge    — show OAuth provider badge dot
 */
export default function UserAvatar({ user, size = 36, className = '', showBadge = false }) {
  const [imgError, setImgError] = useState(false);

  if (!user) return null;

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  const bgColor = getAvatarColor(user.id || user.email || initials);
  const isGoogle = user.authProvider === 'google';
  const isApple = user.authProvider === 'apple';

  const hasPhoto = user.avatarUrl && !imgError;

  const avatarStyle = {
    width: size,
    height: size,
    minWidth: size,
    fontSize: size * 0.38,
    lineHeight: `${size}px`,
  };

  return (
    <span className={`user-avatar-wrapper ${className}`} style={{ position: 'relative', display: 'inline-flex' }}>
      {hasPhoto ? (
        <img
          src={user.avatarUrl}
          alt={`${user.firstName} ${user.lastName}`}
          referrerPolicy="no-referrer"
          className="user-avatar user-avatar--photo"
          style={avatarStyle}
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className="user-avatar user-avatar--initials"
          style={{ ...avatarStyle, background: bgColor }}
          aria-label={`${user.firstName} ${user.lastName}`}
        >
          {initials}
        </span>
      )}

      {showBadge && (isGoogle || isApple) && (
        <span className="user-avatar__badge" aria-label={isGoogle ? 'Google account' : 'Apple account'}>
          {isGoogle ? (
            <svg viewBox="0 0 24 24" width="10" height="10">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="10" height="10" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.36.75 3.18.75.78 0 2.26-.93 3.81-.79 1.68.14 2.94.73 3.72 1.95-3.29 2.04-2.72 6.55.67 8.17-.75 1.61-1.45 3.05-3.38 2.8zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          )}
        </span>
      )}
    </span>
  );
}
