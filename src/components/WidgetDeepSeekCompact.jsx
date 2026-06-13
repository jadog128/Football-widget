import React from "react";
import DeepSeekWhale from "./DeepSeekWhale";

export default function WidgetDeepSeekCompact({
  status = "Partial outage",
  updatedTime = "02:07",
  tokenUsage = 0.0,
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
    padding: "16px",
    fontFamily: "Lora, Georgia, serif",
  };

  return (
    <div
      className="w-full flex-shrink-0 h-[213px] flex flex-col justify-between relative select-none drag-region"
      style={cardStyle}
    >
      {/* Top Controls */}
      <div className="flex justify-between items-center flex-shrink-0">
        <span
          style={{
            color: "#8F7D74",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: "8px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: "600",
          }}
        >
          DeepSeek API
        </span>
        <button
          onClick={onRefresh}
          className="w-5 h-5 flex items-center justify-center rounded-full text-[#8F7D74] hover:text-[#F5E6D3] hover:bg-white/5 transition-all cursor-pointer text-[11px]"
          title="Refresh Status"
        >
          ↻
        </button>
      </div>

      {/* Whale mascot */}
      <div className="flex justify-center pt-3 pb-1">
        <DeepSeekWhale variant="compact" size={4} />
      </div>

      {/* Details */}
      <div className="flex flex-col items-center justify-center gap-[2px] pb-1 text-center">
        <h3 className="text-[13px] font-medium text-[#F5E6D3] tracking-wide">
          DeepSeek API
        </h3>

        <div className="flex items-center gap-1.5 justify-center">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block animate-pulse-alert"
            style={{ backgroundColor: getStatusColor() }}
          />
          <span className="text-[12px] text-[#F5E6D3] font-medium leading-none">
            {status}
          </span>
        </div>

        <div className="flex flex-col items-center text-[9px] text-[#8F7D74] font-sans mt-0.5 gap-0.5">
          <span>Updated {updatedTime}</span>
          <span style={{ color: "#E9A84A", fontWeight: "bold" }}>
            Cost: ${tokenUsage.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
