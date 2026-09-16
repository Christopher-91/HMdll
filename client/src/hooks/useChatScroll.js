import { useRef, useCallback, useEffect } from 'react';

/**
 * useChatScroll
 *
 * Manages all scroll physics for the message list:
 *   1. Smart auto-scroll  — only scrolls to bottom if the user is already near it.
 *   2. New-message badge  — signals the parent to show a "New messages ↓" badge
 *      instead of yanking the viewport when the user has scrolled up.
 *   3. Cursor pagination  — calls `onLoadMore` (via IntersectionObserver at the top
 *      sentinel) and then restores the scroll position so prepended messages don't jump.
 *
 * @param {Object}   options
 * @param {number}   options.messageCount   - Total messages currently rendered.
 * @param {Function} options.onLoadMore     - Async callback to fetch older messages.
 * @param {Function} options.setShowBadge  - Setter for the "New messages ↓" badge boolean.
 *
 * @returns {{ scrollRef, topSentinelRef, scrollToBottom }}
 */
export function useChatScroll({ messageCount, onLoadMore, setShowBadge }) {
  const scrollRef = useRef(null);       // The scrollable message container
  const topSentinelRef = useRef(null);  // Invisible div at the very top of the list
  const isNearBottom = useRef(true);    // Tracks whether the user is near the bottom
  const isLoadingMore = useRef(false);  // Guard against duplicate IntersectionObserver triggers
  const prevScrollHeight = useRef(0);   // Captured before prepending — used to restore position

  // ─── Helper: scroll to the very bottom ───────────────────────────────────
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // ─── Track whether the user is near the bottom ───────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      // "Near bottom" threshold: 100px
      const nearBottom = distanceFromBottom <= 100;
      isNearBottom.current = nearBottom;
      // If user manually scrolls back to the bottom, dismiss the badge
      if (nearBottom) setShowBadge(false);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [setShowBadge]);

  // ─── React to new messages ────────────────────────────────────────────────
  useEffect(() => {
    if (isNearBottom.current) {
      scrollToBottom();
      setShowBadge(false);
    } else {
      // User has scrolled up — show the badge instead of force-scrolling
      setShowBadge(true);
    }
    // We intentionally only depend on messageCount, not on the full messages array
    // to avoid re-running when the array reference changes but count stays the same.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount]);

  // ─── IntersectionObserver: upward infinite scroll ────────────────────────
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !onLoadMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || isLoadingMore.current) return;

        const el = scrollRef.current;
        if (!el) return;

        isLoadingMore.current = true;

        // Capture height BEFORE the DOM changes
        prevScrollHeight.current = el.scrollHeight;

        await onLoadMore();

        // After React re-renders with new messages, restore scroll position
        // so the user's viewport doesn't jump up to the newly prepended content.
        requestAnimationFrame(() => {
          if (!el) return;
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = newScrollHeight - prevScrollHeight.current;
          isLoadingMore.current = false;
        });
      },
      { root: scrollRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore]);

  return { scrollRef, topSentinelRef, scrollToBottom };
}
