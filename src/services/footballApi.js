/**
 * Football API service.
 *
 * Supports two real providers and a built-in mock mode (default when no key is set):
 *
 *   1. API-Football  (RapidAPI)   — set API_PROVIDER='api-football'  + apiKey
 *   2. Football-Data.org          — set API_PROVIDER='football-data' + apiKey
 *   3. Mock mode (default)        — realistic fake fixtures, no key needed
 *
 * HOW TO CONFIGURE:
 *   Create a `.env` file in the project root with:
 *     VITE_API_PROVIDER=api-football        (or football-data)
 *     VITE_API_KEY=your_key_here
 *     VITE_TEAM_IDS=33,40,42               (comma-separated team IDs to follow)
 *
 * Both free tiers are sufficient for hobby use. API-Football gives richer data
 * (predictions, live scores); Football-Data.org is generous with its free tier.
 */

import axios from "axios";
import { formatKickoffUK } from "../utils/timeUtils";
import { getBroadcaster } from "../utils/broadcasterUtils";
import { fetchESPNMatches } from "./espnScraper";

// ── Config ──────────────────────────────────────────────────────────────────

const API_PROVIDER = import.meta.env.VITE_API_PROVIDER ?? "mock";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";
const TEAM_IDS = (import.meta.env.VITE_TEAM_IDS ?? "")
  .split(",")
  .filter(Boolean);
const LEAGUE_IDS = (import.meta.env.VITE_LEAGUE_IDS ?? "39,2,3")
  .split(",")
  .filter(Boolean);

// ── Normalised match shape ───────────────────────────────────────────────────

function normaliseMatch(raw, provider) {
  if (provider === "api-football") return normaliseApifootball(raw);
  if (provider === "football-data") return normaliseFootballData(raw);
  return raw; // mock data is already normalised
}

function normaliseApifootball(f) {
  const kickoff = new Date(f.fixture.date);
  const competition = f.league.name;
  return {
    id: String(f.fixture.id),
    homeTeam: {
      name: f.teams.home.name,
      shortName: shortify(f.teams.home.name),
    },
    awayTeam: {
      name: f.teams.away.name,
      shortName: shortify(f.teams.away.name),
    },
    competition: { name: competition, shortName: f.league.name },
    kickoff: kickoff.toISOString(),
    kickoffUK: formatKickoffUK(kickoff),
    venue: f.fixture.venue?.name ?? "TBA",
    broadcaster: getBroadcaster(competition),
    broadcasterUrl: null,
    status: mapStatusApifootball(f.fixture.status.short),
    liveMinute: f.fixture.status.elapsed ?? null,
    score: {
      home: f.goals.home,
      away: f.goals.away,
    },
    prediction: {
      home: f.predictions?.percent?.home
        ? parseInt(f.predictions.percent.home)
        : 45,
      draw: f.predictions?.percent?.draw
        ? parseInt(f.predictions.percent.draw)
        : 25,
      away: f.predictions?.percent?.away
        ? parseInt(f.predictions.percent.away)
        : 30,
    },
  };
}

function normaliseFootballData(m) {
  const kickoff = new Date(m.utcDate);
  const competition = m.competition?.name ?? "";
  return {
    id: String(m.id),
    homeTeam: {
      name: m.homeTeam.name,
      shortName: m.homeTeam.shortName ?? shortify(m.homeTeam.name),
    },
    awayTeam: {
      name: m.awayTeam.name,
      shortName: m.awayTeam.shortName ?? shortify(m.awayTeam.name),
    },
    competition: { name: competition, shortName: m.competition?.code ?? "" },
    kickoff: kickoff.toISOString(),
    kickoffUK: formatKickoffUK(kickoff),
    venue: m.venue ?? "TBA",
    broadcaster: getBroadcaster(competition),
    broadcasterUrl: null,
    status: mapStatusFootballData(m.status),
    liveMinute: m.minute ?? null,
    score: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
    },
    prediction: { home: 45, draw: 25, away: 30 }, // FD free tier has no predictions
  };
}

function mapStatusApifootball(s) {
  if (["TBD", "NS"].includes(s)) return "scheduled";
  if (["1H", "HT", "2H", "ET", "P"].includes(s)) return "live";
  return "finished";
}

function mapStatusFootballData(s) {
  if (s === "SCHEDULED" || s === "TIMED") return "scheduled";
  if (s === "IN_PLAY" || s === "PAUSED") return "live";
  return "finished";
}

function shortify(name = "") {
  const words = name.split(" ");
  if (words.length === 1) return name.substring(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .substring(0, 4);
}

// ── API-Football ─────────────────────────────────────────────────────────────

async function fetchApifootball() {
  const today = new Date().toISOString().split("T")[0];
  const requests = TEAM_IDS.length
    ? TEAM_IDS.map((id) =>
        axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
          params: { team: id, next: 5 },
          headers: {
            "X-RapidAPI-Key": API_KEY,
            "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
          },
        }),
      )
    : LEAGUE_IDS.map((id) =>
        axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
          params: { league: id, next: 5, season: new Date().getFullYear() },
          headers: {
            "X-RapidAPI-Key": API_KEY,
            "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
          },
        }),
      );

  const responses = await Promise.all(requests);
  const fixtures = responses.flatMap((r) => r.data.response ?? []);

  // Deduplicate by fixture id and sort by kickoff ascending
  const seen = new Set();
  return fixtures
    .filter((f) => {
      if (seen.has(f.fixture.id)) return false;
      seen.add(f.fixture.id);
      return true;
    })
    .map((f) => normaliseMatch(f, "api-football"))
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
}

// ── Football-Data.org ────────────────────────────────────────────────────────

async function fetchFootballData() {
  const dateFrom = new Date().toISOString().split("T")[0];
  const dateTo = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .split("T")[0];

  const competitionCodes = ["PL", "CL", "EL", "EC", "WC"].join(",");
  const url = TEAM_IDS.length
    ? `https://api.football-data.org/v4/teams/${TEAM_IDS[0]}/matches?status=SCHEDULED&limit=5`
    : `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&competitions=${competitionCodes}`;

  const response = await axios.get(url, {
    headers: { "X-Auth-Token": API_KEY },
  });

  return (response.data.matches ?? [])
    .map((m) => normaliseMatch(m, "football-data"))
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
}

// ── Mock data — real 2026 FIFA World Cup Group Stage fixtures ─────────────────
// Kickoff times are real UTC timestamps from the official FIFA schedule.
// UK broadcast split: ITV and BBC share rights for the 2026 World Cup.

function makeMockMatch(
  id,
  home,
  away,
  kickoffUTC,
  venue,
  broadcaster,
  prediction,
  status = "scheduled",
  liveMinute = null,
  score = { home: null, away: null },
) {
  const kickoff = new Date(kickoffUTC);
  return {
    id,
    homeTeam: { name: home, shortName: shortify(home) },
    awayTeam: { name: away, shortName: shortify(away) },
    competition: { name: "FIFA World Cup 2026", shortName: "WC 2026" },
    kickoff: kickoff.toISOString(),
    kickoffUK: formatKickoffUK(kickoff),
    venue,
    broadcaster,
    broadcasterUrl:
      broadcaster === "ITV"
        ? "https://www.itv.com/sport"
        : "https://www.bbc.co.uk/sport/football",
    status,
    liveMinute,
    score,
    prediction,
  };
}

function getMockMatches() {
  // All times UTC. UK is BST (UTC+1) during the tournament.
  // Match 1  — Jun 11 19:00 UTC = 20:00 BST — LIVE
  // Match 2  — Jun 12 02:00 UTC = 03:00 BST
  // Match 3  — Jun 12 19:00 UTC = 20:00 BST
  // Match 4  — Jun 13 01:00 UTC = 02:00 BST
  // Match 5  — Jun 13 19:00 UTC = 20:00 BST (Qatar v Switzerland, UTC-7 12pm = 19:00 UTC)
  // Match 6  — Jun 13 22:00 UTC = 23:00 BST (Brazil v Morocco, UTC-4 6pm = 22:00 UTC)
  // Match 7  — Jun 17 20:00 UTC = 21:00 BST (England v Croatia, UTC-5 3pm = 20:00 UTC)

  const all = [
    makeMockMatch(
      "wc26-1",
      "Mexico",
      "South Africa",
      "2026-06-11T19:00:00Z",
      "Estadio Azteca, Mexico City",
      "ITV",
      { home: 55, draw: 25, away: 20 },
      "live",
      37,
      { home: 1, away: 0 },
    ),
    makeMockMatch(
      "wc26-2",
      "South Korea",
      "Czech Republic",
      "2026-06-12T02:00:00Z",
      "Estadio Akron, Zapopan",
      "BBC",
      { home: 42, draw: 28, away: 30 },
    ),
    makeMockMatch(
      "wc26-3",
      "Canada",
      "Bosnia & Herzegovina",
      "2026-06-12T19:00:00Z",
      "BMO Field, Toronto",
      "BBC",
      { home: 45, draw: 25, away: 30 },
    ),
    makeMockMatch(
      "wc26-4",
      "USA",
      "Paraguay",
      "2026-06-13T01:00:00Z",
      "SoFi Stadium, Inglewood",
      "ITV",
      { home: 50, draw: 25, away: 25 },
    ),
    makeMockMatch(
      "wc26-5",
      "Qatar",
      "Switzerland",
      "2026-06-13T19:00:00Z",
      "Levi's Stadium, Santa Clara",
      "BBC",
      { home: 20, draw: 25, away: 55 },
    ),
    makeMockMatch(
      "wc26-6",
      "Brazil",
      "Morocco",
      "2026-06-13T22:00:00Z",
      "MetLife Stadium, East Rutherford",
      "ITV",
      { home: 52, draw: 26, away: 22 },
    ),
    makeMockMatch(
      "wc26-7",
      "Germany",
      "Curaçao",
      "2026-06-14T17:00:00Z",
      "NRG Stadium, Houston",
      "BBC",
      { home: 78, draw: 14, away: 8 },
    ),
    makeMockMatch(
      "wc26-8",
      "Netherlands",
      "Japan",
      "2026-06-14T20:00:00Z",
      "AT&T Stadium, Arlington",
      "ITV",
      { home: 48, draw: 26, away: 26 },
    ),
    makeMockMatch(
      "wc26-9",
      "Spain",
      "Cape Verde",
      "2026-06-15T16:00:00Z",
      "Mercedes-Benz Stadium, Atlanta",
      "BBC",
      { home: 80, draw: 14, away: 6 },
    ),
    makeMockMatch(
      "wc26-10",
      "France",
      "Senegal",
      "2026-06-16T19:00:00Z",
      "MetLife Stadium, East Rutherford",
      "ITV",
      { home: 55, draw: 25, away: 20 },
    ),
    makeMockMatch(
      "wc26-11",
      "Argentina",
      "Algeria",
      "2026-06-17T01:00:00Z",
      "Arrowhead Stadium, Kansas City",
      "BBC",
      { home: 65, draw: 22, away: 13 },
    ),
    makeMockMatch(
      "wc26-12",
      "England",
      "Croatia",
      "2026-06-17T20:00:00Z",
      "AT&T Stadium, Arlington",
      "ITV",
      { home: 58, draw: 25, away: 17 },
    ),
  ];

  // Filter out matches that finished more than 3 hours ago so the list stays fresh
  const cutoff = Date.now() - 3 * 3_600_000;
  const upcoming = all.filter((m) => new Date(m.kickoff).getTime() > cutoff);

  // If everything has passed, still return the full list as upcoming
  const activeUpcoming = upcoming.length > 0 ? upcoming : all;
  return { upcoming: activeUpcoming, recent: [] };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns { upcoming: Match[], recent: Match[] }
 *   upcoming — live + scheduled, sorted soonest-first
 *   recent   — last 3 finished matches, newest-first
 *
 * Priority: paid API → ESPN (free, real-time) → hardcoded mock
 */
export async function fetchMatches() {
  // Paid providers (if configured)
  if (API_PROVIDER === "api-football" && API_KEY) {
    const flat = await fetchApifootball();
    return splitMatches(flat);
  }
  if (API_PROVIDER === "football-data" && API_KEY) {
    const flat = await fetchFootballData();
    return splitMatches(flat);
  }

  // ESPN public API — no key needed, real live scores
  try {
    const result = await fetchESPNMatches(); // already returns { upcoming, recent }
    if (result.upcoming.length > 0 || result.recent.length > 0) {
      console.log(
        `[ESPN] ${result.upcoming.length} upcoming, ${result.recent.length} recent`,
      );
      return result;
    }
    console.warn("[ESPN] 0 matches returned, falling back to mock");
  } catch (err) {
    console.warn("[ESPN] failed:", err?.message ?? err);
  }

  return getMockMatches();
}

/** Split a flat sorted array into upcoming + recent. */
function splitMatches(flat) {
  const now = Date.now();
  const recent = flat
    .filter((m) => m.status === "finished")
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff))
    .slice(0, 3);
  const upcoming = flat
    .filter(
      (m) =>
        m.status !== "finished" && new Date(m.kickoff) > now - 2 * 3_600_000,
    )
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  return { upcoming, recent };
}
