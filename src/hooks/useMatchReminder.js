/**
 * useMatchReminder — Lets users set reminders for upcoming matches.
 * Fires a notification 15 minutes before kickoff.
 * Reminders persist in customTheme.
 */

import { useEffect, useRef, useCallback } from "react";
import { useWidgetStore } from "../store/widgetStore";

const REMINDER_ADVANCE_MS = 15 * 60 * 1000; // 15 minutes

function notify(title, body) {
  if (window.electronAPI?.showNotification) {
    window.electronAPI.showNotification(title, body);
  } else if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  } else if ("Notification" in window && Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification(title, { body });
    });
  }
}

export function useMatchReminder() {
  const matches = useWidgetStore((s) => s.matches);
  const customTheme = useWidgetStore((s) => s.customTheme);
  const setCustomTheme = useWidgetStore((s) => s.setCustomTheme);
  const timersRef = useRef({});

  const reminders = customTheme?.reminders || {};

  const setReminder = useCallback(
    (matchId) => {
      const match = matches.find((m) => m.id === matchId);
      if (!match || match.status !== "scheduled") return;
      setCustomTheme({
        reminders: { ...reminders, [matchId]: true },
      });
    },
    [matches, reminders, setCustomTheme],
  );

  const clearReminder = useCallback(
    (matchId) => {
      const next = { ...reminders };
      delete next[matchId];
      setCustomTheme({ reminders: next });
    },
    [reminders, setCustomTheme],
  );

  useEffect(() => {
    // Clear any timers for removed matches or expired reminders
    const activeIds = new Set(
      matches.filter((m) => m.status === "scheduled").map((m) => m.id),
    );

    Object.keys(timersRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    });

    // Set timers for each reminder
    matches.forEach((match) => {
      if (
        match.status !== "scheduled" ||
        !reminders[match.id] ||
        timersRef.current[match.id]
      )
        return;

      const kickoff = new Date(match.kickoff).getTime();
      const now = Date.now();
      const msUntilKickoff = kickoff - now;

      if (msUntilKickoff <= 0) {
        // Match already started or passed, clear reminder
        clearReminder(match.id);
        return;
      }

      if (msUntilKickoff <= REMINDER_ADVANCE_MS) {
        // Within 15 minutes — fire now
        notify(
          `🟢 Kickoff in under 15 minutes!`,
          `${match.homeTeam.name} vs ${match.awayTeam.name} — ${match.competition?.name || ""}`,
        );
        clearReminder(match.id);
        return;
      }

      // Set timer for (kickoff - 15 min - now)
      const delay = msUntilKickoff - REMINDER_ADVANCE_MS;
      timersRef.current[match.id] = setTimeout(() => {
        notify(
          `🟢 Match starting soon!`,
          `${match.homeTeam.name} vs ${match.awayTeam.name} — ${match.competition?.name || ""}`,
        );
        clearReminder(match.id);
        delete timersRef.current[match.id];
      }, delay);
    });

    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, [matches, reminders, clearReminder]);

  return { reminders, setReminder, clearReminder };
}
