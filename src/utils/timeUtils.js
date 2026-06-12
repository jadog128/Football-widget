/**
 * UK time utilities.
 *
 * The UK observes:
 *   - GMT  (UTC+0) in winter
 *   - BST  (UTC+1) in summer (last Sunday in March → last Sunday in October)
 *
 * We use the Intl API so we never have to maintain the DST boundary ourselves.
 */

// ── Core formatters ──────────────────────────────────────────────────────────

const UK_LOCALE    = 'en-GB'
const UK_TIMEZONE  = 'Europe/London'

/** Returns a Date representing "now" in UK local time (still a UTC Date object). */
export function nowUK() {
  return new Date(new Date().toLocaleString(UK_LOCALE, { timeZone: UK_TIMEZONE }))
}

/**
 * Format a UTC Date/ISO string as a human-readable UK kickoff string.
 * Examples:
 *   "Today 7:45pm"
 *   "Tomorrow 3:00pm"
 *   "Sat 12:30pm"
 *   "25 Jan 5:00pm"
 */
export function formatKickoffUK(utcDate) {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate)
  if (isNaN(date)) return 'TBA'

  const now   = new Date()
  const ukNow = new Date(now.toLocaleString(UK_LOCALE, { timeZone: UK_TIMEZONE }))
  const ukKo  = new Date(date.toLocaleString(UK_LOCALE, { timeZone: UK_TIMEZONE }))

  const timeStr = date.toLocaleTimeString(UK_LOCALE, {
    timeZone: UK_TIMEZONE,
    hour:     'numeric',
    minute:   '2-digit',
    hour12:   true,
  }).toLowerCase().replace(' ', '') // "7:45pm"

  const todayMidnight    = new Date(ukNow); todayMidnight.setHours(0,0,0,0)
  const tomorrowMidnight = new Date(todayMidnight); tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1)
  const dayAfterMidnight = new Date(tomorrowMidnight); dayAfterMidnight.setDate(dayAfterMidnight.getDate() + 1)
  const koMidnight       = new Date(ukKo); koMidnight.setHours(0,0,0,0)

  if (koMidnight.getTime() === todayMidnight.getTime())    return `Today ${timeStr}`
  if (koMidnight.getTime() === tomorrowMidnight.getTime()) return `Tomorrow ${timeStr}`

  // Within the next 6 days → show weekday name
  const daysAhead = (koMidnight - todayMidnight) / 86_400_000
  if (daysAhead < 7) {
    const day = date.toLocaleDateString(UK_LOCALE, { timeZone: UK_TIMEZONE, weekday: 'short' })
    return `${day} ${timeStr}`
  }

  // Further away → show "25 Jan"
  const dayMonth = date.toLocaleDateString(UK_LOCALE, {
    timeZone: UK_TIMEZONE,
    day:      'numeric',
    month:    'short',
  })
  return `${dayMonth} ${timeStr}`
}

/**
 * Returns a short string like "in 2h 15m", "in 45m", "in 3 days", "LIVE", "FT".
 */
export function relativeKickoff(utcDate, status) {
  if (status === 'finished') return 'FT'
  if (status === 'live')     return 'LIVE'

  const msUntil = new Date(utcDate) - Date.now()
  if (msUntil < 0) return 'Soon'

  const totalMins = Math.floor(msUntil / 60_000)
  const hours     = Math.floor(totalMins / 60)
  const mins      = totalMins % 60

  if (totalMins < 1)   return 'Now'
  if (totalMins < 60)  return `in ${totalMins}m`
  if (hours < 24)      return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`
  const days = Math.floor(hours / 24)
  return `in ${days}d`
}

/**
 * Whether UK is currently on BST (British Summer Time, UTC+1).
 */
export function isUKSummerTime() {
  const now = new Date()
  const jan = new Date(now.getFullYear(), 0, 1)
  const jul = new Date(now.getFullYear(), 6, 1)
  // If the offset is smaller in July than in January, DST is observed
  return now.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
}

export function ukTimezone() {
  return isUKSummerTime() ? 'BST' : 'GMT'
}
