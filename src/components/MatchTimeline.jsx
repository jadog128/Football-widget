/**
 * MatchTimeline — Visual event timeline for live matches.
 * Shows goals, cards, and substitutions as colored markers
 * along a horizontal bar scaled to 90 minutes.
 */

import React from "react";

const TOTAL_MINUTES = 90;

const EVENT_COLORS = {
  goal: { bg: "#52B788", icon: "⚽", label: "Goal" },
  penalty: { bg: "#52B788", icon: "⚽", label: "Penalty" },
  "own-goal": { bg: "#E05353", icon: "⚽", label: "Own Goal" },
  card: { bg: "#E9A84A", icon: "🟨", label: "Yellow Card" },
  sub: { bg: "#3B82F6", icon: "🔄", label: "Substitution" },
};

export default function MatchTimeline({ events = [], liveMinute }) {
  if (!events || events.length === 0) return null;

  const currentMinute = liveMinute ? parseInt(liveMinute, 10) : 90;
  const progress = Math.min(currentMinute / TOTAL_MINUTES, 1);

  // Filter events to only those within the current match duration
  const visibleEvents = events.filter((e) => {
    const min = parseInt(e.minute, 10);
    return !isNaN(min) && min <= currentMinute;
  });

  if (visibleEvents.length === 0) return null;

  return (
    <div className="w-full px-1" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Timeline bar */}
      <div className="relative h-5 w-full">
        {/* Background track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-full h-[3px] rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        {/* Progress fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-[3px] rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, rgba(82,183,136,0.5), rgba(233,168,74,0.5))",
          }}
        />

        {/* Event markers */}
        {visibleEvents.map((e, i) => {
          const min = parseInt(e.minute, 10);
          const pos = Math.min(min / TOTAL_MINUTES, 1) * 100;
          const config = EVENT_COLORS[e.type] || EVENT_COLORS.goal;

          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
              style={{ left: `${pos}%`, zIndex: 10 }}
            >
              {/* Marker dot */}
              <div
                className="w-[6px] h-[6px] rounded-full border cursor-pointer transition-transform hover:scale-150"
                style={{
                  background: config.bg,
                  borderColor: "rgba(0,0,0,0.4)",
                  boxShadow: `0 0 4px ${config.bg}66`,
                }}
              />

              {/* Tooltip on hover */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap px-1.5 py-0.5 rounded text-[7px] font-bold z-20"
                style={{
                  background: "rgba(0,0,0,0.85)",
                  color: "#F5E6D3",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {config.icon} {e.text || `${e.type} ${min}'`}
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: "3px solid transparent",
                    borderRight: "3px solid transparent",
                    borderTop: "3px solid rgba(0,0,0,0.85)",
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Current minute marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${progress * 100}%`, zIndex: 5 }}
        >
          <div
            className="w-[2px] h-3 rounded-full"
            style={{ background: "#E05353", boxShadow: "0 0 6px rgba(224,83,83,0.6)" }}
          />
        </div>
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-2 mt-1 justify-center">
        {visibleEvents.slice(-5).map((e, i) => {
          const config = EVENT_COLORS[e.type] || EVENT_COLORS.goal;
          return (
            <span
              key={i}
              className="text-[6px] font-bold"
              style={{ color: "#8F7D74" }}
            >
              {config.icon} {e.minute}'
            </span>
          );
        })}
      </div>
    </div>
  );
}
