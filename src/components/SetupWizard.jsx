import React, { useState } from "react";
import { useWidgetStore } from "../store/widgetStore";

const STEPS = [
  {
    title: "Welcome! 🎉",
    icon: "⚽",
    content: (
      <div className="flex flex-col items-center text-center gap-3">
        <p className="text-[14px] leading-relaxed" style={{ color: "#D4C5B5" }}>
          This is your <strong style={{ color: "#F5E6D3" }}>Football Widget</strong> —
          a live score tracker that sits on your desktop.
        </p>
        <p className="text-[13px]" style={{ color: "#8F7D74" }}>
          Let's get you set up in under a minute.
        </p>
      </div>
    ),
  },
  {
    title: "Right-Click Menu",
    icon: "🖱️",
    content: (
      <div className="flex flex-col items-center text-center gap-3">
        <p className="text-[14px]" style={{ color: "#D4C5B5" }}>
          Right-click anywhere on the widget to open the menu.
        </p>
        <div
          className="w-full rounded-xl border p-3 text-left text-[12px] leading-relaxed"
          style={{
            background: "rgba(0,0,0,0.2)",
            borderColor: "rgba(255,255,255,0.06)",
            color: "#A0886B",
          }}
        >
          <span style={{ color: "#E9A84A" }}>📌 Pin</span> — locks widget in place<br />
          <span style={{ color: "#E9A84A" }}>⚙ Settings</span> — customiser window<br />
          <span style={{ color: "#52B788" }}>🔵 Open DeepSeek</span> — API status<br />
          <span style={{ color: "#E9A84A" }}>💰 Open Credits</span> — token tracker
        </div>
      </div>
    ),
  },
  {
    title: "Three Sizes",
    icon: "📐",
    content: (
      <div className="flex flex-col items-center text-center gap-3">
        <p className="text-[14px]" style={{ color: "#D4C5B5" }}>
          Double-click the widget to cycle through sizes:
        </p>
        <div
          className="grid grid-cols-3 gap-2 w-full text-center text-[11px]"
          style={{ color: "#8F7D74" }}
        >
          <div className="rounded-xl border p-2" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-lg mb-1">🟦</div>
            <strong style={{ color: "#F5E6D3" }}>Wide</strong><br />490×185
          </div>
          <div className="rounded-xl border p-2" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-lg mb-1">🟧</div>
            <strong style={{ color: "#F5E6D3" }}>Compact</strong><br />210×220
          </div>
          <div className="rounded-xl border p-2" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-lg mb-1">🟨</div>
            <strong style={{ color: "#F5E6D3" }}>Mini</strong><br />90×95
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Live Scores & AI",
    icon: "🤖",
    content: (
      <div className="flex flex-col items-center text-center gap-3">
        <p className="text-[14px]" style={{ color: "#D4C5B5" }}>
          Matches update automatically from ESPN. Click the panel button to see upcoming games and stats.
        </p>
        <p className="text-[13px]" style={{ color: "#8F7D74" }}>
          Want match analysis? Open the chat panel and ask the AI about any game — just add your Gemini or OpenRouter key in Settings.
        </p>
      </div>
    ),
  },
  {
    title: "Notifications & Sounds",
    icon: "🔔",
    content: (
      <div className="flex flex-col items-center text-center gap-3">
        <p className="text-[14px]" style={{ color: "#D4C5B5" }}>
          Goals, kickoffs, and full-time pop up as floating toasts with mascot animations and sounds.
        </p>
        <p className="text-[13px]" style={{ color: "#8F7D74" }}>
          Adjust volume or disable sounds in Settings → Sound Enabled.
        </p>
      </div>
    ),
  },
  {
    title: "Customise Everything",
    icon: "🎨",
    content: (
      <div className="flex flex-col items-center text-center gap-3">
        <p className="text-[14px]" style={{ color: "#D4C5B5" }}>
          Open <strong style={{ color: "#E9A84A" }}>⚙ Settings</strong> to:
        </p>
        <div
          className="w-full rounded-xl border p-3 text-left text-[12px] leading-relaxed"
          style={{
            background: "rgba(0,0,0,0.2)",
            borderColor: "rgba(255,255,255,0.06)",
            color: "#A0886B",
          }}
        >
          🎨 Change colours & gradients<br />
          🖌️ Draw your own pixel mascot<br />
          🎮 Play the mini-game<br />
          🏆 Pick favourite teams<br />
          🔑 Add API keys for AI & DeepSeek
        </div>
      </div>
    ),
  },
  {
    title: "You're All Set! 🚀",
    icon: "✅",
    content: (
      <div className="flex flex-col items-center text-center gap-3">
        <p className="text-[14px]" style={{ color: "#D4C5B5" }}>
          That's it! Start by right-clicking the widget to explore.
        </p>
        <p className="text-[13px]" style={{ color: "#8F7D74" }}>
          If you ever get stuck, right-click → ⚙ Settings has everything you need.
        </p>
        <div
          className="mt-2 px-4 py-2 rounded-lg text-[11px]"
          style={{ background: "rgba(82, 183, 136, 0.15)", color: "#52B788" }}
        >
          Have fun! ⚽🐋
        </div>
      </div>
    ),
  },
];

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="rounded-2xl border p-6 w-full mx-4 flex flex-col gap-5"
        style={{
          maxWidth: 380,
          background: "linear-gradient(135deg, #2D2520 0%, #171311 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Step counter */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 8,
                  background: i <= step ? "#E9A84A" : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-[11px] font-medium cursor-pointer no-drag hover:underline"
            style={{ color: "#5A4232" }}
          >
            Skip
          </button>
        </div>

        {/* Icon */}
        <div className="text-4xl text-center">{current.icon}</div>

        {/* Title */}
        <h2
          className="text-[17px] font-bold text-center tracking-tight"
          style={{ color: "#F5E6D3" }}
        >
          {current.title}
        </h2>

        {/* Content */}
        {current.content}

        {/* Next / Done button */}
        <button
          onClick={handleNext}
          className="w-full py-2.5 rounded-xl font-bold text-[13px] uppercase tracking-wider cursor-pointer no-drag transition-all active:scale-95 hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #E9A84A 0%, #D4923A 100%)",
            color: "#171311",
            boxShadow: "0 2px 12px rgba(233, 168, 74, 0.25)",
          }}
        >
          {isLast ? "✨ Get Started" : "Next →"}
        </button>
      </div>
    </div>
  );
}
