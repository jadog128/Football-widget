/**
 * useGoalNotify — watches the match list for state changes and fires
 * native system notifications via the Electron main process.
 *
 * Events detected:
 *   • Match kicks off (scheduled → live)
 *   • Goal scored (score increases)
 *   • Full-time (live → finished)
 */

import { useEffect, useRef } from 'react'
import { useWidgetStore }    from '../store/widgetStore'
import { playSound }         from '../utils/audioService'
import { speakEvent }        from '../utils/textToSpeech'

function notify(title, body) {
  // Route through Electron IPC for reliable native notifications
  if (window.electronAPI?.showNotification) {
    window.electronAPI.showNotification(title, body)
  }
}

export function useGoalNotify() {
  const matches = useWidgetStore(s => s.matches)
  const customTheme = useWidgetStore(s => s.customTheme)
  const prevRef = useRef(new Map())   // matchId → { status, home, away }

  const soundEnabled = customTheme?.soundEnabled !== false
  const volume = customTheme?.volume ?? 0.5
  const speechEnabled = !!customTheme?.speechEnabled

  useEffect(() => {
    const prev = prevRef.current
    const next = new Map()

    for (const m of matches) {
      const homeScore = m.score?.home ?? 0
      const awayScore = m.score?.away ?? 0
      next.set(m.id, { status: m.status, home: homeScore, away: awayScore })

      const p = prev.get(m.id)
      if (!p) continue    // first time seeing this match

      // ── Kick off ─────────────────────────────────────────────────────────
      if (p.status === 'scheduled' && m.status === 'live') {
        notify(
          `🟢 Kick off!`,
          `${m.homeTeam.name} vs ${m.awayTeam.name}`,
        )
        if (soundEnabled) playSound("whistle", volume)
        if (speechEnabled) {
          speakEvent(`Kick off! ${m.homeTeam.name} versus ${m.awayTeam.name}`, volume)
        }
        continue
      }

      // ── Goals ─────────────────────────────────────────────────────────────
      if (m.status === 'live') {
        if (homeScore > p.home) {
          const scorer = m.scorers?.filter(s => s.team === 'home').slice(-1)[0]
          const bodyText = scorer
            ? `${scorer.name} ${scorer.minute}' — ${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`
            : `${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`;
          
          notify(`⚽  GOAL!  ${m.homeTeam.name}`, bodyText)
          if (soundEnabled) playSound("fanfare", volume)
          if (speechEnabled) {
            speakEvent(`Goal for ${m.homeTeam.name}! ${scorer ? scorer.name : ''}. The score is now ${m.homeTeam.name} ${homeScore}, ${m.awayTeam.name} ${awayScore}`, volume)
          }
        }
        if (awayScore > p.away) {
          const scorer = m.scorers?.filter(s => s.team === 'away').slice(-1)[0]
          const bodyText = scorer
            ? `${scorer.name} ${scorer.minute}' — ${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`
            : `${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`;

          notify(`⚽  GOAL!  ${m.awayTeam.name}`, bodyText)
          if (soundEnabled) playSound("fanfare", volume)
          if (speechEnabled) {
            speakEvent(`Goal for ${m.awayTeam.name}! ${scorer ? scorer.name : ''}. The score is now ${m.homeTeam.name} ${homeScore}, ${m.awayTheme?.name || m.awayTeam.name} ${awayScore}`, volume)
          }
        }
      }

      // ── Full time ─────────────────────────────────────────────────────────
      if (p.status === 'live' && m.status === 'finished') {
        notify(
          `🏁  Full Time`,
          `${m.homeTeam.name} ${homeScore}–${awayScore} ${m.awayTeam.name}`,
        )
        if (soundEnabled) playSound("fulltime", volume)
        if (speechEnabled) {
          speakEvent(`Full time! Final score: ${m.homeTeam.name} ${homeScore}, ${m.awayTeam.name} ${awayScore}`, volume)
        }
      }
    }

    prevRef.current = next
  }, [matches, soundEnabled, volume, speechEnabled])
}
