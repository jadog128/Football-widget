/**
 * StandingsWidget — Fetches league standings from ESPN.
 * Shows position, team, P, W, D, L, PTS, and form.
 * Falls back to mock data when API is unavailable.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useWidgetStore } from "../store/widgetStore";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";

function formatForm(streak = []) {
  return streak
    .slice(0, 5)
    .map((r) => {
      if (r === "win") return "🟢";
      if (r === "loss") return "🔴";
      return "🟡";
    })
    .join("");
}

// ── Mock standings for FIFA World Cup (no real API) ───────────────────────────
const MOCK_WC_STANDINGS = [
  {
    pos: 1,
    team: "Brazil",
    abbr: "BRA",
    p: 3,
    w: 3,
    d: 0,
    l: 0,
    pts: 9,
    form: ["win", "win", "win"],
  },
  {
    pos: 2,
    team: "England",
    abbr: "ENG",
    p: 3,
    w: 2,
    d: 1,
    l: 0,
    pts: 7,
    form: ["win", "draw", "win"],
  },
  {
    pos: 3,
    team: "France",
    abbr: "FRA",
    p: 3,
    w: 2,
    d: 0,
    l: 1,
    pts: 6,
    form: ["win", "loss", "win"],
  },
  {
    pos: 4,
    team: "Germany",
    abbr: "GER",
    p: 3,
    w: 2,
    d: 0,
    l: 1,
    pts: 6,
    form: ["win", "win", "loss"],
  },
  {
    pos: 5,
    team: "Argentina",
    abbr: "ARG",
    p: 3,
    w: 2,
    d: 0,
    l: 1,
    pts: 6,
    form: ["loss", "win", "win"],
  },
  {
    pos: 6,
    team: "Spain",
    abbr: "ESP",
    p: 3,
    w: 1,
    d: 2,
    l: 0,
    pts: 5,
    form: ["draw", "win", "draw"],
  },
  {
    pos: 7,
    team: "Portugal",
    abbr: "POR",
    p: 3,
    w: 1,
    d: 1,
    l: 1,
    pts: 4,
    form: ["win", "loss", "draw"],
  },
  {
    pos: 8,
    team: "Netherlands",
    abbr: "NED",
    p: 3,
    w: 1,
    d: 1,
    l: 1,
    pts: 4,
    form: ["draw", "win", "loss"],
  },
  {
    pos: 9,
    team: "Belgium",
    abbr: "BEL",
    p: 3,
    w: 1,
    d: 0,
    l: 2,
    pts: 3,
    form: ["loss", "win", "loss"],
  },
  {
    pos: 10,
    team: "Mexico",
    abbr: "MEX",
    p: 3,
    w: 1,
    d: 0,
    l: 2,
    pts: 3,
    form: ["win", "loss", "loss"],
  },
  {
    pos: 11,
    team: "Japan",
    abbr: "JPN",
    p: 3,
    w: 0,
    d: 2,
    l: 1,
    pts: 2,
    form: ["loss", "draw", "draw"],
  },
  {
    pos: 12,
    team: "USA",
    abbr: "USA",
    p: 3,
    w: 0,
    d: 1,
    l: 2,
    pts: 1,
    form: ["loss", "loss", "draw"],
  },
];

const MOCK_PL_STANDINGS = [
  {
    pos: 1,
    team: "Manchester City",
    abbr: "MCI",
    p: 38,
    w: 28,
    d: 5,
    l: 5,
    pts: 89,
    form: ["win", "win", "win", "win", "draw"],
  },
  {
    pos: 2,
    team: "Arsenal",
    abbr: "ARS",
    p: 38,
    w: 26,
    d: 6,
    l: 6,
    pts: 84,
    form: ["win", "win", "win", "win", "win"],
  },
  {
    pos: 3,
    team: "Liverpool",
    abbr: "LIV",
    p: 38,
    w: 24,
    d: 8,
    l: 6,
    pts: 80,
    form: ["win", "draw", "win", "win", "win"],
  },
  {
    pos: 4,
    team: "Aston Villa",
    abbr: "AVL",
    p: 38,
    w: 21,
    d: 9,
    l: 8,
    pts: 72,
    form: ["loss", "win", "draw", "win", "win"],
  },
  {
    pos: 5,
    team: "Tottenham",
    abbr: "TOT",
    p: 38,
    w: 20,
    d: 7,
    l: 11,
    pts: 67,
    form: ["win", "loss", "win", "draw", "loss"],
  },
  {
    pos: 6,
    team: "Chelsea",
    abbr: "CHE",
    p: 38,
    w: 18,
    d: 10,
    l: 10,
    pts: 64,
    form: ["win", "draw", "win", "loss", "win"],
  },
  {
    pos: 7,
    team: "Newcastle",
    abbr: "NEW",
    p: 38,
    w: 18,
    d: 8,
    l: 12,
    pts: 62,
    form: ["loss", "win", "draw", "loss", "win"],
  },
  {
    pos: 8,
    team: "Man United",
    abbr: "MUN",
    p: 38,
    w: 17,
    d: 9,
    l: 12,
    pts: 60,
    form: ["win", "loss", "loss", "draw", "win"],
  },
  {
    pos: 9,
    team: "West Ham",
    abbr: "WHU",
    p: 38,
    w: 15,
    d: 10,
    l: 13,
    pts: 55,
    form: ["draw", "win", "loss", "win", "draw"],
  },
  {
    pos: 10,
    team: "Brighton",
    abbr: "BRI",
    p: 38,
    w: 13,
    d: 11,
    l: 14,
    pts: 50,
    form: ["loss", "draw", "win", "loss", "draw"],
  },
];

function getMockStandings(slug) {
  if (slug === "fifa.world" || slug === "wc") return MOCK_WC_STANDINGS;
  return MOCK_PL_STANDINGS;
}

export default function StandingsWidget({ leagueSlug = "eng.1", limit = 10 }) {
  const customTheme = useWidgetStore((s) => s.customTheme);
  const theme = customTheme || {};
  const textColor = theme.textColor || "#F5E6D3";
  const accentColor = theme.accentColor || "#E9A84A";

  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ESPN_BASE}/${leagueSlug}/standings`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // ESPN response can have many shapes — try them all
      const entries =
        // Deep path: data.children[0].standings.entries (most common)
        data?.children?.[0]?.standings?.entries ||
        // Direct: data.standings.entries
        data?.standings?.entries ||
        // Flat: data.entries
        data?.entries ||
        // Nested in first child
        data?.children?.[0]?.entries ||
        // Season path
        data?.season?.standings?.entries ||
        [];

      if (entries.length === 0) {
        // No real data — use mock
        setStandings(getMockStandings(leagueSlug));
        return;
      }

      const rows = entries.slice(0, limit).map((entry) => {
        const team = entry.team || entry.team || {};
        const stats = {};
        (entry.stats || []).forEach((s) => {
          stats[s.name] = s.value ?? s.displayValue;
        });
        return {
          position: parseInt(stats.rank || entry.position || 0, 10),
          name: team.displayName || team.name || "?",
          abbreviation:
            team.abbreviation ||
            team.shortDisplayName ||
            team.name?.substring(0, 3)?.toUpperCase() ||
            "",
          played: parseInt(stats.gamesPlayed || stats.played || 0, 10),
          wins: parseInt(stats.wins || 0, 10),
          draws: parseInt(stats.ties || stats.draws || 0, 10),
          losses: parseInt(stats.losses || 0, 10),
          points: parseInt(stats.points || 0, 10),
          form: Array.isArray(stats.form)
            ? stats.form.map((f) =>
                String(f).toUpperCase() === "W"
                  ? "win"
                  : String(f).toUpperCase() === "L"
                    ? "loss"
                    : "draw",
              )
            : [],
        };
      });

      if (rows.length === 0) {
        setStandings(getMockStandings(leagueSlug));
      } else {
        setStandings(rows);
      }
    } catch (_) {
      // API failed — use mock data
      setStandings(getMockStandings(leagueSlug));
    } finally {
      setLoading(false);
    }
  }, [leagueSlug, limit]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <span
          className="animate-pulse"
          style={{
            color: "#A0886B",
            fontSize: "9px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Loading standings…
        </span>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="flex items-center justify-center py-3">
        <span
          style={{
            color: "#5A4232",
            fontSize: "8px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          No standings available
        </span>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[7px] font-bold uppercase tracking-wider"
        style={{
          color: "#8F7D74",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <span style={{ width: 20, flexShrink: 0 }}>#</span>
        <span style={{ flex: 1 }}>Team</span>
        <span style={{ width: 18, textAlign: "center" }}>P</span>
        <span style={{ width: 16, textAlign: "center" }}>W</span>
        <span style={{ width: 16, textAlign: "center" }}>D</span>
        <span style={{ width: 16, textAlign: "center" }}>L</span>
        <span style={{ width: 22, textAlign: "center" }}>PTS</span>
        <span style={{ width: 50, textAlign: "right" }}>Form</span>
      </div>

      {/* Rows */}
      {standings.slice(0, limit).map((row, i) => {
        const isEven = i % 2 === 0;
        return (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-1"
            style={{
              background: isEven ? "rgba(255,255,255,0.02)" : "transparent",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            <span
              style={{
                width: 20,
                flexShrink: 0,
                fontSize: "8px",
                fontWeight: 700,
                color:
                  row.position && row.position <= 4 ? accentColor : "#8F7D74",
              }}
            >
              {row.position || i + 1}
            </span>
            <span
              className="truncate"
              style={{
                flex: 1,
                fontSize: "8px",
                fontWeight: 600,
                color: textColor,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.abbreviation ||
                row.name?.substring(0, 4)?.toUpperCase() ||
                "?"}
            </span>
            <span
              style={{
                width: 18,
                textAlign: "center",
                fontSize: "8px",
                color: "#8F7D74",
              }}
            >
              {row.played}
            </span>
            <span
              style={{
                width: 16,
                textAlign: "center",
                fontSize: "8px",
                color: "#52B788",
              }}
            >
              {row.wins}
            </span>
            <span
              style={{
                width: 16,
                textAlign: "center",
                fontSize: "8px",
                color: "#E9A84A",
              }}
            >
              {row.draws}
            </span>
            <span
              style={{
                width: 16,
                textAlign: "center",
                fontSize: "8px",
                color: "#E05353",
              }}
            >
              {row.losses}
            </span>
            <span
              style={{
                width: 22,
                textAlign: "center",
                fontSize: "8px",
                fontWeight: 700,
                color: accentColor,
              }}
            >
              {row.points}
            </span>
            <span
              style={{
                width: 50,
                textAlign: "right",
                fontSize: "6px",
                letterSpacing: "0.05em",
              }}
            >
              {row.form?.length > 0 ? formatForm(row.form) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
