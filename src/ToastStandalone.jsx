import React, { useEffect, useState, useRef } from "react";
import { useWidgetStore } from "./store/widgetStore";
import PixelMascot from "./components/PixelMascot";
import DeepSeekWhale from "./components/DeepSeekWhale";
import { playSound } from "./utils/audioService";

const TOAST_DURATION = 5500;
const ANIMATION_DURATION = 400;

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 20);
    const dismissTimer = setTimeout(() => setExiting(true), TOAST_DURATION);

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
      const t = setTimeout(() => onDismiss(toast.id), ANIMATION_DURATION);
      return () => clearTimeout(t);
    }
  }, [exiting, onDismiss, toast.id]);

  const isDeepseek = toast.type === "deepseek";
  const isUpdate = toast.type === "update";
  const isGoal = toast.status === "live";
  const isFulltime = toast.status === "finished" && !isDeepseek && !isUpdate;
  const mascotSize = 4;

  return (
    <div
      className="relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif", minHeight: 90 }}
    >
      <div
        className={`
          relative px-4 py-3 rounded-2xl border
          transition-all duration-[400ms] ease-out
          ${mounted && !exiting ? "translate-x-0 opacity-100 scale-100" : "translate-x-12 opacity-0 scale-95"}
          ${exiting ? "translate-x-12 opacity-0 scale-95" : ""}
        `}
        style={{
          width: 330,
          background: "#1C1610",
          borderColor: isUpdate
            ? "rgba(233, 168, 74, 0.35)"
            : isDeepseek
              ? "rgba(82, 183, 136, 0.3)"
              : isGoal
                ? "rgba(255, 120, 70, 0.35)"
                : "rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
        }}
      >
        <div className="flex items-start gap-3">
          {/* ── Mascot ───────────────────────────────────────────── */}
          <div className="flex-shrink-0 mt-0.5">
            {isUpdate ? (
              <svg
                width="36"
                height="36"
                viewBox="0 0 12 12"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-bob"
                style={{ imageRendering: "pixelated" }}
              >
                <rect x="1" y="1" width="10" height="3" fill="#E9A84A" />
                <rect x="1" y="4" width="10" height="1" fill="#C95B35" />
                <rect x="2" y="5" width="8" height="1" fill="#C95B35" />
                <rect x="3" y="6" width="6" height="1" fill="#C95B35" />
                <rect x="4" y="7" width="4" height="1" fill="#E9A84A" />
                <rect x="5" y="8" width="2" height="1" fill="#E9A84A" />
                <rect x="5" y="0" width="2" height="1" fill="#E9A84A" />
                <rect x="5" y="8" width="2" height="3" fill="#F5E6D3" />
                <rect x="4" y="9" width="4" height="1" fill="#F5E6D3" />
                <rect x="3" y="10" width="6" height="1" fill="#F5E6D3" />
                <rect x="6" y="8" width="1" height="1" fill="#52B788" />
              </svg>
            ) : isDeepseek ? (
              <div className="animate-bob">
                <DeepSeekWhale variant="compact" size={mascotSize} />
              </div>
            ) : (
              <PixelMascot
                state={isGoal ? "hype" : isFulltime ? "idle" : "idle"}
                pixelSize={mascotSize}
                animate={true}
                showAlert={isGoal}
              />
            )}
          </div>

          {/* ── Content ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-[14px] uppercase tracking-wider"
                  style={{
                    color: isDeepseek
                      ? "#52B788"
                      : isGoal
                        ? "#FFB088"
                        : "#E9A84A",
                  }}
                >
                  {isUpdate
                    ? "New Version"
                    : isDeepseek
                      ? "⚠ Low Credits"
                      : isGoal
                        ? "⚽ Goal!"
                        : "🏁 Full Time"}
                </span>
              </div>
              <button
                onClick={() => setExiting(true)}
                className="text-white/20 hover:text-white/60 text-sm leading-none cursor-pointer no-drag flex-shrink-0 ml-2"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div
              className="mt-1 text-[12px] leading-snug"
              style={{ color: isUpdate ? "#E9A84A" : "#F5E6D3" }}
            >
              {isUpdate
                ? (toast.scoringTeam || "Update Available").replace(
                    "Update v",
                    "v",
                  )
                : isDeepseek
                  ? toast.opponent || toast.scoringTeam
                  : toast.scoringTeam}
            </div>

            {/* Update download button — only when an update is actually available */}
            {isUpdate && toast.homeScore !== "✅" && (
              <button
                onClick={() => {
                  const url =
                    toast.downloadUrl || "https://football-widget.vercel.app";
                  window.electronAPI?.openExternal?.(url);
                  setExiting(true);
                }}
                className="mt-2 w-full py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest cursor-pointer no-drag transition-all active:scale-95 hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg, #E9A84A 0%, #D4923A 100%)",
                  color: "#171311",
                  boxShadow: "0 2px 12px rgba(233, 168, 74, 0.3)",
                }}
              >
                ⬇ Download Update
              </button>
            )}

            {/* Football score line */}
            {!isDeepseek && !isUpdate && (
              <div
                className="flex items-center gap-2 mt-1 text-[12px]"
                style={{ color: "#A0886B" }}
              >
                <span className="font-bold" style={{ color: "#F5E6D3" }}>
                  {toast.homeScore}–{toast.awayScore}
                </span>
                {toast.scorer && (
                  <>
                    <span>·</span>
                    <span>{toast.scorer}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
          style={{
            width: "100%",
            background: `linear-gradient(90deg, ${isDeepseek ? "#52B788" : isGoal ? "#E8744A" : "#E9A84A"} 0%, transparent 100%)`,
            animation: `toastShrink ${TOAST_DURATION}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export default function ToastStandalone() {
  const notifications = useWidgetStore((s) => s.notifications);
  const addNotification = useWidgetStore((s) => s.addNotification);
  const dismissNotification = useWidgetStore((s) => s.dismissNotification);
  const hadToastRef = useRef(false);

  // On mount, fetch pending toast
  useEffect(() => {
    const grabToast = async () => {
      const toastData = await window.electronAPI?.getPendingToast?.();
      if (toastData) addNotification(toastData);
    };
    grabToast();
  }, [addNotification]);

  // Enable click interaction when toasts appear
  useEffect(() => {
    if (notifications.length > 0) {
      window.electronAPI?.setToastIgnoreMouse?.(false);
    }
  }, [notifications.length]);

  // Resize to fit
  useEffect(() => {
    const h =
      notifications.length > 0
        ? Math.max(140, notifications.length * 120)
        : 120;
    window.electronAPI?.resizeToastWidget?.(h);
  }, [notifications.length]);

  // Auto-close when all toasts are gone
  useEffect(() => {
    if (hadToastRef.current && notifications.length === 0) {
      window.electronAPI?.setToastIgnoreMouse?.(true);
      const t = setTimeout(() => window.electronAPI?.closeToastWidget?.(), 500);
      return () => clearTimeout(t);
    }
    hadToastRef.current = notifications.length > 0;
  }, [notifications.length]);

  if (!notifications || notifications.length === 0) return null;

  return (
    <div
      className="w-full h-full flex items-start justify-end p-2 select-none"
      style={{ background: "transparent" }}
    >
      <div className="flex flex-col gap-2">
        {notifications.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissNotification} />
        ))}
      </div>
    </div>
  );
}
