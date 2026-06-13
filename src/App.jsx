import React, { useEffect, useState, useCallback, useRef } from "react";
import { useWidgetStore } from "./store/widgetStore";
import { startUpdatePolling } from "./services/updateService";
import { useFootballData } from "./hooks/useFootballData";
import { useGoalNotify } from "./hooks/useGoalNotify";
import WidgetWide from "./components/WidgetWide";
import WidgetCompact from "./components/WidgetCompact";
import WidgetMini from "./components/WidgetMini";
import MatchPanel from "./components/MatchPanel";
import WidgetAiChatbox from "./components/WidgetAiChatbox";
// ToastNotification removed — toasts now appear in the floating notification window

export default function App() {
  const viewMode = useWidgetStore((s) => s.viewMode);
  const panelOpen = useWidgetStore((s) => s.panelOpen);
  const widgetAiOpen = useWidgetStore((s) => s.widgetAiOpen);
  const loadCustomTheme = useWidgetStore((s) => s.loadCustomTheme);
  const updateCustomThemeFromIpc = useWidgetStore(
    (s) => s.updateCustomThemeFromIpc,
  );
  const customTheme = useWidgetStore((s) => s.customTheme);
  const setCustomTheme = useWidgetStore((s) => s.setCustomTheme);
  const currentMatch = useWidgetStore((s) => s.currentMatch);
  const prevMatch = useWidgetStore((s) => s.prevMatch);
  const nextMatch = useWidgetStore((s) => s.nextMatch);

  const addNotification = useWidgetStore((s) => s.addNotification);

  const [isPinned, setIsPinned] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [deepseekOpen, setDeepseekOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

  // Background update checker
  useEffect(() => {
    const cleanup = startUpdatePolling(addNotification);
    return () => cleanup();
  }, [addNotification]);

  // Track DeepSeek window state
  useEffect(() => {
    window.electronAPI?.getDeepseekWidgetOpen?.().then(setDeepseekOpen);
    const unsub = window.electronAPI?.onDeepseekWidgetClosed?.(() =>
      setDeepseekOpen(false),
    );
    return () => unsub?.();
  }, []);

  // Track Credits window state
  useEffect(() => {
    window.electronAPI?.getCreditsWidgetOpen?.().then(setCreditsOpen);
    const unsub = window.electronAPI?.onCreditsWidgetClosed?.(() =>
      setCreditsOpen(false),
    );
    return () => unsub?.();
  }, []);

  useEffect(() => {
    window.electronAPI?.getPinnedStatus?.().then(setIsPinned);
    const unsub = window.electronAPI?.onPinnedStatusChanged?.((p) =>
      setIsPinned(p),
    );
    return () => unsub?.();
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handlePinToggle = useCallback(() => {
    if (isPinned) {
      window.electronAPI?.unpinWidget?.();
      addNotification({
        id: Date.now(),
        scoringTeam: "📍",
        opponent: "",
        homeScore: "",
        awayScore: "",
        competition: "Position unpinned",
        status: "finished",
        teamColor: "#A0886B",
        type: "pin",
      });
    } else {
      window.electronAPI?.pinWidget?.();
      addNotification({
        id: Date.now(),
        scoringTeam: "📌",
        opponent: "",
        homeScore: "",
        awayScore: "",
        competition: "Widget pinned to this position",
        status: "finished",
        teamColor: "#E9A84A",
        type: "pin",
      });
    }
    setMenuPos(null);
  }, [isPinned, addNotification]);

  const handleDeepseekToggle = useCallback(() => {
    if (deepseekOpen) {
      window.electronAPI?.closeDeepseekWidget?.();
      setDeepseekOpen(false);
    } else {
      window.electronAPI?.openDeepseekWidget?.();
      setDeepseekOpen(true);
    }
    setMenuPos(null);
  }, [deepseekOpen]);

  const handleCreditsToggle = useCallback(() => {
    if (creditsOpen) {
      window.electronAPI?.closeCreditsWidget?.();
      setCreditsOpen(false);
    } else {
      window.electronAPI?.openCreditsWidget?.();
      setCreditsOpen(true);
    }
    setMenuPos(null);
  }, [creditsOpen]);

  useFootballData();
  useGoalNotify();

  useEffect(() => {
    window.electronAPI?.setViewMode(viewMode);
  }, []); // eslint-disable-line

  useEffect(() => {
    loadCustomTheme();
    const unsubscribe = window.electronAPI?.onPrefsUpdated?.((prefs) => {
      if (prefs?.customTheme) {
        updateCustomThemeFromIpc(prefs.customTheme);
      }
    });
    return () => unsubscribe?.();
  }, [loadCustomTheme, updateCustomThemeFromIpc]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (panelOpen || widgetAiOpen) return;

      if (e.key === "ArrowLeft") {
        prevMatch();
      } else if (e.key === "ArrowRight") {
        nextMatch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevMatch, nextMatch, panelOpen, widgetAiOpen]);

  const isLive = currentMatch?.status === "live";
  const theme = customTheme || {};

  const cardStyle = {
    borderRadius: theme.borderRadius || "24px",
    background: isLive
      ? `linear-gradient(135deg, ${theme.alertBgStart || "#7E492F"} 0%, ${theme.alertBgEnd || "#3D2114"} 100%)`
      : `linear-gradient(135deg, ${theme.defaultBgStart || "#2D2520"} 0%, ${theme.defaultBgEnd || "#171311"} 100%)`,
    borderColor: isLive
      ? "rgba(255, 120, 70, 0.25)"
      : "rgba(255, 255, 255, 0.08)",
  };

  return (
    <div
      className="w-full h-full flex flex-col border p-0.5 select-none overflow-hidden"
      style={cardStyle}
      onContextMenu={handleContextMenu}
    >
      {viewMode === "wide" && <WidgetWide />}
      {viewMode === "compact" && <WidgetCompact />}
      {viewMode === "mini" && <WidgetMini />}
      {panelOpen && <MatchPanel />}
      {widgetAiOpen && <WidgetAiChatbox />}
      {/* Right-click context menu */}
      {menuPos && (
        <>
          <div
            className="fixed inset-0 z-50 no-drag"
            onClick={() => setMenuPos(null)}
          />
          <div
            className="fixed z-50 no-drag rounded-xl border backdrop-blur-md shadow-2xl py-1 min-w-[160px]"
            style={{
              left: menuPos.x,
              top: menuPos.y,
              background: "rgba(23,19,17,0.95)",
              borderColor: "rgba(255,255,255,0.1)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <button
              onClick={handlePinToggle}
              className="w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-white/5"
              style={{ color: isPinned ? "#E9A84A" : "#F5E6D3" }}
            >
              {isPinned ? "📍 Unpin from here" : "📌 Pin to this position"}
            </button>
            <div
              className="h-px mx-2"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <button
              onClick={() => window.electronAPI?.openCustomizer?.()}
              className="w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-white/5"
              style={{ color: "#8F7D74" }}
            >
              ⚙ Settings
            </button>
            <div
              className="h-px mx-2"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <button
              onClick={handleDeepseekToggle}
              className="w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-white/5"
              style={{ color: deepseekOpen ? "#52B788" : "#8F7D74" }}
            >
              {deepseekOpen ? "🔵 Close DeepSeek" : "🔵 Open DeepSeek"}
            </button>
            <div
              className="h-px mx-2"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <button
              onClick={handleCreditsToggle}
              className="w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-white/5"
              style={{ color: creditsOpen ? "#E9A84A" : "#8F7D74" }}
            >
              {creditsOpen ? "💰 Close Credits" : "💰 Open Credits"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
