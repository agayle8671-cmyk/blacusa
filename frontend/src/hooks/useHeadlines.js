/**
 * useHeadlines — fetches live news headlines from /api/headlines.
 *
 * Called fresh on every page load so the user always sees the latest
 * headlines. If the backend cache is stale it triggers a background
 * re-scrape automatically (handled server-side).
 *
 * Returns:
 *   headlines  — object keyed by slug, each entry has:
 *                { outlet, headline, relative_time, url, keyword_matched }
 *   loading    — true while the first fetch is in-flight
 *   error      — string or null
 *   lastUpdated — ISO string from the server
 *   refresh    — callable to manually force a re-fetch
 */

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const HEADLINES_URL = `${BACKEND_URL}/api/headlines`;
const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes client-side re-fetch

export function useHeadlines() {
  const [headlines, setHeadlines] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const fetchHeadlines = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(HEADLINES_URL, {
        // Cache-busting param forces fresh fetch every time
        params: { _t: Date.now() },
      });
      if (data && data.headlines) {
        setHeadlines(data.headlines);
        setLastUpdated(data.last_updated || null);
      }
    } catch (err) {
      setError("Could not load headlines. Retrying soon.");
      console.warn("[useHeadlines] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount (every page load)
  useEffect(() => {
    fetchHeadlines();

    // Schedule periodic re-fetch
    timerRef.current = setInterval(() => {
      fetchHeadlines(true /* silent */);
    }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchHeadlines]);

  return {
    headlines,
    loading,
    error,
    lastUpdated,
    refresh: () => fetchHeadlines(),
  };
}
