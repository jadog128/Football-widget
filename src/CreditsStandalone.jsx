import React, { useEffect, useRef, useState } from "react";
import { useWidgetStore } from "./store/widgetStore";
import WidgetDeepSeekCredits from "./components/WidgetDeepSeekCredits";

import {
  fetchDeepseekMetricsWithBilling,
  POLL_INTERVAL_MS,
} from "./services/deepseekService";

export default function CreditsStandalone() {
  const deepseekUsage = useWidgetStore((s) => s.deepseekUsage);
  const deepseekCreditLimit = useWidgetStore((s) => s.deepseekCreditLimit);
  const deepseekUpdatedTime = useWidgetStore((s) => s.deepseekUpdatedTime);
  const deepseekError = useWidgetStore((s) => s.deepseekError);

  const [menuPos, setMenuPos] = useState(null);
  const activeRef = useRef(true);
  const alertedLowRef = useRef(false);
  const alertedEmptyRef = useRef(false);

  useEffect(() => {
    activeRef.current = true;

    const doFetch = async () => {
      try {
        const metrics = await fetchDeepseekMetricsWithBilling();
        if (!activeRef.current) return;
        const now = new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
        useWidgetStore.setState({
          deepseekUsage: metrics.usage,
          deepseekCreditLimit: metrics.creditLimit,
          deepseekUpdatedTime: now,
        });

        // Clear any previous error
        useWidgetStore.setState({ deepseekError: null });

        // ── Low-credit toast notification ──────────────────────────────────────
        const remaining = metrics.creditLimit - metrics.usage;
        if (remaining <= 0 && !alertedEmptyRef.current) {
          alertedEmptyRef.current = true;
          alertedLowRef.current = true;
          useWidgetStore.getState().addNotification({
            id: Date.now(),
            type: "deepseek",
            scoringTeam: "DeepSeek Credits Depleted",
            opponent: "$0.00 remaining — top up to avoid API failures.",
            homeScore: "⚠️ Depleted",
            awayScore: "",
            competition: "DeepSeek",
            status: "finished",
            teamColor: "#52B788",
          });
        } else if (remaining > 0 && remaining < 1.0 && !alertedLowRef.current) {
          alertedLowRef.current = true;
          alertedEmptyRef.current = false;
          useWidgetStore.getState().addNotification({
            id: Date.now(),
            type: "deepseek",
            scoringTeam: "DeepSeek Credits Running Low",
            opponent: `$${remaining.toFixed(2)} remaining — consider adding more.`,
            homeScore: "⚠️ Low Credits",
            awayScore: "",
            competition: "DeepSeek",
            status: "finished",
            teamColor: "#52B788",
          });
        } else if (remaining >= 1.0) {
          alertedLowRef.current = false;
          alertedEmptyRef.current = false;
        }
      } catch (err) {
        console.error("[CreditsStandalone] fetch error:", err);
        useWidgetStore.setState({
          deepseekError: err?.message || "Failed to fetch credit data",
        });
      }
    };

    const poll = async () => {
      if (!activeRef.current) return;
      await doFetch();
      if (activeRef.current) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    // Re-fetch when preferences change (e.g. API key saved)
    const unsubPrefs = window.electronAPI?.onPrefsUpdated?.(() => {
      doFetch();
    });

    return () => {
      activeRef.current = false;
      unsubPrefs?.();
    };
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleRefresh = async () => {
    const metrics = await fetchDeepseekMetricsWithBilling();
    const now = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    useWidgetStore.setState({
      deepseekUsage: metrics.usage,
      deepseekCreditLimit: metrics.creditLimit,
      deepseekUpdatedTime: now,
    });
  };

  return (
    <div
      className="w-full h-full flex flex-col p-0.5 select-none overflow-hidden"
      style={{ background: "transparent" }}
      onContextMenu={handleContextMenu}
    >
      <WidgetDeepSeekCredits
        usage={deepseekUsage}
        creditLimit={deepseekCreditLimit}
        updatedTime={deepseekUpdatedTime}
        error={deepseekError}
        onRefresh={handleRefresh}
      />

      {/* Right-click context menu */}
      {menuPos && (
        <>
          <div
            className="fixed inset-0 z-50 no-drag"
            onClick={() => setMenuPos(null)}
          />
          <div
            className="fixed z-50 no-drag rounded-xl border backdrop-blur-md shadow-2xl py-1 min-w-[160px] animate-fade-in"
            style={{
              left: menuPos.x,
              top: menuPos.y,
              background: "rgba(23,19,17,0.95)",
              borderColor: "rgba(255,255,255,0.1)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <button
              onClick={() => {
                window.electronAPI?.closeCreditsWidget?.();
                setMenuPos(null);
              }}
              className="w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-white/5"
              style={{ color: "#E05353" }}
            >
              ✕ Close Credits Widget
            </button>
          </div>
        </>
      )}
    </div>
  );
}
