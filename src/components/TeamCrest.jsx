/**
 * TeamCrest — renders the ESPN team logo or a styled fallback monogram.
 *
 * Props:
 *   logo  {string|null}  URL from ESPN API  (homeTeam.logo)
 *   name  {string}       Full team name     (for alt text + fallback initial)
 *   size  {number}       Pixel dimensions   (default 22)
 */

import React, { useState } from 'react'

export default function TeamCrest({ logo, name = '', size = 22 }) {
  const [failed, setFailed] = useState(false)

  // Initials fallback: "Manchester United" → "MU", "Arsenal" → "A"
  const initials = name
    .split(/\s+/)
    .filter(w => /^[A-Z]/i.test(w))
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 2)

  const style = {
    width:        size,
    height:       size,
    flexShrink:   0,
    borderRadius: '50%',
    overflow:     'hidden',
    background:   '#1C1610',
    border:       '1px solid rgba(255,255,255,0.06)',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
  }

  if (!logo || failed) {
    return (
      <div style={style}>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize:   Math.floor(size * 0.38),
            color:      '#A0886B',
            fontWeight: 'bold',
            lineHeight: 1,
          }}
        >
          {initials || '?'}
        </span>
      </div>
    )
  }

  return (
    <div style={style}>
      <img
        src={logo}
        alt={name}
        width={size - 4}
        height={size - 4}
        onError={() => setFailed(true)}
        style={{ objectFit: 'contain', display: 'block' }}
        draggable={false}
      />
    </div>
  )
}
