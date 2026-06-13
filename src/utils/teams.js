/**
 * Comprehensive football teams database.
 *
 * Organised by league with canonical team names used across the app
 * for the "favorite teams" feature, filter-by-followed, and toast notifications.
 */

export const LEAGUES = {
  "Premier League": "PL",
  "La Liga": "LL",
  "Bundesliga": "BL",
  "Serie A": "SA",
  "Ligue 1": "L1",
  "FIFA World Cup 2026": "WC",
};

export const TEAMS_BY_LEAGUE = {
  // ── Premier League 2024/25 ──────────────────────────────────────────────────
  "Premier League": [
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford",
    "Brighton & Hove Albion", "Chelsea", "Crystal Palace", "Everton",
    "Fulham", "Ipswich Town", "Leicester City", "Liverpool",
    "Manchester City", "Manchester United", "Newcastle United",
    "Nottingham Forest", "Southampton", "Tottenham Hotspur",
    "West Ham United", "Wolverhampton Wanderers",
  ],

  // ── La Liga 2024/25 ─────────────────────────────────────────────────────────
  "La Liga": [
    "Alavés", "Athletic Club", "Atlético Madrid", "Barcelona",
    "Betis", "Celta Vigo", "Espanyol", "Getafe",
    "Girona", "Las Palmas", "Leganés", "Mallorca",
    "Osasuna", "Rayo Vallecano", "Real Madrid", "Real Sociedad",
    "Sevilla", "Valencia", "Valladolid", "Villarreal",
  ],

  // ── Bundesliga 2024/25 ──────────────────────────────────────────────────────
  Bundesliga: [
    "FC Augsburg", "Bayer Leverkusen", "Bayern Munich", "VfL Bochum",
    "Borussia Dortmund", "Borussia Mönchengladbach", "Eintracht Frankfurt",
    "SC Freiburg", "1. FC Heidenheim", "TSG Hoffenheim", "Holstein Kiel",
    "1. FSV Mainz 05", "RB Leipzig", "FC St. Pauli",
    "VfB Stuttgart", "1. FC Union Berlin", "Werder Bremen", "VfL Wolfsburg",
  ],

  // ── Serie A 2024/25 ─────────────────────────────────────────────────────────
  "Serie A": [
    "Atalanta", "Bologna", "Cagliari", "Como",
    "Empoli", "Fiorentina", "Genoa", "Hellas Verona",
    "Inter Milan", "Juventus", "Lazio", "Lecce",
    "AC Milan", "Monza", "Napoli", "Parma",
    "Roma", "Torino", "Udinese", "Venezia",
  ],

  // ── Ligue 1 2024/25 ─────────────────────────────────────────────────────────
  "Ligue 1": [
    "Angers", "Auxerre", "Brest", "Le Havre",
    "Lens", "Lille", "Lyon", "Marseille",
    "Monaco", "Montpellier", "Nantes", "Nice",
    "Paris Saint-Germain", "Reims", "Rennes", "Strasbourg",
    "Saint-Étienne", "Toulouse",
  ],

  // ── FIFA World Cup 2026 ─────────────────────────────────────────────────────
  "FIFA World Cup 2026": [
    // Hosts
    "Mexico", "Canada", "USA",
    // UEFA
    "England", "France", "Spain", "Germany", "Italy",
    "Portugal", "Netherlands", "Belgium", "Croatia",
    "Switzerland", "Denmark", "Austria", "Czech Republic",
    "Ukraine", "Turkey", "Sweden", "Norway",
    "Poland", "Serbia", "Wales", "Scotland",
    "Slovakia", "Hungary",
    // CONMEBOL
    "Brazil", "Argentina", "Uruguay", "Colombia",
    "Ecuador", "Paraguay", "Peru", "Chile",
    "Venezuela", "Bolivia",
    // CAF
    "Morocco", "Senegal", "Nigeria", "Egypt",
    "Algeria", "Cameroon", "Ghana", "Mali",
    "South Africa", "Côte d'Ivoire", "Tunisia",
    "Burkina Faso", "Cape Verde",
    // AFC
    "Japan", "South Korea", "Australia", "Saudi Arabia",
    "Iran", "Qatar", "Iraq", "Oman",
    "United Arab Emirates", "Uzbekistan",
    // OFC / play-off winners
    "New Zealand", "Bosnia & Herzegovina", "Curaçao",
  ],
};

/** Flattened team list with league info for easy search. */
export const ALL_TEAMS = Object.entries(TEAMS_BY_LEAGUE).flatMap(
  ([league, teams]) => teams.map((name) => ({ name, league })),
);

/** Quick look-up: true if the team name exists in the database. */
export function isKnownTeam(name) {
  return ALL_TEAMS.some((t) => t.name === name);
}

/**
 * Find the league(s) a team belongs to by name.
 * Returns an array of league names.
 */
export function findTeamLeagues(name) {
  return ALL_TEAMS.filter(
    (t) => t.name.toLowerCase() === name.toLowerCase(),
  ).map((t) => t.league);
}

/**
 * Get all unique team names (sorted) for autocomplete / selection UI.
 */
export function getAllTeamNames() {
  return [...new Set(ALL_TEAMS.map((t) => t.name))].sort();
}

/**
 * Get teams grouped by league, each group sorted alphabetically.
 */
export function getTeamsByLeague() {
  const grouped = {};
  for (const [league, teams] of Object.entries(TEAMS_BY_LEAGUE)) {
    grouped[league] = [...teams].sort();
  }
  return grouped;
}
