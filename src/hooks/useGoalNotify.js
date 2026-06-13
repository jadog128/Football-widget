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

function sendToast(toastData) {
  // Send to the floating toast window via IPC
  window.electronAPI?.showToast?.({ id: Date.now(), ...toastData });
}

export function useGoalNotify() {
  const matches = useWidgetStore((s) => s.matches);
  const customTheme = useWidgetStore((s) => s.customTheme);
  const prevRef = useRef(new Map());

  const soundEnabled = customTheme?.soundEnabled !== false;
  const volume = customTheme?.volume ?? 0.5;
  const speechEnabled = !!customTheme?.speechEnabled;

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

      // ── Kick off ─────────────────────────────────────────────────────────
      if (p.status === "scheduled" && m.status === "live") {
        if (soundEnabled) playSound("whistle", volume);
        if (speechEnabled) {
          speakEvent(
            `Kick off! ${m.homeTeam.name} versus ${m.awayTeam.name}`,
            volume,
          );
        }

        sendToast({
          type: "kickoff",
          scoringTeam: m.homeTeam.name,
          opponent: m.awayTeam.name,
          homeScore,
          awayScore,
          competition:
            m.competition?.shortName || m.competition?.name || "Match",
          status: "live",
          teamColor: "#52B788",
        });
        continue;
      }

      // ── Goals ─────────────────────────────────────────────────────────────
      if (m.status === "live") {
        if (homeScore > p.home) {
          const scorer = m.scorers
            ?.filter((s) => s.team === "home")
            .slice(-1)[0];

          if (soundEnabled) playSound("fanfare", volume);
          if (speechEnabled) {
            speakEvent(
              `Goal for ${m.homeTeam.name}! ${
                scorer ? scorer.name : ""
              }. The score is now ${m.homeTeam.name} ${homeScore}, ${m.awayTeam.name} ${awayScore}`,
              volume,
            );
          }

          sendToast({
            type: "goal",
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
          });
        }

        if (awayScore > p.away) {
          const scorer = m.scorers
            ?.filter((s) => s.team === "away")
            .slice(-1)[0];

          if (soundEnabled) playSound("fanfare", volume);
          if (speechEnabled) {
            speakEvent(
              `Goal for ${m.awayTeam.name}! ${
                scorer ? scorer.name : ""
              }. The score is now ${m.homeTeam.name} ${homeScore}, ${m.awayTeam.name} ${awayScore}`,
              volume,
            );
          }

          sendToast({
            type: "goal",
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
          });
        }
      }

      // ── Full time ─────────────────────────────────────────────────────────
      if (p.status === "live" && m.status === "finished") {
        if (soundEnabled) playSound("fulltime", volume);
        if (speechEnabled) {
          speakEvent(
            `Full time! Final score: ${m.homeTeam.name} ${homeScore}, ${m.awayTeam.name} ${awayScore}`,
            volume,
          );
        }

        sendToast({
          type: "fulltime",
          scoringTeam: m.homeTeam.name,
          opponent: m.awayTeam.name,
          homeScore,
          awayScore,
          competition:
            m.competition?.shortName || m.competition?.name || "Match",
          status: "finished",
          teamColor: "#A0886B",
        });
      }
    }

    prevRef.current = next;
  }, [matches, soundEnabled, volume, speechEnabled, favTeams]);
}
