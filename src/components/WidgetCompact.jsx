/**
 * WidgetCompact  (210 × 220 px)
 */

import React, { useCallback, useState, useEffect } from "react";
import { useWidgetStore } from "../store/widgetStore";
import { useFootballData } from "../hooks/useFootballData";
import { useCountdown } from "../hooks/useCountdown";
import PixelMascot from "./PixelMascot";
import TeamCrest from "./TeamCrest";
import BroadcasterBadge from "./BroadcasterBadge";

function IconBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="no-drag w-5 h-5 flex items-center justify-center rounded-full text-[#8F7D74] hover:text-w-text hover:bg-white/10 transition-all duration-150 active:scale-90 text-[11px]"
    >
      {children}
    </button>
  );
}

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

export default function WidgetCompact() {
  const {
    currentMatch,
    mascotState,
    matches,
    currentMatchIndex,
    isLoading,
    setViewMode,
    cycleViewMode,
    nextMatch,
    prevMatch,
    goToMatch,
    togglePanel,
    toggleWidgetAi,
    customTheme,
  } = useWidgetStore();

  const { refresh } = useFootballData();
  const isLive = currentMatch?.status === "live";
  const hasScore = isLive && currentMatch?.score?.home !== null && currentMatch?.score?.away !== null;
  const countdown = useCountdown(currentMatch?.kickoff, currentMatch?.status);

  const theme = customTheme || {};
  const textColor = theme.textColor || "#F5E6D3";
  const accentColor = theme.accentColor || "#E9A84A";

  // ── Auto Hide Mouse Handlers ──────────────────────────────────────────────
  const handleMouseEnter = () => {
    if (theme.autoHideEnabled) {
      window.electronAPI?.setAutoHideSlide("show", "compact");
    }
  };
  const handleMouseLeave = () => {
    if (theme.autoHideEnabled) {
      window.electronAPI?.setAutoHideSlide("hide", "compact");
    }
  };

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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading && matches.length === 0) {
    return (
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="widget-card w-full flex-shrink-0 h-[220px] flex flex-col items-center justify-center gap-3 drag-region"
      >
        <PixelMascot state="idle" pixelSize={5} animate />
        <span
          className="animate-pulse font-serif-premium text-[11px]"
          style={{ color: "#A0886B" }}
        >
          Loading…
        </span>
      </div>
    );
  }

  // ── Utility Mode Render / No fixtures ──────────────────────────────────────
  if (!currentMatch) {
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
        className="w-full flex-shrink-0 h-[213px] flex flex-col drag-region relative bg-transparent"
      >
        {/* Top bar controls */}
        <div className="flex justify-between items-center px-3 pt-3">
          <span
            style={{
              color: "#8F7D74",
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: "8px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Idle Utility
          </span>
          <div className="flex gap-[2px] no-drag">
            <IconBtn onClick={togglePanel} title="All fixtures">
              ☰
            </IconBtn>
            <IconBtn onClick={cycleViewMode} title="Cycle view size">
              ⊞
            </IconBtn>
            <IconBtn onClick={() => window.electronAPI?.openCustomizer?.()} title="Customize UI (⚙)">
              ⚙
            </IconBtn>
            <IconBtn onClick={refresh} title="Refresh">
              ↻
            </IconBtn>
          </div>
        </div>

        {/* Mascot */}
        <div className="flex justify-center pt-2 pb-1">
          <PixelMascot state={mascotStateToRender} pixelSize={6} animate />
        </div>

        {/* Dashboard info */}
        <div className="flex-grow flex flex-col items-center justify-center px-4 drag-region pb-3">
          {theme.utilityMode === "cpu" ? (
            <div className="w-full flex flex-col gap-1 text-[10px] text-center font-mono">
              <div className="flex justify-between font-bold text-[#8F7D74]">
                <span>CPU</span>
                <span>{sysInfo.cpu}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                <div style={{ width: `${sysInfo.cpu}%`, background: '#E8744A' }} />
              </div>
              
              <div className="flex justify-between font-bold text-[#8F7D74] mt-1">
                <span>RAM</span>
                <span>{sysInfo.ram}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                <div style={{ width: `${sysInfo.ram}%`, background: '#E9A84A' }} />
              </div>
            </div>
          ) : theme.utilityMode === "weather" ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-serif-premium text-[15px] font-semibold text-w-text">
                {weather ? `${weather.temp}°C` : "--°C"}
              </span>
              <span className="font-sans-premium text-[8px] text-[#8F7D74] uppercase tracking-wider font-bold">
                {weather ? getWeatherDesc(weather.code) : "Loading..."}
              </span>
              <span className="font-sans-premium text-[8px] text-[#8F7D74] mt-0.5">
                📍 {theme.weatherCity || "London"}
              </span>
            </div>
          ) : (
            <span className="font-serif-premium text-[11px] text-[#A0886B] text-center">
              No fixtures scheduled
            </span>
          )}
        </div>
      </div>
    );
  }

  const m = currentMatch;

  const cardStyle = {
    borderRadius: theme.borderRadius || "24px",
    background: isLive
      ? `linear-gradient(135deg, ${theme.alertBgStart || "#7E492F"} 0%, ${theme.alertBgEnd || "#3D2114"} 100%)`
      : `linear-gradient(135deg, ${theme.defaultBgStart || "#2D2520"} 0%, ${theme.defaultBgEnd || "#171311"} 100%)`,
    borderColor: isLive ? "rgba(255, 120, 70, 0.25)" : "rgba(255, 255, 255, 0.08)",
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full flex-shrink-0 h-[213px] flex flex-col animate-fade-in relative bg-transparent`}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center px-3 pt-3 drag-region">
        <span
          style={{
            color: "#8F7D74",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: "8px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: "600",
          }}
        >
          {m.competition.shortName || m.competition.name}
        </span>
        <div className="flex gap-[2px] no-drag">
          <IconBtn onClick={() => toggleWidgetAi(m.id)} title="AI Commentary (💬)">
            💬
          </IconBtn>
          <IconBtn onClick={togglePanel} title="All fixtures">
            ☰
          </IconBtn>
          <IconBtn onClick={cycleViewMode} title="Cycle view size">
            ⊞
          </IconBtn>
          <IconBtn onClick={() => window.electronAPI?.openCustomizer?.()} title="Customize UI (⚙)">
            ⚙
          </IconBtn>
          <IconBtn onClick={refresh} title="Refresh">
            ↻
          </IconBtn>
        </div>
      </div>

      {/* ── Mascot ────────────────────────────────────────────────────────── */}
      <div className="flex justify-center pt-2 pb-1">
        <PixelMascot
          state={mascotState}
          pixelSize={6}
          animate
          showAlert={isLive || mascotState === "alert"}
        />
      </div>

      {/* ── Match info ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 gap-[3px] drag-region pb-1">
        <div className="flex items-center gap-[6px] w-full justify-center">
          <TeamCrest logo={m.homeTeam.logo} name={m.homeTeam.name} size={18} />
          <div 
            className="font-serif-premium text-[13px] font-medium leading-none text-center flex items-center gap-[3px]"
            style={{ color: textColor }}
          >
            <span className="truncate max-w-[55px]">{m.homeTeam.shortName}</span>
            <span className="text-[10px] font-sans-premium text-[#8F7D74] font-normal px-[1px]">vs</span>
            <span className="truncate max-w-[55px]">{m.awayTeam.shortName}</span>
          </div>
          <TeamCrest logo={m.awayTeam.logo} name={m.awayTeam.name} size={18} />
        </div>

        {isLive ? (
          <div className="flex flex-col items-center gap-[1px]">
            <span className="font-serif-premium text-[12px] text-[#E05353] font-medium flex items-center gap-1">
              <span className="text-[8px] leading-none animate-pulse-alert">●</span>
              Live {m.liveMinute ? `${m.liveMinute}'` : ""}
            </span>
            {hasScore && (
              <span 
                className="font-serif-premium text-[14px] font-semibold tracking-wider"
                style={{ color: textColor }}
              >
                {m.score.home} – {m.score.away}
              </span>
            )}
          </div>
        ) : m.status === "finished" ? (
          <div className="flex flex-col items-center gap-[1px]">
            <span className="font-serif-premium text-[12px] text-[#A0886B] font-medium flex items-center gap-1">
              ● Full Time
            </span>
            <span 
              className="font-serif-premium text-[14px] font-semibold tracking-wider"
              style={{ color: textColor }}
            >
              {m.score.home} – {m.score.away}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-[1px]">
            <span className="font-serif-premium text-[12px] text-[#52B788] font-medium flex items-center gap-1">
              ● Scheduled
            </span>
            <span className="font-sans-premium text-[10px] text-[#8F7D74]">
              {m.kickoffUK} {countdown ? `· ⏱ ${countdown}` : ""}
            </span>
          </div>
        )}

        {m.broadcaster && m.broadcaster !== "Not Televised" && (
          <div className="mt-1 scale-90">
            <BroadcasterBadge broadcaster={m.broadcaster} />
          </div>
        )}
      </div>

      {/* ── Navigation dots & arrows ─────────────────────────────────────── */}
      {matches.length > 1 && (
        <div className="flex justify-center items-center pb-[10px] no-drag gap-3">
          <button
            onClick={prevMatch}
            className="text-w-faint hover:text-w-text text-[14px] px-1 transition-colors leading-none font-sans-premium cursor-pointer"
            title="Previous match"
          >
            ‹
          </button>
          <div className="flex gap-[4px] items-center">
            {Array.from({ length: Math.min(matches.length, 5) }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToMatch(i)}
                className="rounded-full transition-all cursor-pointer"
                style={{
                  width: i === currentMatchIndex ? "6px" : "4px",
                  height: i === currentMatchIndex ? "6px" : "4px",
                  backgroundColor: i === currentMatchIndex ? accentColor : "#3D2E22",
                }}
              />
            ))}
          </div>
          <button
            onClick={nextMatch}
            className="text-w-faint hover:text-w-text text-[14px] px-1 transition-colors leading-none font-sans-premium cursor-pointer"
            title="Next match"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
