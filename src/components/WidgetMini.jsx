import React, { useState, useEffect } from "react";
import { useWidgetStore } from "../store/widgetStore";
import PixelMascot from "./PixelMascot";

export default function WidgetMini() {
  const { currentMatch, mascotState, cycleViewMode, customTheme } = useWidgetStore();
  const theme = customTheme || {};
  const textColor = theme.textColor || "#F5E6D3";

  // CPU metrics logic
  const [sysInfo, setSysInfo] = useState({ cpu: 0, ram: 0 });
  useEffect(() => {
    if (currentMatch || theme.utilityMode !== "cpu") return;
    const loadStats = async () => {
      const info = await window.electronAPI?.getSystemInfo();
      if (info) setSysInfo(info);
    };
    loadStats();
    const timer = setInterval(loadStats, 3000);
    return () => clearInterval(timer);
  }, [currentMatch, theme.utilityMode]);

  // Weather logic
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    if (currentMatch || theme.utilityMode !== "weather") return;
    const fetchWeather = async () => {
      try {
        const lat = theme.weatherCoords?.lat ?? 51.5074;
        const lon = theme.weatherCoords?.lon ?? -0.1278;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`);
        const data = await res.json();
        if (data?.current) {
          setWeather({ temp: Math.round(data.current.temperature_2m) });
        }
      } catch (_) {}
    };
    fetchWeather();
  }, [currentMatch, theme.utilityMode, theme.weatherCoords]);

  let labelText = "";
  if (currentMatch) {
    if (currentMatch.status === "live" || currentMatch.status === "finished") {
      labelText = `${currentMatch.score.home}-${currentMatch.score.away}`;
    } else {
      labelText = currentMatch.kickoffUK.split(" ")[0];
    }
  } else {
    if (theme.utilityMode === "cpu") {
      labelText = `C:${sysInfo.cpu}%`;
    } else if (theme.utilityMode === "weather" && weather) {
      labelText = `${weather.temp}°C`;
    } else {
      labelText = "Idle";
    }
  }

  // Hover resize cycle
  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center relative p-2 select-none drag-region"
      onDoubleClick={cycleViewMode}
      title="Double click to cycle size"
    >
      <PixelMascot state={mascotState} pixelSize={4} animate />
      <span 
        className="mt-1 font-mono text-[9px] font-bold"
        style={{ color: textColor }}
      >
        {labelText}
      </span>
      <button 
        onClick={cycleViewMode}
        className="absolute top-1 right-1 no-drag text-[8px] text-[#8F7D74] hover:text-white bg-black/45 rounded w-3.5 h-3.5 flex items-center justify-center cursor-pointer transition-colors"
        title="Cycle View Size"
      >
        ⊞
      </button>
    </div>
  );
}
