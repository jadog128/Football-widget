/**
 * ToastNotification
 *
 * A beautiful, stackable notification overlay positioned in the top-right
 * corner of the widget. Slides in when a followed team scores a goal,
 * showing team crest, score, scorer, and match context.
 *
 * Renders nothing when the toasts array is empty.
 */

import React, { useEffect, useState } from "react";
import { useWidgetStore } from "../store/widgetStore";
import { playSound } from "../utils/audioService";

const TOAST_DURATION = 5500; // ms before auto-dismiss
const ANIMATION_DURATION = 400;

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on mount
    const mountTimer = setTimeout(() => setMounted(true), 20);
    // Auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      setExiting(true);
    }, TOAST_DURATION);

    // Play chiptune sound based on toast type
    const soundEnabled =
      useWidgetStore.getState().customTheme?.soundEnabled !== false;
    const volume = useWidgetStore.getState().customTheme?.volume ?? 0.5;
    if (soundEnabled) {
      if (toast.type === "deepseek") {
        playSound("deepseek-alert", volume);
      } else if (toast.status === "live") {
        playSound("fanfare", volume);
      } else {
        playSound("notification-ping", volume);
      }
    }

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(dismissTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (exiting) {
      const unmountTimer = setTimeout(
        () => onDismiss(toast.id),
        ANIMATION_DURATION,
      );
      return () => clearTimeout(unmountTimer);
    }
  }, [exiting, onDismiss, toast.id]);

  const handleDismiss = () => {
    setExiting(true);
  };

  const isLive = toast.status === "live";
  const isDeepseek = toast.type === "deepseek";

  return (
    <div
      className={`relative overflow-hidden`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div
        className={`
          relative p-3 rounded-xl border backdrop-blur-sm
          transition-all duration-[400ms] ease-out
          ${
            mounted && !exiting
              ? "translate-x-0 opacity-100 scale-100"
              : "translate-x-8 opacity-0 scale-95"
          }
          ${exiting ? "translate-x-8 opacity-0 scale-95" : ""}
        `}
        style={{
          width: 280,
          background: isDeepseek
            ? "linear-gradient(135deg, rgba(126,73,47,0.92) 0%, rgba(61,33,20,0.92) 100%)"
            : isLive
              ? "linear-gradient(135deg, rgba(126,73,47,0.92) 0%, rgba(61,33,20,0.92) 100%)"
              : "linear-gradient(135deg, rgba(45,37,32,0.92) 0%, rgba(23,19,17,0.92) 100%)",
          borderColor: isDeepseek
            ? "rgba(255, 120, 70, 0.35)"
            : isLive
              ? "rgba(255, 120, 70, 0.35)"
              : "rgba(255, 255, 255, 0.1)",
          boxShadow:
            isDeepseek || isLive
              ? "0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(255,120,70,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Animated glow pulse */}
        {(isDeepseek || isLive) && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(255,120,70,0.08) 0%, transparent 70%)",
              animation: "toastPulse 2s ease-in-out infinite",
            }}
          />
        )}

        {/* Top row — icon + title + close */}
        <div className="flex items-start justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] leading-none"
              style={{ animation: "toastGoalPop 0.5s ease-out" }}
            >
              {isDeepseek ? "🐋" : "⚽"}
            </span>
            <span
              className="font-extrabold tracking-wider text-[11px] uppercase"
              style={{
                color: isDeepseek ? "#52B788" : isLive ? "#FFB088" : "#E9A84A",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {isDeepseek
                ? toast.homeScore || "Low Credits!"
                : isLive
                  ? "GOAL!"
                  : "Full Time"}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/70 transition-colors text-[14px] leading-none cursor-pointer no-drag relative z-10"
            title="Dismiss"
          >
            ×
          </button>
        </div>

        {/* Body message */}
        <div
          className="mb-1 relative z-10"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <span className="font-bold text-[10px]" style={{ color: "#F5E6D3" }}>
            {isDeepseek
              ? toast.opponent || toast.scoringTeam
              : toast.scoringTeam}
          </span>
        </div>

        {/* Football: Match info line */}
        {!isDeepseek && (
          <div
            className="flex items-center gap-2 relative z-10"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <span
              className="text-[9px] font-semibold"
              style={{ color: toast.teamColor || "#F5E6D3" }}
            >
              {toast.scoringTeam}
            </span>
            <span
              className="text-[11px] font-bold tracking-wider"
              style={{ color: "#F5E6D3" }}
            >
              {toast.homeScore}–{toast.awayScore}
            </span>
            <span className="text-[9px]" style={{ color: "#8F7D74" }}>
              {toast.opponent}
            </span>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center gap-2 mt-1.5 relative z-10"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <span
            className="text-[8px] font-semibold uppercase tracking-wider"
            style={{ color: "#8F7D74" }}
          >
            {isDeepseek ? "DeepSeek" : toast.competition}
          </span>
          {(isLive || isDeepseek) && (
            <>
              <span className="text-[6px]" style={{ color: "#5A4232" }}>
                ●
              </span>
              <span
                className="text-[8px] font-bold flex items-center gap-1"
                style={{ color: isDeepseek ? "#52B788" : "#E05353" }}
              >
                <span className="text-[6px] animate-pulse-alert">●</span>
                {isDeepseek ? "LOW" : "LIVE"}
              </span>
            </>
          )}
        </div>

        {/* Progress bar at the bottom */}
        <div
          className="absolute bottom-0 left-0 h-[2px] rounded-b-xl"
          style={{
            background: `linear-gradient(90deg, ${isDeepseek ? "#52B788" : isLive ? "#E8744A" : "#E9A84A"} 0%, transparent 100%)`,
            animation: `toastShrink ${TOAST_DURATION}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * ToastNotification container — renders the stacked list of active toasts
 * in the top-right corner of the widget.
 */
export default function ToastNotification() {
  const notifications = useWidgetStore((s) => s.notifications);
  const dismissNotification = useWidgetStore((s) => s.dismissNotification);

  if (!notifications || notifications.length === 0) return null;

  return (
    <div
      className="fixed top-2 right-2 z-[9999] flex flex-col gap-2 pointer-events-auto"
      style={{ maxWidth: 300 }}
    >
      {notifications.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
}
