import React from "react";
import DeepSeekWhale from "./DeepSeekWhale";

export default function WidgetDeepSeekCredits({
  usage = 0.0,
  creditLimit = 10.0,
  updatedTime = "--:--",
  error = null,
  onRefresh,
}) {
  const remaining = Math.max(0, creditLimit - usage);
  const isLow = remaining < 1.0;

  const cardStyle = {
    borderRadius: "24px",
    background: "linear-gradient(135deg, #7E492F 0%, #3D2114 100%)",
    borderColor: "rgba(255, 120, 70, 0.25)",
    borderWidth: "1px",
    borderStyle: "solid",
    padding: "6px 8px",
    fontFamily: "Lora, Georgia, serif",
  };

  return (
    <div
      className="w-full flex-shrink-0 h-full flex flex-col justify-between relative select-none drag-region"
      style={cardStyle}
    >
      {/* Top Controls */}
      <div className="flex justify-between items-center flex-shrink-0">
        <span
          style={{
            color: "#8F7D74",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: "7px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: "600",
          }}
        >
          Credits
        </span>
        <button
          onClick={onRefresh}
          className="w-4 h-4 flex items-center justify-center rounded-full text-[#8F7D74] hover:text-[#F5E6D3] hover:bg-white/5 transition-all cursor-pointer text-[9px]"
          title="Refresh Credits"
        >
          ↻
        </button>
      </div>

      {/* Whale Mascot */}
      <div className="flex justify-center pt-0 pb-0 relative">
        {isLow && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-bounce z-10">
            <svg
              width={14}
              height={14}
              viewBox="0 0 8 8"
              xmlns="http://www.w3.org/2000/svg"
              style={{ imageRendering: "pixelated" }}
            >
              <rect x={1} y={0} width={6} height={1} fill="#E85D5D" />
              <rect x={0} y={1} width={8} height={1} fill="#E85D5D" />
              <rect x={0} y={2} width={8} height={4} fill="#E85D5D" />
              <rect x={3} y={3} width={2} height={2} fill="#FFFFFF" />
              <rect x={0} y={6} width={8} height={1} fill="#E85D5D" />
              <rect x={1} y={7} width={6} height={1} fill="#E85D5D" />
            </svg>
          </div>
        )}
        <DeepSeekWhale variant="compact" size={5} />
      </div>

      {/* Details */}
      <div className="flex flex-col items-center justify-center gap-[1px] pb-0 text-center">
        <h3 className="text-[14px] font-medium text-[#F5E6D3] tracking-wide">
          Credits
        </h3>

        {/* Large remaining amount */}
        <span
          className="text-[24px] font-bold tracking-tight leading-none"
          style={{ color: "#52B788" }}
        >
          ${remaining.toFixed(2)}
        </span>

        <div className="flex items-center gap-1.5 text-[9px] text-[#8F7D74] font-sans mt-0.5">
          <span style={{ color: "#E9A84A", fontWeight: "bold" }}>
            Used: ${usage.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
