import React, { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { useWidgetStore } from "./store/widgetStore";
import { useFootballData } from "./hooks/useFootballData";
import { useGoalNotify } from "./hooks/useGoalNotify";
import WidgetWide from "./components/WidgetWide";
import WidgetCompact from "./components/WidgetCompact";
import WidgetMini from "./components/WidgetMini";
import MatchPanel from "./components/MatchPanel";
import WidgetAiChatbox from "./components/WidgetAiChatbox";

export default function App() {
  const viewMode = useWidgetStore((s) => s.viewMode);
  const panelOpen = useWidgetStore((s) => s.panelOpen);
  const widgetAiOpen = useWidgetStore((s) => s.widgetAiOpen);
  const loadCustomTheme = useWidgetStore((s) => s.loadCustomTheme);
  const updateCustomThemeFromIpc = useWidgetStore((s) => s.updateCustomThemeFromIpc);
  const customTheme = useWidgetStore((s) => s.customTheme);
  const currentMatch = useWidgetStore((s) => s.currentMatch);

  const prevMatch = useWidgetStore((s) => s.prevMatch);
  const nextMatch = useWidgetStore((s) => s.nextMatch);

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
    borderColor: isLive ? "rgba(255, 120, 70, 0.25)" : "rgba(255, 255, 255, 0.08)",
  };

  return (
    <>
      <div
        className="w-full h-full flex flex-col border p-0.5 select-none overflow-hidden"
        style={cardStyle}
        onContextMenu={(e) => e.preventDefault()}
      >
        {viewMode === "wide" && <WidgetWide />}
        {viewMode === "compact" && <WidgetCompact />}
        {viewMode === "mini" && <WidgetMini />}
        {panelOpen && <MatchPanel />}
        {widgetAiOpen && <WidgetAiChatbox />}
      </div>
      <Analytics />
    </>
  );
}
