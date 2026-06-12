/**
 * UK broadcaster lookup.
 *
 * Returns the primary UK TV broadcaster for a given competition and, optionally,
 * team names. Falls back to "Not Televised" when no UK rights are known.
 *
 * Primary sources: Ofcom / rights holders (as of 2024-25 season).
 */

// ── Broadcaster config ───────────────────────────────────────────────────────

export const BROADCASTERS = {
  'Sky Sports':     { color: '#003594', bg: '#003594', abbr: 'SKY', url: 'https://www.skysports.com' },
  'TNT Sports':     { color: '#7B2FBE', bg: '#7B2FBE', abbr: 'TNT', url: 'https://www.tntsports.co.uk' },
  'BBC':            { color: '#222222', bg: '#222222', abbr: 'BBC', url: 'https://www.bbc.co.uk/sport/football' },
  'ITV':            { color: '#003087', bg: '#003087', abbr: 'ITV', url: 'https://www.itv.com/sport' },
  'Amazon Prime':   { color: '#1A98FF', bg: '#00A8E1', abbr: 'PRM', url: 'https://www.amazon.co.uk/primevideo' },
  'Channel 4':      { color: '#7B3F9E', bg: '#7B3F9E', abbr: 'CH4', url: 'https://www.channel4.com/sport' },
  'Premier Sports': { color: '#D4380D', bg: '#D4380D', abbr: 'PRM', url: 'https://www.premiersports.com' },
  'beIN Sports':    { color: '#8B0000', bg: '#8B0000', abbr: 'BEI', url: 'https://www.bein.net' },
  'Apple TV+':      { color: '#333333', bg: '#333333', abbr: 'APL', url: 'https://tv.apple.com' },
  'Not Televised':  { color: '#5A4232', bg: '#2A1E14', abbr: '—',   url: null },
}

// ── Competition → broadcaster mapping ────────────────────────────────────────
// Values are arrays of possible broadcasters; the first is the primary.

const COMPETITION_MAP = {
  // English domestic
  'Premier League':            ['Sky Sports', 'TNT Sports', 'Amazon Prime'],
  'EFL Championship':          ['Sky Sports'],
  'EFL League One':            ['Sky Sports'],
  'EFL League Two':            ['Sky Sports'],
  'FA Cup':                    ['BBC', 'ITV'],
  'EFL Cup':                   ['Sky Sports', 'ITV'],
  'Community Shield':          ['ITV'],

  // European / international
  'UEFA Champions League':     ['TNT Sports'],
  'UEFA Europa League':        ['TNT Sports'],
  'UEFA Conference League':    ['TNT Sports'],
  'UEFA European Championship':['BBC', 'ITV'],
  'FIFA World Cup':            ['BBC', 'ITV'],
  'UEFA Nations League':       ['Channel 4', 'Sky Sports'],

  // Other European leagues
  'La Liga':                   ['Premier Sports', 'Sky Sports'],
  'Bundesliga':                ['Sky Sports', 'TNT Sports'],
  'Serie A':                   ['Premier Sports'],
  'Ligue 1':                   ['beIN Sports'],
  'Eredivisie':                ['Viaplay'],

  // Other
  'MLS':                       ['Apple TV+'],
  'AFCON':                     ['BBC', 'Channel 4'],
  'Copa América':              ['BBC', 'ITV'],
}

/**
 * Returns the primary UK broadcaster string for a given competition name.
 * Performs a case-insensitive partial match so "UEFA Champions League 2024/25"
 * matches the 'UEFA Champions League' key.
 */
export function getBroadcaster(competitionName = '') {
  const normalised = competitionName.toLowerCase()

  for (const [key, broadcasters] of Object.entries(COMPETITION_MAP)) {
    if (normalised.includes(key.toLowerCase())) {
      return broadcasters[0]
    }
  }
  return 'Not Televised'
}

/**
 * Returns all possible UK broadcasters for a competition (e.g. for a tooltip).
 */
export function getAllBroadcasters(competitionName = '') {
  const normalised = competitionName.toLowerCase()
  for (const [key, broadcasters] of Object.entries(COMPETITION_MAP)) {
    if (normalised.includes(key.toLowerCase())) {
      return broadcasters
    }
  }
  return ['Not Televised']
}

/**
 * Returns the full broadcaster config object ({ color, bg, abbr, url })
 * for a given broadcaster name string.
 */
export function getBroadcasterConfig(name) {
  return BROADCASTERS[name] ?? BROADCASTERS['Not Televised']
}
