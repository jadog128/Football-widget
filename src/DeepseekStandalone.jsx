import React, { useEffect, useRef, useState } from "react";
import { useWidgetStore } from "./store/widgetStore";
import WidgetDeepSeekWide from "./components/WidgetDeepSeekWide";

import {
  fetchDeepseekMetrics,
  fetchDeepseekMetricsWithBilling,
  POLL_INTERVAL_MS,
} from "./services/deepseekService";

export default function DeepseekStandalone() {
  const deepseekStatus = useWidgetStore((s) => s.deepseekStatus);
  const deepseekPercentage = useWidgetStore((s) => s.deepseekPercentage);
  const deepseekUsage = useWidgetStore((s) => s.deepseekUsage);
  const deepseekHistory = useWidgetStore((s) => s.deepseekHistory);
  const deepseekUpdatedTime = useWidgetStore((s) => s.deepseekUpdatedTime);

  const [menuPos, setMenuPos] = useState(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    const poll = async () => {
      if (!activeRef.current) return;
      try {
        const metrics = await fetchDeepseekMetrics();
        if (!activeRef.current) return;
        useWidgetStore.setState({
          deepseekStatus: metrics.status,
          deepseekPercentage: metrics.percentage,
          deepseekUsage: 0,
          deepseekHistory: metrics.history,
          deepseekUpdatedTime: metrics.updatedTime,
        });
      } catch {
        // retry next cycle
      }
      if (activeRef.current) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      activeRef.current = false;
    };
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleRefresh = async () => {
    const metrics = await fetchDeepseekMetricsWithBilling();
    useWidgetStore.setState({
      deepseekStatus: metrics.status,
      deepseekPercentage: metrics.percentage,
      deepseekUsage: metrics.usage,
      deepseekHistory: metrics.history,
      deepseekUpdatedTime: metrics.updatedTime,
    });
  };

  return (
    <div
      className="w-full h-full flex flex-col p-0.5 select-none overflow-hidden"
      style={{ background: "transparent" }}
      onContextMenu={handleContextMenu}
    >
      <WidgetDeepSeekWide
        status={deepseekStatus}
        percentage={deepseekPercentage}
        updatedTime={deepseekUpdatedTime}
        tokenUsage={deepseekUsage}
        history={deepseekHistory}
        onRefresh={handleRefresh}
      />

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
              onClick={() => {
                window.electronAPI?.closeDeepseekWidget?.();
                setMenuPos(null);
              }}
              className="w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-white/5"
              style={{ color: "#E05353" }}
            >
              ✕ Close DeepSeek Widget
            </button>
          </div>
        </>
      )}
    </div>
  );
}
