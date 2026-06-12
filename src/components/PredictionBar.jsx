/**
 * PredictionBar
 *
 * Renders a retro "uptime bar" style visualisation showing home / draw / away
 * win probabilities as coloured cells — green for home, yellow for draw, red for away.
 *
 * Now supports interactive voting with visual highlights!
 */

import React, { useMemo } from 'react'

const TOTAL = 30

const COLORS = {
  home: '#52B788',   // Emerald green
  draw: '#E9A84A',   // Yellow
  away: '#E05353',   // Red
}

export default function PredictionBar({ 
  home = 45, 
  draw = 25, 
  away = 30, 
  total = TOTAL,
  matchId = null,
  currentVote = null,
  onVote = null
}) {
  // Normalise so the three values sum to exactly 100
  const sum = home + draw + away
  const h   = sum > 0 ? (home / sum) * 100 : 45
  const d   = sum > 0 ? (draw / sum) * 100 : 25
  const a   = sum > 0 ? (away / sum) * 100 : 30

  // Distribute TOTAL cells proportionally
  const cells = useMemo(() => {
    const rawH = (h / 100) * total
    const rawD = (d / 100) * total
    const rawA = (a / 100) * total

    let countH = Math.floor(rawH)
    let countD = Math.floor(rawD)
    let countA = Math.floor(rawA)

    const rem = total - countH - countD - countA
    const rems = [
      { key: 'home', frac: rawH - countH },
      { key: 'draw', frac: rawD - countD },
      { key: 'away', frac: rawA - countA },
    ].sort((a, b) => b.frac - a.frac)

    for (let i = 0; i < rem; i++) {
      if (rems[i].key === 'home') countH++
      else if (rems[i].key === 'draw') countD++
      else countA++
    }

    return [
      ...Array(countH).fill('home'),
      ...Array(countD).fill('draw'),
      ...Array(countA).fill('away'),
    ]
  }, [h, d, a, total])

  return (
    <div className="w-full select-none font-sans-premium">
      {/* Label / Interactive Row */}
      <div className="flex justify-between items-center mb-[6px] text-[9px] font-semibold text-[#8F7D74] uppercase tracking-wider">
        <span>Win Probability</span>
        
        {/* Prediction voting options */}
        {matchId && onVote ? (
          <div className="flex items-center gap-1.5 no-drag">
            <span>PREDICT:</span>
            <button
              onClick={() => onVote('home')}
              className="px-1 py-0.5 rounded cursor-pointer transition-all font-bold"
              style={{
                background: currentVote === 'home' ? 'rgba(82,183,136,0.25)' : 'transparent',
                border: currentVote === 'home' ? '1.5px solid #52B788' : '1px solid transparent',
                color: currentVote === 'home' ? '#52B788' : '#8F7D74',
                fontSize: '8px',
              }}
              title="Home Win"
            >
              H
            </button>
            <button
              onClick={() => onVote('draw')}
              className="px-1 py-0.5 rounded cursor-pointer transition-all font-bold"
              style={{
                background: currentVote === 'draw' ? 'rgba(233,168,74,0.25)' : 'transparent',
                border: currentVote === 'draw' ? '1.5px solid #E9A84A' : '1px solid transparent',
                color: currentVote === 'draw' ? '#E9A84A' : '#8F7D74',
                fontSize: '8px',
              }}
              title="Draw"
            >
              D
            </button>
            <button
              onClick={() => onVote('away')}
              className="px-1 py-0.5 rounded cursor-pointer transition-all font-bold"
              style={{
                background: currentVote === 'away' ? 'rgba(224,83,83,0.25)' : 'transparent',
                border: currentVote === 'away' ? '1.5px solid #E05353' : '1px solid transparent',
                color: currentVote === 'away' ? '#E05353' : '#8F7D74',
                fontSize: '8px',
              }}
              title="Away Win"
            >
              A
            </button>
          </div>
        ) : (
          <span style={{ color: '#A0886B', textTransform: 'none' }}>
            H: {Math.round(h)}% · D: {Math.round(d)}% · A: {Math.round(a)}%
          </span>
        )}
      </div>

      {/* Cell bar */}
      <div className="flex gap-[3px] w-full">
        {cells.map((type, i) => (
          <div
            key={i}
            className="pred-cell"
            style={{ 
              backgroundColor: COLORS[type],
              opacity: currentVote ? (currentVote === type ? 1.0 : 0.4) : 1.0,
              boxShadow: currentVote === type ? `0 0 4px ${COLORS[type]}` : 'none',
              transition: 'opacity 0.2s, box-shadow 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  )
}
