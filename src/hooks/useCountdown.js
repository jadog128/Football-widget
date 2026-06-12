/**
 * useCountdown — live ticking countdown to a future kickoff.
 *
 * Returns a string like "2h 14m 37s", "45m 03s", "12s", or "" when
 * the match is live / finished / more than a week away.
 */

import { useState, useEffect } from 'react'

export function useCountdown(kickoffISO, status) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (status === 'live' || status === 'finished') {
      setDisplay('')
      return
    }

    const target = new Date(kickoffISO).getTime()

    function tick() {
      const diff = target - Date.now()
      if (diff <= 0) { setDisplay('KO'); return }

      const totalSecs = Math.floor(diff / 1_000)
      const d = Math.floor(totalSecs / 86_400)
      const h = Math.floor((totalSecs % 86_400) / 3_600)
      const m = Math.floor((totalSecs % 3_600) / 60)
      const s = totalSecs % 60

      if (d >= 7)  { setDisplay(''); return }          // too far away
      if (d >= 1)  { setDisplay(`${d}d ${h}h`); return }
      if (h >= 1)  { setDisplay(`${h}h ${m}m ${String(s).padStart(2,'0')}s`); return }
      if (m >= 1)  { setDisplay(`${m}m ${String(s).padStart(2,'0')}s`); return }
      setDisplay(`${s}s`)
    }

    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [kickoffISO, status])

  return display
}
