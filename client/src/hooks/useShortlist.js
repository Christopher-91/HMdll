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

  // Sync across tabs and within the same tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setShortlist(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    const onLocalChange = () => {
      setShortlist(getStoredShortlist());
    };
    
    window.addEventListener('storage', onStorage);
    window.addEventListener('shortlist-updated', onLocalChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('shortlist-updated', onLocalChange);
    };
  }, []);

  const toggle = useCallback((universityId) => {
    setShortlist((prev) => {
      const newList = prev.includes(universityId)
        ? prev.filter((id) => id !== universityId)
        : [...prev, universityId];
      // Note: the other useEffect saves this to localStorage, but since it's asynchronous,
      // we need to save it directly here before dispatching the event so other listeners get the latest data.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      window.dispatchEvent(new Event('shortlist-updated'));
      return newList;
    });
  }, []);

  const isShortlisted = useCallback(
    (universityId) => shortlist.includes(universityId),
    [shortlist]
  );

  return { shortlist, toggle, isShortlisted, count: shortlist.length };
}
