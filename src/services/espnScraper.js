/**
 * ESPN Public Soccer API — no API key required.
 *
 * Primary:  /scoreboard  — live + upcoming matches + basic goal details
 * Secondary: /summary    — rich scorer / play-by-play for live & recent matches
 *
 * fetchESPNMatches()  → all matches split into { upcoming, recent }
 */

import { formatKickoffUK } from "../utils/timeUtils";
import { getBroadcaster } from "../utils/broadcasterUtils";

// ── Leagues ───────────────────────────────────────────────────────────────────

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";

const ESPN_LEAGUES = [
  { slug: "fifa.world", name: "FIFA World Cup 2026", shortName: "WC 2026" },
  { slug: "eng.1", name: "Premier League", shortName: "PL" },
  { slug: "uefa.champions", name: "UEFA Champions League", shortName: "UCL" },
  { slug: "uefa.europa", name: "UEFA Europa League", shortName: "UEL" },
  { slug: "eng.fa_cup", name: "FA Cup", shortName: "FA Cup" },
  { slug: "eng.league_cup", name: "EFL Cup", shortName: "EFL Cup" },
  { slug: "esp.1", name: "La Liga", shortName: "LaLiga" },
  { slug: "ger.1", name: "Bundesliga", shortName: "Bund." },
  { slug: "ita.1", name: "Serie A", shortName: "SerieA" },
  { slug: "fra.1", name: "Ligue 1", shortName: "L1" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const toESPNDate = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");

function buildDateRange(pastDays = 3, futureDays = 5) {
  const start = new Date(Date.now() - pastDays * 86_400_000);
  const end = new Date(Date.now() + futureDays * 86_400_000);
  return `${toESPNDate(start)}-${toESPNDate(end)}`;
}

function mapStatus(state) {
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "scheduled";
}

function parseLiveMinute(comp) {
  const detail = comp.status?.type?.shortDetail ?? "";
  const stripped = detail.replace("'", "").trim();
  if (stripped && /^\d/.test(stripped)) return stripped;
  const clock = comp.status?.clock ?? 0;
  const period = comp.status?.period ?? 1;
  const mins = Math.floor(clock / 60);
  return period === 2 ? `${45 + mins}` : `${mins}`;
}

function parseAmericanOdds(raw) {
  if (raw == null) return null;
  const n = parseFloat(String(raw).replace("+", ""));
  if (isNaN(n)) return null;
  return n >= 0 ? 100 / (100 + n) : -n / (-n + 100);
}

function parsePrediction(comp) {
  try {
    const odds = comp.odds?.[0];
    if (odds) {
      const h = parseAmericanOdds(odds.homeTeamOdds?.moneyLine);
      const a = parseAmericanOdds(odds.awayTeamOdds?.moneyLine);
      if (h !== null && a !== null) {
        const d = Math.max(0.05, 1 - h - a);
        const sum = h + d + a;
        return {
          home: Math.round((h / sum) * 100),
          draw: Math.round((d / sum) * 100),
          away: Math.round((a / sum) * 100),
        };
      }
    }
  } catch (_) {}
  return { home: 45, draw: 25, away: 30 };
}

// ── Scorer parsing ────────────────────────────────────────────────────────────

const GOAL_TYPE_IDS = new Set(["goal", "own-goal", "penalty", "header"]);

/**
 * Extract goal events from ESPN `competition.details` array.
 * Each item: { type.id, clock.displayValue, team.id, athletesInvolved[] }
 */
function parseScorersFromDetails(details = [], homeId, awayId) {
  return details
    .filter((d) => GOAL_TYPE_IDS.has(d.type?.id))
    .map((d) => {
      const athlete = d.athletesInvolved?.[0];
      if (!athlete) return null;
      const side =
        d.team?.id === homeId ? "home" : d.team?.id === awayId ? "away" : null;
      return {
        name: athlete.displayName ?? "",
        shortName:
          athlete.shortName ?? athlete.displayName?.split(" ").pop() ?? "",
        minute: d.clock?.displayValue?.replace("'", "") ?? "?",
        type: d.type?.id, // 'goal' | 'own-goal' | 'penalty'
        team: side, // 'home' | 'away' | null
      };
    })
    .filter(Boolean);
}

/**
 * Extract goals from the per-event /summary endpoint's `plays` array.
 * Used for live matches where the scoreboard `details` field is often empty.
 */
function parseScorersFromPlays(plays = [], homeId, awayId) {
  return plays
    .filter((p) => p.scoringPlay === true)
    .map((p) => {
      const athlete = p.athletes?.[0] ?? p.participants?.[0];
      const name = athlete?.displayName ?? p.text ?? "Unknown";
      const teamId = p.team?.id;
      const side =
        teamId === homeId ? "home" : teamId === awayId ? "away" : null;
      // Minute: "clock.displayValue" is often "23:00" → strip seconds
      const raw = p.clock?.displayValue ?? "";
      const minute = raw.includes(":")
        ? raw.split(":")[0]
        : raw.replace("'", "");
      return {
        name,
        shortName: name.split(" ").pop(),
        minute,
        type:
          p.type?.id === "own-goal"
            ? "own-goal"
            : p.type?.id === "penalty"
              ? "penalty"
              : "goal",
        team: side,
      };
    })
    .filter((s) => s.team !== null);
}

// ── Per-event summary fetch (scorer details) ──────────────────────────────────

async function fetchSummary(leagueSlug, eventId) {
  try {
    const url = `${ESPN_BASE}/${leagueSlug}/summary?event=${eventId}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

// ── Normalise one ESPN event ──────────────────────────────────────────────────

function normalizeEvent(event, league) {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const home = comp.competitors?.find((c) => c.homeAway === "home");
  const away = comp.competitors?.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const status = mapStatus(comp.status?.type?.state);
  const kickoff = new Date(event.date);
  const isLive = status === "live";
  const isFinished = status === "finished";

  const venueArr = [comp.venue?.fullName, comp.venue?.address?.city].filter(
    Boolean,
  );
  const venue = venueArr.join(", ") || "TBA";

  const scorers = parseScorersFromDetails(
    comp.details ?? [],
    home.team.id,
    away.team.id,
  );

  return {
    id: `espn-${event.id}`,
    _espnId: event.id,
    _leagueSlug: league.slug,
    homeTeam: {
      name: home.team.displayName,
      shortName:
        home.team.abbreviation ||
        home.team.shortDisplayName ||
        home.team.displayName,
      logo: home.team.logo ?? null,
      id: home.team.id,
    },
    awayTeam: {
      name: away.team.displayName,
      shortName:
        away.team.abbreviation ||
        away.team.shortDisplayName ||
        away.team.displayName,
      logo: away.team.logo ?? null,
      id: away.team.id,
    },
    competition: { name: league.name, shortName: league.shortName },
    kickoff: kickoff.toISOString(),
    kickoffUK: formatKickoffUK(kickoff),
    venue,
    broadcaster: getBroadcaster(league.name),
    broadcasterUrl: null,
    status,
    liveMinute: isLive ? parseLiveMinute(comp) : null,
    score: {
      home: isLive || isFinished ? parseInt(home.score, 10) || 0 : null,
      away: isLive || isFinished ? parseInt(away.score, 10) || 0 : null,
    },
    scorers,
    prediction: parsePrediction(comp),
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Returns { upcoming: Match[], recent: Match[] }
 *
 * upcoming — live + scheduled matches, sorted soonest first (max ~10 shown)
 * recent   — finished matches in the past 48h, most recent first (max 3 shown)
 *
 * For live matches and the 3 newest finished matches, this function additionally
 * fetches the /summary endpoint to fill in accurate scorer data.
 */
export async function fetchESPNMatches() {
  const dateRange = buildDateRange(3, 5);
  const seen = new Set();
  const allMatches = [];

  // Parallel scoreboard fetch for all leagues
  await Promise.allSettled(
    ESPN_LEAGUES.map(async (league) => {
      try {
        const url = `${ESPN_BASE}/${league.slug}/scoreboard?dates=${dateRange}&limit=50`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
        if (!res.ok) return;
        const data = await res.json();
        for (const event of data.events ?? []) {
          if (seen.has(event.id)) continue;
          seen.add(event.id);
          const match = normalizeEvent(event, league);
          if (match) allMatches.push(match);
        }
      } catch (_) {}
    }),
  );

  // ── Enrich with summary scorer data ────────────────────────────────────────
  // Limit extra requests: all live games + most recent 3 finished games
  const liveMatches = allMatches.filter((m) => m.status === "live");
  const finishedSorted = allMatches
    .filter((m) => m.status === "finished")
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));
  const recentFinished = finishedSorted.slice(0, 3);

  const toEnrich = [...liveMatches, ...recentFinished];

  await Promise.allSettled(
    toEnrich.map(async (match) => {
      // Skip if we already got scorers from the scoreboard details
      if (match.scorers.length > 0) return;

      const summary = await fetchSummary(match._leagueSlug, match._espnId);
      if (!summary) return;

      const plays = summary.plays ?? summary.content?.plays ?? [];
      if (plays.length > 0) {
        match.scorers = parseScorersFromPlays(
          plays,
          match.homeTeam.id,
          match.awayTeam.id,
        );
      }
    }),
  );

  // ── Split and filter ────────────────────────────────────────────────────────
  const now = Date.now();

  const recent = finishedSorted
    .filter((m) => now - new Date(m.kickoff).getTime() < 48 * 3_600_000)
    .slice(0, 3);

  const upcoming = allMatches
    .filter((m) => m.status !== "finished")
    .filter((m) => new Date(m.kickoff).getTime() > now - 2 * 3_600_000)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  return { upcoming, recent };
}
