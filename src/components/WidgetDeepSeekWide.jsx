import React from "react";
import DeepSeekWhale from "./DeepSeekWhale";

export default function WidgetDeepSeekWide({
  status = "Operational",
  percentage = "99.94%",
  updatedTime = "13:06",
  tokenUsage = 0.0,
  history = Array.from({ length: 30 }, (_, i) => {
    if (i === 28) return "major";
    if (i === 12 || i === 24) return "partial";
    return "operational";
  }),
  onRefresh,
}) {
  const getStatusColor = () => {
    if (status === "Operational") return "#52B788";
    if (status === "Partial outage") return "#E9A84A";
    return "#E05353";
  };

  const cardStyle = {
    borderRadius: "24px",
    background: "linear-gradient(135deg, #7E492F 0%, #3D2114 100%)",
    borderColor: "rgba(255, 120, 70, 0.25)",
    borderWidth: "1px",
    borderStyle: "solid",
    padding: "8px 12px",
    fontFamily: "Lora, Georgia, serif",
  };

  return (
    <div
      className="w-full flex-shrink-0 h-full flex flex-col relative select-none drag-region"
      style={cardStyle}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between flex-1 min-w-0">
        <div className="flex items-center gap-4">
          {/* Animated whale mascot */}
          <div className="flex-shrink-0">
            <DeepSeekWhale variant="wide" size={5} />
          </div>

          {/* Details */}
          <div className="flex flex-col text-left leading-tight">
            <h2 className="text-[18px] font-medium text-[#F5E6D3] tracking-wide">
              DeepSeek API
            </h2>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block animate-pulse-alert"
                style={{ backgroundColor: getStatusColor() }}
              />
              <span className="text-[15px] text-[#F5E6D3]">{status}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#8F7D74] font-sans mt-0.5">
              <span>Updated {updatedTime}</span>
              <span>·</span>
              <span style={{ color: "#E9A84A", fontWeight: "bold" }}>
                ${tokenUsage.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="w-5 h-5 flex items-center justify-center rounded-full text-[#8F7D74] hover:text-[#F5E6D3] hover:bg-white/5 transition-all cursor-pointer text-[10px] flex-shrink-0"
          title="Refresh Status"
        >
          ↻
        </button>
      </div>

      <div className="h-[1px] bg-white/5 my-1.5" />

      {/* Health Bar Section */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[8px] font-sans font-bold tracking-wider text-[#8F7D74] uppercase leading-none">
          <span>30-day</span>
          <span>{percentage}</span>
        </div>

        <div className="flex gap-[3px]" style={{ height: "10px" }}>
          {history.map((dayStatus, idx) => {
            let bg = "#52B788";
            if (dayStatus === "partial") bg = "#E9A84A";
            else if (dayStatus === "major") bg = "#E05353";

            return (
              <div
                key={idx}
                className="flex-1 rounded-[2px]"
                style={{ backgroundColor: bg }}
                title={`Day ${idx + 1}: ${dayStatus}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
