/**
 * useGoalNotify — watches the match list for state changes and fires
 * native system notifications via the Electron main process, plus
 * beautiful in-widget toast notifications for followed-team goals.
 *
 * Events detected:
 *   • Match kicks off (scheduled → live)
 *   • Goal scored (score increases) — custom toast if followed team
 *   • Full-time (live → finished)
 */

import { useEffect, useRef } from "react";
import { useWidgetStore } from "../store/widgetStore";
import { playSound } from "../utils/audioService";
import { speakEvent } from "../utils/textToSpeech";

function isFavouriteTeam(teamName, favTeams) {
  if (!favTeams || favTeams.length === 0) return false;
  const lower = teamName.toLowerCase();
  return favTeams.some((t) => lower.includes(t.toLowerCase()));
}

function notify(title, body) {
  // Try Electron native notification first
  if (window.electronAPI?.showNotification) {
    window.electronAPI.showNotification(title, body);
  }
  // Fallback: HTML5 Notification API (works in packaged apps)
  if (typeof Notification !== "undefined") {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }
}

export function useGoalNotify() {
  const matches = useWidgetStore((s) => s.matches);
  const customTheme = useWidgetStore((s) => s.customTheme);
  const addNotification = useWidgetStore((s) => s.addNotification);
  const prevRef = useRef(new Map());

  const soundEnabled = customTheme?.soundEnabled !== false;
  const volume = customTheme?.volume ?? 0.5;
  const speechEnabled = !!customTheme?.speechEnabled;
  const favTeams = customTheme?.favoriteTeams || [];

  useEffect(() => {
    const prev = prevRef.current;
    const next = new Map();

    for (const m of matches) {
      const homeScore = m.score?.home ?? 0;
      const awayScore = m.score?.away ?? 0;
      next.set(m.id, {
        status: m.status,
        home: homeScore,
        away: awayScore,
      });

      const p = prev.get(m.id);
      if (!p) continue; // first time seeing this match

      const homeIsFav = isFavouriteTeam(m.homeTeam.name, favTeams);
      const awayIsFav = isFavouriteTeam(m.awayTeam.name, favTeams);

      // ── Kick off ─────────────────────────────────────────────────────────
      if (p.status === "scheduled" && m.status === "live") {
        notify(`🟢 Kick off!`, `${m.homeTeam.name} vs ${m.awayTeam.name}`);
        if (soundEnabled) playSound("whistle", volume);
        if (speechEnabled) {
          speakEvent(
            `Kick off! ${m.homeTeam.name} versus ${m.awayTeam.name}`,
            volume,
          );
        }

        // Toast for followed team kickoff
        if (homeIsFav || awayIsFav) {
          addNotification({
            scoringTeam: homeIsFav ? m.homeTeam.name : m.awayTeam.name,
            opponent: homeIsFav ? m.awayTeam.name : m.homeTeam.name,
            homeScore,
            awayScore,
            scorer: null,
            minute: "0",
            competition:
              m.competition?.shortName || m.competition?.name || "Match",
            status: "live",
            teamColor: "#52B788",
            type: "kickoff",
          });
        }
        continue;
      }

      // ── Goals ─────────────────────────────────────────────────────────────
      if (m.status === "live") {
        if (homeScore > p.home) {
          const scorer = m.scorers
            ?.filter((s) => s.team === "home")
            .slice(-1)[0];
          const bodyText = scorer
            ? `${scorer.name} ${scorer.minute}' — ${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`
            : `${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`;

          notify(`⚽  GOAL!  ${m.homeTeam.name}`, bodyText);
          if (soundEnabled) playSound("fanfare", volume);
          if (speechEnabled) {
            speakEvent(
              `Goal for ${m.homeTeam.name}! ${
                scorer ? scorer.name : ""
              }. The score is now ${m.homeTeam.name} ${homeScore}, ${m.awayTeam.name} ${awayScore}`,
              volume,
            );
          }

          // Beautiful in-widget toast for followed team goals
          if (homeIsFav) {
            addNotification({
              scoringTeam: m.homeTeam.name,
              opponent: m.awayTeam.name,
              homeScore,
              awayScore,
              scorer: scorer?.name || null,
              minute: scorer?.minute || "?",
              competition:
                m.competition?.shortName || m.competition?.name || "Match",
              status: "live",
              teamColor: "#52B788",
              type: "goal",
            });
          }
        }

        if (awayScore > p.away) {
          const scorer = m.scorers
            ?.filter((s) => s.team === "away")
            .slice(-1)[0];
          const bodyText = scorer
            ? `${scorer.name} ${scorer.minute}' — ${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`
            : `${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`;

          notify(`⚽  GOAL!  ${m.awayTeam.name}`, bodyText);
          if (soundEnabled) playSound("fanfare", volume);
          if (speechEnabled) {
            speakEvent(
              `Goal for ${m.awayTeam.name}! ${
                scorer ? scorer.name : ""
              }. The score is now ${m.homeTeam.name} ${homeScore}, ${m.awayTeam.name} ${awayScore}`,
              volume,
            );
          }

          // Beautiful in-widget toast for followed team goals
          if (awayIsFav) {
            addNotification({
              scoringTeam: m.awayTeam.name,
              opponent: m.homeTeam.name,
              homeScore,
              awayScore,
              scorer: scorer?.name || null,
              minute: scorer?.minute || "?",
              competition:
                m.competition?.shortName || m.competition?.name || "Match",
              status: "live",
              teamColor: "#E05353",
              type: "goal",
            });
          }
        }
      }

      // ── Full time ─────────────────────────────────────────────────────────
      if (p.status === "live" && m.status === "finished") {
        notify(
          `🏁  Full Time`,
          `${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`,
        );
        if (soundEnabled) playSound("fulltime", volume);
        if (speechEnabled) {
          speakEvent(
            `Full time! Final score: ${m.homeTeam.name} ${homeScore}, ${m.awayTeam.name} ${awayScore}`,
            volume,
          );
        }

        // Toast for followed team result
        if (homeIsFav || awayIsFav) {
          addNotification({
            scoringTeam: homeIsFav ? m.homeTeam.name : m.awayTeam.name,
            opponent: homeIsFav ? m.awayTeam.name : m.homeTeam.name,
            homeScore,
            awayScore,
            scorer: null,
            minute: "FT",
            competition:
              m.competition?.shortName || m.competition?.name || "Match",
            status: "finished",
            teamColor: "#A0886B",
            type: "fulltime",
          });
        }
      }
    }

    prevRef.current = next;
  }, [matches, soundEnabled, volume, speechEnabled, favTeams, addNotification]);
}
