import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hmdll-shortlist';

function getStoredShortlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Custom hook to manage a university shortlist backed by localStorage.
 * Returns the shortlist array and helper functions to toggle / query items.
 */
export default function useShortlist() {
  const [shortlist, setShortlist] = useState(getStoredShortlist);

  // Persist to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortlist));
  }, [shortlist]);

  // Sync across tabs (optional but nice)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setShortlist(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((universityId) => {
    setShortlist((prev) =>
      prev.includes(universityId)
        ? prev.filter((id) => id !== universityId)
        : [...prev, universityId]
    );
  }, []);

  const isShortlisted = useCallback(
    (universityId) => shortlist.includes(universityId),
    [shortlist]
  );

  return { shortlist, toggle, isShortlisted, count: shortlist.length };
}
