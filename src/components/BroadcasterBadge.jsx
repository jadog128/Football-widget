/**
 * BroadcasterBadge
 *
 * A compact coloured pill showing the UK broadcaster name.
 * Clicking it opens the broadcaster website in the default browser.
 */

import React from 'react'
import { getBroadcasterConfig } from '../utils/broadcasterUtils'

export default function BroadcasterBadge({ broadcaster = 'Not Televised', className = '' }) {
  const cfg = getBroadcasterConfig(broadcaster)

  function handleClick(e) {
    e.stopPropagation()
    if (cfg.url) {
      if (window.electronAPI?.openUrl) {
        window.electronAPI.openUrl(cfg.url)
      } else {
        window.open(cfg.url, '_blank', 'noopener')
      }
    }
  }

  const isTelevised = broadcaster !== 'Not Televised'

  return (
    <button
      onClick={handleClick}
      disabled={!cfg.url}
      title={isTelevised ? `Watch on ${broadcaster}` : 'Not televised in the UK'}
      className={[
        'no-drag inline-flex items-center gap-1 px-2 py-[3px] rounded-badge text-[8px] font-bold',
        'transition-opacity duration-150',
        cfg.url ? 'hover:opacity-80 cursor-pointer' : 'cursor-default opacity-70',
        className,
      ].join(' ')}
      style={{
        backgroundColor: cfg.bg + '33',  // 20% opacity tint
        border: `1px solid ${cfg.bg}55`,
        color: isTelevised ? '#F5E6D3' : '#5A4232',
        fontFamily: 'monospace',
      }}
    >
      <span style={{ fontSize: '9px' }}>
        {isTelevised ? '📺' : '—'}
      </span>
      <span>{broadcaster}</span>
    </button>
  )
}
