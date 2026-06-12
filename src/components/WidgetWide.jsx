/**
 * WidgetWide  (490 × 185 px)
 */

import React, { useCallback, useEffect, useState } from "react";
import { useWidgetStore } from "../store/widgetStore";
import { useFootballData } from "../hooks/useFootballData";
import { useCountdown } from "../hooks/useCountdown";
import PixelMascot from "./PixelMascot";
import PredictionBar from "./PredictionBar";
import BroadcasterBadge from "./BroadcasterBadge";
import TeamCrest from "./TeamCrest";

function IconButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="no-drag w-6 h-6 flex items-center justify-center rounded-full text-[#8F7D74] hover:text-w-text hover:bg-white/10 transition-all duration-150 active:scale-90 text-[12px]"
    >
      {children}
    </button>
  );
}

function MatchDots({ total, current, onDotClick }) {
  const customTheme = useWidgetStore((s) => s.customTheme);
  const dotColor = customTheme?.accentColor || "#E9A84A";

  if (total <= 1) return null;
  return (
    <div className="flex gap-[4px] items-center no-drag">
      {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className="rounded-full transition-all hover:scale-125 cursor-pointer"
          style={{
            width: i === current ? "6px" : "4px",
            height: i === current ? "6px" : "4px",
            backgroundColor: i === current ? dotColor : "#3D2E22",
          }}
        />
      ))}
      {total > 8 && (
        <span
          style={{ color: "#5A4232", fontFamily: "monospace", fontSize: "8px" }}
        >
          +{total - 8}
        </span>
      )}
    </div>
  );
}

function LiveBadge({ minute, score }) {
  const hasScore = score?.home !== null && score?.away !== null;
  return (
    <div className="flex items-center gap-[6px] font-serif-premium text-[15px] text-[#E05353] font-medium">
      <span className="text-[10px] leading-none animate-pulse-alert">●</span>
      Live {hasScore ? `• ${score.home} – ${score.away}` : ""} {minute ? `(${minute}')` : ""}
    </div>
  );
}

function MatchHeader({ m }) {
  const countdown = useCountdown(m.kickoff, m.status);
  const isLive = m.status === "live";
  const hasScore = m.score?.home !== null && m.score?.away !== null;
  const customTheme = useWidgetStore((s) => s.customTheme);
  const textColor = customTheme?.textColor || "#F5E6D3";

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
      <div 
        className="flex items-center gap-2 font-serif-premium text-[16px] font-medium leading-none min-w-0"
        style={{ color: textColor }}
      >
        <TeamCrest logo={m.homeTeam.logo} name={m.homeTeam.name} size={18} />
        <span className="truncate max-w-[130px]">{m.homeTeam.name}</span>
        <span className="text-[11px] font-sans-premium text-[#8F7D74] font-normal px-[2px]">vs</span>
        <span className="truncate max-w-[130px]">{m.awayTeam.name}</span>
        <TeamCrest logo={m.awayTeam.logo} name={m.awayTeam.name} size={18} />
      </div>

      {isLive ? (
        <LiveBadge minute={m.liveMinute} score={m.score} />
      ) : m.status === "finished" ? (
        <div className="flex items-center gap-[6px] font-serif-premium text-[15px] text-[#A0886B] font-medium">
          <span className="text-[10px] leading-none">●</span>
          Full Time {hasScore ? `• ${m.score.home} – ${m.score.away}` : ""}
        </div>
      ) : (
        <div className="flex items-center gap-[6px] font-serif-premium text-[15px] text-[#52B788] font-medium">
          <span className="text-[10px] leading-none">●</span>
          Scheduled {countdown ? `• ⏱ ${countdown}` : ""}
        </div>
      )}

      <div className="font-sans-premium text-[11px] text-[#8F7D74] mt-[1px] tracking-wide font-normal flex items-center gap-2 flex-wrap min-w-0">
        <span className="truncate">{m.competition.name}</span>
        <span>·</span>
        <span className="whitespace-nowrap">{m.kickoffUK}</span>
        {m.venue && (
          <>
            <span>·</span>
            <span className="truncate max-w-[120px]">📍 {m.venue}</span>
          </>
        )}
        {m.broadcaster && m.broadcaster !== "Not Televised" && (
          <>
            <span>·</span>
            <BroadcasterBadge broadcaster={m.broadcaster} className="scale-90 origin-left" />
          </>
        )}
      </div>
    </div>
  );
}

// ── Typography reference helpers for utility ────────────────────────────────
const T = {
  comp: { fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#8F7D74', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' },
};

function getWeatherDesc(code) {
  if (code === 0) return "Clear Sky";
  if (code >= 1 && code <= 3) return "Partly Cloudy";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 67) return "Rainy";
  if (code >= 71 && code <= 77) return "Snowy";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow Showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Cloudy";
}

function getWeatherMascotState(code) {
  if (code === 0) return "idle";
  if (code >= 1 && code <= 48) return "sleep";
  if (code >= 51 && code <= 99) return "alert";
  return "sleep";
}

export default function WidgetWide() {
  const {
    matches,
    currentMatchIndex,
    currentMatch,
    mascotState,
    isLoading,
    error,
    setViewMode,
    cycleViewMode,
    nextMatch,
    prevMatch,
    goToMatch,
    togglePanel,
    toggleWidgetAi,
    customTheme,
    setCustomTheme,
  } = useWidgetStore();

  const { refresh } = useFootballData();

  const theme = customTheme || {};

  // ── Utility Mode CPU/RAM state ─────────────────────────────────────────────
  const [sysInfo, setSysInfo] = useState({ cpu: 0, ram: 0 });
  useEffect(() => {
    if (currentMatch || theme.utilityMode !== "cpu") return;
    const loadStats = async () => {
      const info = await window.electronAPI?.getSystemInfo();
      if (info) setSysInfo(info);
    };
    loadStats();
    const timer = setInterval(loadStats, 2500);
    return () => clearInterval(timer);
  }, [currentMatch, theme.utilityMode]);

  // ── Utility Mode Weather state ─────────────────────────────────────────────
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    if (currentMatch || theme.utilityMode !== "weather") return;
    const fetchWeather = async () => {
      try {
        const lat = theme.weatherCoords?.lat ?? 51.5074;
        const lon = theme.weatherCoords?.lon ?? -0.1278;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
        const data = await res.json();
        if (data?.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
          });
        }
      } catch (_) {}
    };
    fetchWeather();
    const timer = setInterval(fetchWeather, 300000); // 5 min
    return () => clearInterval(timer);
  }, [currentMatch, theme.utilityMode, theme.weatherCoords]);

  // ── Auto Hide Mouse Handlers ──────────────────────────────────────────────
  const handleMouseEnter = () => {
    if (theme.autoHideEnabled) {
      window.electronAPI?.setAutoHideSlide("show", "wide");
    }
  };
  const handleMouseLeave = () => {
    if (theme.autoHideEnabled) {
      window.electronAPI?.setAutoHideSlide("hide", "wide");
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading && matches.length === 0) {
    return (
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="widget-card w-full flex-shrink-0 h-[185px] flex items-center justify-center drag-region relative"
      >
        <PixelMascot state="idle" pixelSize={4} animate />
        <span
          className="ml-3 animate-pulse font-serif-premium text-[13px]"
          style={{ color: "#A0886B" }}
        >
          Loading…
        </span>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && matches.length === 0) {
    return (
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="widget-card w-full flex-shrink-0 h-[185px] flex flex-col items-center justify-center gap-2 drag-region p-4 relative"
      >
        <PixelMascot state="sleep" pixelSize={4} />
        <span
          className="font-serif-premium text-[11px] text-center"
          style={{ color: "#E05353" }}
        >
          {error}
        </span>
        <button
          onClick={refresh}
          className="no-drag text-[#8F7D74] hover:text-w-text text-[10px] underline font-sans-premium cursor-pointer"
        >
          retry
        </button>
      </div>
    );
  }

  // ── Utility Mode Render / No fixtures ──────────────────────────────────────
  if (!currentMatch) {
    const isLiveMode = false;
    const cardStyle = {
      borderRadius: theme.borderRadius || "24px",
      background: `linear-gradient(135deg, ${theme.defaultBgStart || "#2D2520"} 0%, ${theme.defaultBgEnd || "#171311"} 100%)`,
      borderColor: "rgba(255, 255, 255, 0.08)",
    };

    let mascotStateToRender = "sleep";
    if (theme.utilityMode === "weather" && weather) {
      mascotStateToRender = getWeatherMascotState(weather.code);
    } else if (theme.utilityMode === "cpu" && sysInfo.cpu > 50) {
      mascotStateToRender = "hype";
    } else if (theme.utilityMode === "cpu") {
      mascotStateToRender = "idle";
    }

    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full flex-shrink-0 h-[185px] flex items-center justify-between px-6 drag-region relative border"
        style={cardStyle}
      >
        {/* Mascot */}
        <PixelMascot state={mascotStateToRender} pixelSize={5} animate />

        {/* Dashboard display */}
        <div className="flex-1 ml-5 flex flex-col gap-1.5 justify-center min-w-0 pr-6">
          {theme.utilityMode === "cpu" ? (
            <div className="flex flex-col gap-1">
              <span style={T.comp}>System Status</span>
              
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[8px] text-[#8F7D74] font-bold font-mono">
                  <span>CPU LOAD</span>
                  <span>{sysInfo.cpu}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                  <div style={{ width: `${sysInfo.cpu}%`, background: '#E8744A' }} />
                </div>
              </div>

              <div className="flex flex-col gap-0.5 mt-1">
                <div className="flex justify-between text-[8px] text-[#8F7D74] font-bold font-mono">
                  <span>RAM LOAD</span>
                  <span>{sysInfo.ram}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                  <div style={{ width: `${sysInfo.ram}%`, background: '#E9A84A' }} />
                </div>
              </div>
            </div>
          ) : theme.utilityMode === "weather" ? (
            <div className="flex flex-col gap-1">
              <span style={T.comp}>Local Weather</span>
              <div className="font-serif-premium text-[18px] font-medium leading-none flex items-baseline gap-1.5 text-w-text">
                <span>{weather ? `${weather.temp}°C` : "--°C"}</span>
                <span className="font-sans-premium text-[10px] text-[#8F7D74] uppercase tracking-wider font-semibold">
                  {weather ? getWeatherDesc(weather.code) : "Loading..."}
                </span>
              </div>
              <div className="font-sans-premium text-[9px] text-[#8F7D74] mt-0.5">
                📍 {theme.weatherCity || "London"}
              </div>
            </div>
          ) : (
            <div>
              <div className="font-serif-premium text-[15px] text-w-text font-medium mb-[2px]">
                No fixtures
              </div>
              <div className="font-sans-premium text-[11px] text-[#8F7D74]">
                Nothing scheduled today
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1 no-drag">
          <IconButton onClick={togglePanel} title="All fixtures">
            ☰
          </IconButton>
          <IconButton onClick={refresh} title="Refresh">
            ↻
          </IconButton>
          <IconButton onClick={cycleViewMode} title="Cycle view size">
            ⊡
          </IconButton>
          <IconButton onClick={() => window.electronAPI?.openCustomizer?.()} title="Customize UI (⚙)">
            ⚙
          </IconButton>
        </div>
      </div>
    );
  }

  const m = currentMatch;
  const isLive = m.status === "live";

  const cardStyle = {
    borderRadius: theme.borderRadius || "24px",
    background: isLive
      ? `linear-gradient(135deg, ${theme.alertBgStart || "#7E492F"} 0%, ${theme.alertBgEnd || "#3D2114"} 100%)`
      : `linear-gradient(135deg, ${theme.defaultBgStart || "#2D2520"} 0%, ${theme.defaultBgEnd || "#171311"} 100%)`,
    borderColor: isLive ? "rgba(255, 120, 70, 0.25)" : "rgba(255, 255, 255, 0.08)",
  };

  const currentVote = theme.predictions?.[m.id] || null;
  const castVote = (vote) => {
    const updated = {
      ...(theme.predictions || {}),
      [m.id]: vote,
    };
    // Score updates: simulated point award on vote cast
    const nextPoints = theme.predictionScore + 1;
    setCustomTheme({
      predictions: updated,
      predictionScore: nextPoints,
    });
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full flex-shrink-0 h-[178px] flex flex-col animate-fade-in relative bg-transparent`}
    >
      {/* ── Top row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center flex-1 px-5 pt-5 pb-2 drag-region gap-4 min-w-0">
        <div className="flex-shrink-0 self-center">
          <PixelMascot
            state={mascotState}
            pixelSize={5}
            animate
            showAlert={isLive}
          />
        </div>

        <MatchHeader m={m} />

        <div className="absolute top-4 right-4 flex items-center gap-[4px] no-drag">
          <IconButton onClick={() => toggleWidgetAi(m.id)} title="AI Commentary (💬)">
            💬
          </IconButton>
          <IconButton onClick={togglePanel} title="All fixtures (☰)">
            ☰
          </IconButton>
          <IconButton onClick={cycleViewMode} title="Cycle view size">
            ⊡
          </IconButton>
          <IconButton onClick={() => window.electronAPI?.openCustomizer?.()} title="Customize UI (⚙)">
            ⚙
          </IconButton>
          <IconButton onClick={refresh} title="Refresh">
            ↻
          </IconButton>
        </div>
      </div>

      <div className="widget-divider mx-5" />

      {/* ── Bottom row: Prediction Bar with voting ───────────────────────── */}
      <div className="px-5 pb-3 pt-[10px]">
        <PredictionBar
          home={m.prediction.home}
          draw={m.prediction.draw}
          away={m.prediction.away}
          matchId={m.id}
          currentVote={currentVote}
          onVote={castVote}
        />
      </div>

      {/* ── Floating Navigation Arrows ───────────────────────────────────── */}
      {matches.length > 1 && (
        <>
          <button
            onClick={prevMatch}
            className="absolute left-2 top-[40%] -translate-y-1/2 no-drag w-6 h-6 flex items-center justify-center rounded-full text-w-faint hover:text-w-text hover:bg-white/5 transition-all duration-150 active:scale-90 text-[18px] font-sans-premium cursor-pointer"
            title="Previous match"
          >
            ‹
          </button>
          <button
            onClick={nextMatch}
            className="absolute right-2 top-[40%] -translate-y-1/2 no-drag w-6 h-6 flex items-center justify-center rounded-full text-w-faint hover:text-w-text hover:bg-white/5 transition-all duration-150 active:scale-90 text-[18px] font-sans-premium cursor-pointer"
            title="Next match"
          >
            ›
          </button>
        </>
      )}

      {matches.length > 1 && (
        <div className="flex justify-center pb-[8px]">
          <MatchDots
            total={matches.length}
            current={currentMatchIndex}
            onDotClick={goToMatch}
          />
        </div>
      )}
    </div>
  );
}
