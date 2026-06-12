/**
 * useFootballData — fetches { upcoming, recent } and keeps them in sync.
 *
 * Polling interval adapts automatically:
 *   45 s  — live match in progress
 *   2 min — kick-off within 30 minutes
 *   5 min — idle
 */

import { useEffect, useCallback, useRef } from "react";
import { useWidgetStore } from "../store/widgetStore";
import { fetchMatches } from "../services/footballApi";

const INTERVAL_LIVE = 45_000;
const INTERVAL_SOON = 120_000;
const INTERVAL_NORMAL = 300_000;

function getInterval(matches) {
  if (!matches?.length) return INTERVAL_NORMAL;
  if (matches.some((m) => m.status === "live")) return INTERVAL_LIVE;
  const now = Date.now();
  const next = matches.find(
    (m) => m.status === "scheduled" && new Date(m.kickoff) > now,
  );
  if (next && (new Date(next.kickoff) - now) / 60_000 <= 30)
    return INTERVAL_SOON;
  return INTERVAL_NORMAL;
}

export function useFootballData() {
  const setMatches = useWidgetStore((s) => s.setMatches);
  const setRecentMatches = useWidgetStore((s) => s.setRecentMatches);
  const setLoading = useWidgetStore((s) => s.setLoading);
  const setError = useWidgetStore((s) => s.setError);
  const syncViewMode = useWidgetStore((s) => s.syncViewMode);
  const matches = useWidgetStore((s) => s.matches);

  const matchesRef = useRef(matches);
  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  const timerRef = useRef(null);

  const scheduleNext = useCallback((upcoming) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => load(), getInterval(upcoming));
  }, []); // eslint-disable-line

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { upcoming, recent } = await fetchMatches();
      setMatches(upcoming);
      setRecentMatches(recent);
      scheduleNext(upcoming);
    } catch (err) {
      console.error("[useFootballData]", err);
      setError(err?.message ?? "Failed to load fixtures");
      scheduleNext(matchesRef.current);
    } finally {
      setLoading(false);
    }
  }, [setMatches, setRecentMatches, setLoading, setError, scheduleNext]);

  useEffect(() => {
    load();
    window.electronAPI?.onWindowModeChanged?.(syncViewMode);
    return () => {
      clearTimeout(timerRef.current);
      window.electronAPI?.removeAllListeners?.("window-mode-changed");
    };
  }, [load, syncViewMode]);

  return { refresh: load };
}
