/**
 * MatchPanel
 *
 * Slides in above the widget (window resizes upward).
 * Shows:
 *   RESULTS  — last 3 finished matches (score, time played, scorers)
 *   UPCOMING — next 10 live + scheduled matches
 *
 * Clicking a match in UPCOMING toggles its detail card (Stats, Events, H2H).
 * Inside the detail card, the user can click "View in Widget" to jump to it in the widget carousel.
 */

import React, { useState, useEffect } from "react";
import { useWidgetStore } from "../store/widgetStore";
import BroadcasterBadge from "./BroadcasterBadge";
import StandingsWidget from "./StandingsWidget";

// ── Goal icon & suffix ────────────────────────────────────────────────────────

function goalIcon(type) {
  if (type === "own-goal") return "⚽";
  if (type === "penalty") return "⚽";
  return "⚽";
}
function goalSuffix(type) {
  if (type === "own-goal") return " (og)";
  if (type === "penalty") return " (P)";
  return "";
}

// ── Deterministic seed-based match data generator ───────────────────────────

function seedRandom(str) {
  const seed = String(str || "default-seed");
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  let current = hash;
  return () => {
    const x = Math.sin(current++) * 10000;
    return x - Math.floor(x);
  };
}

export function getDeterministicMatchDetails(match) {
  if (!match) return null;
  try {
    const rng = seedRandom(match.id);

    // H2H last 5 matches
    const h2hHistory = Array.from({ length: 5 }, (_, idx) => {
      const homeGoals = Math.floor(rng() * 3);
      const awayGoals = Math.floor(rng() * 3);
      let outcome = "D";
      if (homeGoals > awayGoals) outcome = "H";
      else if (homeGoals < awayGoals) outcome = "A";
      return {
        homeGoals,
        awayGoals,
        outcome, // H, A, D
      };
    });

    const totalGoals = h2hHistory.reduce(
      (sum, h) => sum + (h.homeGoals || 0) + (h.awayGoals || 0),
      0,
    );
    const avgGoals = (totalGoals / 5).toFixed(1);

    // Stats
    const possessionHome = Math.round(rng() * 26) + 37; // 37 - 63%
    const possessionAway = 100 - possessionHome;
    const shotsHome = Math.round(rng() * 10) + 4; // 4 - 14
    const shotsAway = Math.round(rng() * 10) + 3;
    const foulsHome = Math.round(rng() * 8) + 6; // 6 - 14
    const foulsAway = Math.round(rng() * 8) + 6;

    // Events timeline
    const events = [];
    if (match.scorers) {
      match.scorers.forEach((s) => {
        if (!s) return;
        events.push({
          type: s.type || "goal",
          minute: s.minute || "??",
          text: `Goal! ${s.name || s.shortName || "Unknown Player"}${goalSuffix(s.type)}`,
          team: s.team || "home",
        });
      });
    }

    // Cards
    const numYellows = Math.floor(rng() * 3) + 1; // 1-3
    const playersHome = ["Stones", "Rice", "Walker", "Bellingham", "Saka"];
    const playersAway = [
      "Modric",
      "Kovacic",
      "Gvardiol",
      "Perisic",
      "Brozovic",
    ];

    for (let i = 0; i < numYellows; i++) {
      const isHome = rng() > 0.5;
      const min = Math.floor(rng() * 82) + 6;
      const player = isHome
        ? playersHome[Math.floor(rng() * playersHome.length)]
        : playersAway[Math.floor(rng() * playersAway.length)];
      events.push({
        type: "card",
        minute: min,
        text: `🟨 Yellow Card: ${player}`,
        team: isHome ? "home" : "away",
      });
    }

    // Subs
    const numSubs = Math.floor(rng() * 2) + 1;
    for (let i = 0; i < numSubs; i++) {
      const isHome = rng() > 0.5;
      const min = Math.floor(rng() * 25) + 60; // 60' to 85'
      events.push({
        type: "sub",
        minute: min,
        text: isHome
          ? "🔄 Sub: Rashford (IN) / Foden (OUT)"
          : "🔄 Sub: Kramaric (IN) / Vlasic (OUT)",
        team: isHome ? "home" : "away",
      });
    }

    // VAR (25% chance)
    if (rng() > 0.75) {
      events.push({
        type: "var",
        minute: Math.floor(rng() * 75) + 15,
        text: "🖥️ VAR Review: Goal Disallowed (Offside)",
        team: rng() > 0.5 ? "home" : "away",
      });
    }

    events.sort((a, b) => (a.minute || 0) - (b.minute || 0));

    return {
      h2hHistory,
      avgGoals,
      stats: {
        possession: { home: possessionHome, away: possessionAway },
        shots: { home: shotsHome, away: shotsAway },
        fouls: { home: foulsHome, away: foulsAway },
      },
      events,
    };
  } catch (err) {
    console.error("Error generating match details:", err);
    return {
      h2hHistory: [],
      avgGoals: "0.0",
      stats: {
        possession: { home: 50, away: 50 },
        shots: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
      },
      events: [],
    };
  }
}

// ── Tiny typography / style systems ─────────────────────────────────────────

const T = {
  comp: {
    fontFamily: "Inter, sans-serif",
    fontSize: "9px",
    color: "#8F7D74",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: "600",
  },
  teamName: {
    fontFamily: "Lora, Georgia, serif",
    fontSize: "12px",
    color: "#F5E6D3",
    fontWeight: "500",
  },
  teamAbbr: {
    fontFamily: "Lora, Georgia, serif",
    fontSize: "12px",
    color: "#F5E6D3",
    fontWeight: "500",
  },
  score: {
    fontFamily: "Lora, Georgia, serif",
    fontSize: "14px",
    color: "#F5E6D3",
    fontWeight: "600",
  },
  scorer: {
    fontFamily: "Inter, sans-serif",
    fontSize: "9px",
    color: "#A0886B",
  },
  kickoff: {
    fontFamily: "Lora, Georgia, serif",
    fontSize: "11px",
    color: "#E9A84A",
    fontWeight: "500",
  },
  section: {
    fontFamily: "Inter, sans-serif",
    fontSize: "10px",
    color: "#8F7D74",
    letterSpacing: "0.08em",
    fontWeight: "600",
    textTransform: "uppercase",
  },
};

// ── Scorers block ─────────────────────────────────────────────────────────────

function Scorers({ scorers, compact }) {
  if (!scorers?.length) return null;

  const homeScorers = scorers.filter((s) => s.team === "home");
  const awayScorers = scorers.filter((s) => s.team === "away");
  const unknownScorers = scorers.filter((s) => s.team === null || !s.team);

  const fmt = (s) =>
    `${goalIcon(s.type)} ${compact ? s.shortName : s.name}${goalSuffix(s.type)} ${s.minute}'`;

  return (
    <div
      className="flex justify-between gap-1 mt-[2px]"
      style={{ minHeight: 13 }}
    >
      {/* Home scorers — left aligned */}
      <div className="flex flex-col gap-[1px]">
        {homeScorers.map((s, i) => (
          <span key={i} style={T.scorer}>
            {fmt(s)}
          </span>
        ))}
        {unknownScorers.map((s, i) => (
          <span key={`u${i}`} style={T.scorer}>
            {fmt(s)}
          </span>
        ))}
      </div>
      {/* Away scorers — right aligned */}
      <div className="flex flex-col gap-[1px] items-end">
        {awayScorers.map((s, i) => (
          <span key={i} style={T.scorer}>
            {fmt(s)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ match }) {
  if (!match) return null;
  const status = match.status || "scheduled";
  if (status === "live") {
    return (
      <span
        className="animate-pulse-alert inline-flex items-center px-[5px] py-[2px] rounded-badge flex-shrink-0"
        style={{
          background: "#E053531A",
          border: "1px solid #E0535344",
          color: "#E05353",
          ...T.comp,
        }}
      >
        ● {match.liveMinute ? `${match.liveMinute}'` : "LIVE"}
      </span>
    );
  }
  if (status === "finished") {
    return (
      <span
        className="inline-flex items-center px-[5px] py-[2px] rounded-badge flex-shrink-0"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#A0886B",
          ...T.comp,
        }}
      >
        FT
      </span>
    );
  }
  return (
    <span style={{ ...T.kickoff, whiteSpace: "nowrap", flexShrink: 0 }}>
      {match.kickoffUK || "TBA"}
    </span>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function MatchDetailDrawer({ match, onActivate }) {
  const activeSubTab = useWidgetStore((s) => s.activeSubTab);
  const setActiveSubTab = useWidgetStore((s) => s.setActiveSubTab);
  const details = getDeterministicMatchDetails(match);

  if (!details) return null;

  return (
    <div className="mx-3 my-2 p-3 bg-black/20 rounded-xl border border-white/5 text-xs text-[#F5E6D3] flex flex-col gap-3">
      {/* Sub Tabs Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
        <div className="flex gap-2">
          {match.status !== "scheduled" && (
            <>
              <button
                onClick={() => setActiveSubTab("stats")}
                className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded transition-all ${
                  activeSubTab === "stats"
                    ? "bg-[#E9A84A] text-[#171311]"
                    : "text-[#A0886B] hover:text-white"
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setActiveSubTab("events")}
                className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded transition-all ${
                  activeSubTab === "events"
                    ? "bg-[#E9A84A] text-[#171311]"
                    : "text-[#A0886B] hover:text-white"
                }`}
              >
                Events
              </button>
            </>
          )}
          <button
            onClick={() => setActiveSubTab("h2h")}
            className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded transition-all ${
              activeSubTab === "h2h" ||
              (match.status === "scheduled" &&
                activeSubTab !== "h2h" &&
                activeSubTab !== "ai")
                ? "bg-[#E9A84A] text-[#171311]"
                : "text-[#A0886B] hover:text-white"
            }`}
          >
            H2H History
          </button>
          <button
            onClick={() => setActiveSubTab("ai")}
            className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded transition-all ${
              activeSubTab === "ai"
                ? "bg-[#E9A84A] text-[#171311]"
                : "text-[#A0886B] hover:text-white"
            }`}
          >
            💬 AI Comment
          </button>
        </div>

        {/* View in Widget Button */}
        {onActivate && (
          <button
            onClick={onActivate}
            className="text-[9px] font-bold text-[#E9A84A] hover:underline bg-[#E9A84A]/10 px-2 py-0.5 rounded border border-[#E9A84A]/20 transition-all hover:bg-[#E9A84A]/25"
          >
            👉 View in Widget
          </button>
        )}
      </div>

      {/* Stats Tab */}
      {activeSubTab === "stats" && match.status !== "scheduled" && (
        <div className="flex flex-col gap-2 font-mono text-[10px]">
          {/* Possession */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between font-sans text-[9px] text-[#8F7D74] font-bold">
              <span>POSSESSION</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>{details.stats.possession.home}%</span>
              <div className="flex-1 mx-3 h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${details.stats.possession.home}%`,
                    background: "#E8744A",
                  }}
                />
                <div
                  style={{
                    width: `${details.stats.possession.away}%`,
                    background: "#A0886B",
                  }}
                />
              </div>
              <span>{details.stats.possession.away}%</span>
            </div>
          </div>

          {/* Shots */}
          <div className="flex justify-between items-center border-t border-white/5 pt-1">
            <span className="text-[#8F7D74] font-sans">SHOTS ON TARGET</span>
            <span className="font-bold">
              {details.stats.shots.home} - {details.stats.shots.away}
            </span>
          </div>

          {/* Fouls */}
          <div className="flex justify-between items-center border-t border-white/5 pt-1">
            <span className="text-[#8F7D74] font-sans">FOULS</span>
            <span className="font-bold">
              {details.stats.fouls.home} - {details.stats.fouls.away}
            </span>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeSubTab === "events" && match.status !== "scheduled" && (
        <div className="flex flex-col gap-1.5 text-[10px] max-h-[120px] overflow-y-auto">
          {details.events.length === 0 ? (
            <span className="text-center text-[#8F7D74] py-2">
              No key events recorded yet.
            </span>
          ) : (
            details.events.map((e, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 ${e.team === "away" ? "flex-row-reverse text-right" : "text-left"}`}
              >
                <span className="font-bold text-[#E9A84A] min-w-[24px]">
                  {e.minute}'
                </span>
                <span className="text-white/95 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  {e.text}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* H2H History Tab */}
      {(activeSubTab === "h2h" ||
        (match.status === "scheduled" &&
          activeSubTab !== "h2h" &&
          activeSubTab !== "ai")) && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-[#8F7D74] font-bold">LAST 5 MATCHUPS:</span>
            <span className="font-mono">Avg Goals: {details.avgGoals}</span>
          </div>
          {/* outcome blocks */}
          <div className="flex gap-1.5 h-6">
            {details.h2hHistory.map((h, idx) => {
              let bg = "rgba(255,255,255,0.05)";
              let label = "D";
              let color = "#A0886B";
              if (h.outcome === "H") {
                bg = "rgba(232,116,74,0.15)";
                label = "W";
                color = "#E8744A";
              } else if (h.outcome === "A") {
                bg = "rgba(224,83,83,0.1)";
                label = "L";
                color = "#E05353";
              }
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-center rounded border border-white/5 text-[9px] font-bold font-mono"
                  style={{ background, color }}
                  title={`${h.homeGoals} - ${h.awayGoals}`}
                >
                  <span>{label}</span>
                  <span className="text-[7px] text-[#8F7D74] font-normal">
                    {h.homeGoals}-{h.awayGoals}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Commentary Tab */}
      {activeSubTab === "ai" && <AiCommentary match={match} />}
    </div>
  );
}

function AiCommentary({ match }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const fetchAiAnalysis = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const text = await window.electronAPI?.askAiAboutGame({
        home: match.homeTeam.name,
        away: match.awayTeam.name,
        comp: match.competition.name,
        status: match.status,
        score: match.score,
        scorers: match.scorers,
      });
      setResponse(text || "No commentary returned.");
    } catch (err) {
      setResponse("Connection error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiAnalysis();
  }, [match.id]);

  return (
    <div className="flex flex-col gap-2 font-mono text-[9px] text-[#F5E6D3]">
      {loading ? (
        <span className="animate-pulse text-[#E9A84A] font-bold">
          🤖 CONNECTING TO RETRO NET...
        </span>
      ) : (
        <div className="bg-black/45 p-2.5 rounded-lg border border-white/5 leading-relaxed whitespace-pre-wrap">
          {response}
        </div>
      )}
      <button
        onClick={fetchAiAnalysis}
        disabled={loading}
        className="text-[8px] font-bold text-[#A0886B] hover:text-white underline text-left cursor-pointer disabled:opacity-50 mt-1"
      >
        ↻ Refresh Analysis
      </button>
    </div>
  );
}

// ── Single match row ──────────────────────────────────────────────────────────

function MatchRow({
  match,
  compact,
  onClick,
  isActive,
  isExpanded,
  onActivate,
}) {
  if (!match) return null;
  const homeTeam = match.homeTeam || {};
  const awayTeam = match.awayTeam || {};
  const competition = match.competition || {};
  const status = match.status || "scheduled";
  const score = match.score || { home: null, away: null };

  const isFinished = status === "finished";
  const isLive = status === "live";
  const hasScore = isLive || isFinished;

  const home = compact
    ? homeTeam.shortName || homeTeam.name || "TBA"
    : homeTeam.name || "TBA";
  const away = compact
    ? awayTeam.shortName || awayTeam.name || "TBA"
    : awayTeam.name || "TBA";

  return (
    <div
      className="w-full border-b border-white/5 transition-all duration-100"
      style={{
        background: isActive ? "rgba(232,116,74,0.06)" : "transparent",
      }}
    >
      <button
        onClick={onClick}
        className="w-full text-left px-3 py-[7px] no-drag transition-colors duration-100 hover:bg-white/5"
        style={{
          borderLeft: isActive ? "2px solid #E8744A" : "2px solid transparent",
          cursor: "pointer",
        }}
      >
        {/* Top line: competition + status */}
        <div className="flex justify-between items-center mb-[3px]">
          <span style={T.comp}>{competition.shortName}</span>
          <div className="flex items-center gap-1.5">
            {isExpanded && (
              <span className="text-[7px] text-[#A0886B]">▼ DETAILS</span>
            )}
            <StatusBadge match={match} />
          </div>
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-1">
          <span
            style={{
              ...T.teamName,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {home}
          </span>
          <div className="flex items-center gap-[5px] flex-shrink-0 px-1">
            {hasScore ? (
              <>
                <span style={T.score}>{score.home}</span>
                <span
                  style={{
                    color: "#5A4232",
                    fontFamily: "monospace",
                    fontSize: "10px",
                  }}
                >
                  –
                </span>
                <span style={T.score}>{score.away}</span>
              </>
            ) : (
              <span
                style={{
                  color: "#3D2E22",
                  fontFamily: "monospace",
                  fontSize: "9px",
                }}
              >
                vs
              </span>
            )}
          </div>
          <span
            style={{
              ...T.teamName,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "right",
            }}
          >
            {away}
          </span>
        </div>

        {/* Scorers */}
        <Scorers scorers={match.scorers} compact={compact} />

        {/* Broadcaster (upcoming only) */}
        {status === "scheduled" && !compact && (
          <div className="mt-[4px]">
            <BroadcasterBadge broadcaster={match.broadcaster} />
          </div>
        )}
      </button>

      {/* Expanded Match Details tab */}
      {isExpanded && (
        <MatchDetailDrawer match={match} onActivate={onActivate} />
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-2 pb-1">
      <span style={T.section}>{label}</span>
      <div
        className="flex-1"
        style={{ height: 1, background: "rgba(255,255,255,0.05)" }}
      />
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function MatchPanel() {
  const viewMode = useWidgetStore((s) => s.viewMode);
  const matches = useWidgetStore((s) => s.matches);
  const recentMatches = useWidgetStore((s) => s.recentMatches);
  const currentMatchIndex = useWidgetStore((s) => s.currentMatchIndex);
  const currentMatch = useWidgetStore((s) => s.currentMatch);
  const closePanel = useWidgetStore((s) => s.closePanel);
  const goToMatch = useWidgetStore((s) => s.goToMatch);
  const showFollowedOnly = useWidgetStore((s) => s.showFollowedOnly);
  const customTheme = useWidgetStore((s) => s.customTheme);

  const expandedMatchId = useWidgetStore((s) => s.expandedMatchId);
  const setExpandedMatchId = useWidgetStore((s) => s.setExpandedMatchId);

  const compact = viewMode === "compact";
  const upcoming = matches.slice(0, 10);

  // ── Tab state: 'fixtures' | 'standings' ──────────────────────────────────
  const [panelTab, setPanelTab] = useState("fixtures");

  const currentComp = currentMatch?.competition?.shortName || "";
  const standingsSlug =
    currentComp === "PL"
      ? "eng.1"
      : currentComp === "WC 2026"
        ? "fifa.world"
        : currentComp === "UCL"
          ? "uefa.champions"
          : currentComp === "LaLiga"
            ? "esp.1"
            : currentComp === "Bund."
              ? "ger.1"
              : currentComp === "SerieA"
                ? "ita.1"
                : currentComp === "L1"
                  ? "fra.1"
                  : "eng.1";

  return (
    <div
      className="flex flex-col drag-region"
      style={{
        flex: 1,
        overflow: "hidden",
        background: "rgba(0, 0, 0, 0.15)",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center px-3 py-2 flex-shrink-0 no-drag">
        <div className="flex items-center gap-2">
          <span style={{ ...T.section, color: "#A0886B", fontSize: "7px" }}>
            ⚽{" "}
            {panelTab === "standings"
              ? "STANDINGS"
              : showFollowedOnly
                ? "FOLLOWED TEAMS"
                : "FIXTURES & RESULTS"}
          </span>
          {/* Tab switcher */}
          <button
            onClick={() =>
              setPanelTab(panelTab === "fixtures" ? "standings" : "fixtures")
            }
            className="text-[7px] font-bold px-1.5 py-0.5 rounded-full cursor-pointer transition-all"
            style={{
              color: panelTab === "standings" ? "#E9A84A" : "#5A4232",
              background:
                panelTab === "standings"
                  ? "rgba(233,168,74,0.12)"
                  : "transparent",
              border:
                panelTab === "standings"
                  ? "1px solid rgba(233,168,74,0.2)"
                  : "1px solid rgba(255,255,255,0.05)",
              fontFamily: "Inter, sans-serif",
              fontSize: "6px",
            }}
          >
            🏆
          </button>
          {showFollowedOnly && (
            <span
              className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                color: "#E9A84A",
                background: "rgba(233,168,74,0.12)",
                border: "1px solid rgba(233,168,74,0.2)",
                fontFamily: "Inter, sans-serif",
                fontSize: "6px",
              }}
            >
              ★
            </span>
          )}
          {showFollowedOnly && customTheme?.favoriteTeams && (
            <span
              style={{
                color: "#5A4232",
                fontFamily: "Inter, sans-serif",
                fontSize: "7px",
              }}
            >
              {customTheme.favoriteTeams.length} teams
            </span>
          )}
        </div>
        <button
          onClick={closePanel}
          className="w-5 h-5 flex items-center justify-center rounded cursor-pointer"
          style={{
            color: "#5A4232",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      {/* ── Standings Tab ──────────────────────────────────────────────────── */}
      {panelTab === "standings" ? (
        <div
          className="flex-1 overflow-y-auto no-drag"
          style={{ scrollbarWidth: "thin" }}
        >
          <StandingsWidget leagueSlug={standingsSlug} limit={12} />
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto no-drag"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* RECENT RESULTS */}
          {recentMatches.length > 0 && (
            <>
              <SectionHeader label="RESULTS" />
              {recentMatches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  compact={compact}
                  isExpanded={expandedMatchId === m.id}
                  onClick={() =>
                    setExpandedMatchId(expandedMatchId === m.id ? null : m.id)
                  }
                  isActive={false}
                  onActivate={null}
                />
              ))}
            </>
          )}

          {/* UPCOMING + LIVE */}
          {upcoming.length > 0 && (
            <>
              <SectionHeader
                label={recentMatches.length > 0 ? "UPCOMING" : "FIXTURES"}
              />
              {upcoming.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  compact={compact}
                  isActive={currentMatch && m.id === currentMatch.id}
                  isExpanded={expandedMatchId === m.id}
                  onClick={() =>
                    setExpandedMatchId(expandedMatchId === m.id ? null : m.id)
                  }
                  onActivate={() => {
                    goToMatch(m.id);
                    closePanel();
                  }}
                />
              ))}
            </>
          )}

          {recentMatches.length === 0 && upcoming.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span
                style={{
                  color: "#3D2E22",
                  fontFamily: '"Press Start 2P"',
                  fontSize: "7px",
                }}
              >
                No fixtures found
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
