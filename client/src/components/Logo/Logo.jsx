import { useState } from 'react';

export default function Logo({ website, name, slug, size = 48, logoUrl }) {
  const [errorLevel, setErrorLevel] = useState(0);
  
  const Placeholder = () => (
    <span 
      className="uni-logo-placeholder" 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: size * 0.4,
        background: 'var(--primary-50, #eef2ff)',
        color: 'var(--primary-700, #4338ca)',
        fontWeight: 'bold',
        borderRadius: 'var(--radius-md, 6px)'
      }}
    >
      {name && typeof name === 'string' && name.trim().length > 0 ? name.trim()[0].toUpperCase() : 'U'}
    </span>
  );

  // Level 0: Provided Database URL
  if (errorLevel === 0 && logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt={name} 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={() => setErrorLevel(1)}
      />
    );
  }

  let hostname = '';
  try {
    if (website) hostname = new URL(website).hostname.replace('www.', '');
  } catch (e) {
    // Ignore error
  }

  // Level 1: Local Slug
  if (errorLevel <= 1 && slug) {
    return (
      <img 
        src={`/logos/${slug}.png`} 
        alt={name} 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={() => setErrorLevel(2)}
      />
    );
  }

  // Level 2: Icon Horse Fallback (Faster than Clearbit)
  if (errorLevel <= 2 && hostname) {
    return (
      <img 
        src={`https://icon.horse/icon/${hostname}`} 
        alt={name} 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={() => setErrorLevel(3)}
      />
    );
  }

  return <Placeholder />;
}
