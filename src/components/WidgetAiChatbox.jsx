import React, { useState, useRef, useEffect } from "react";
import { useWidgetStore } from "../store/widgetStore";

export default function WidgetAiChatbox() {
  const { 
    widgetAiMatchId, 
    widgetAiMessages, 
    widgetAiLoading, 
    sendWidgetAiMessage, 
    toggleWidgetAi, 
    matches, 
    currentMatch,
    customTheme 
  } = useWidgetStore();

  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  const theme = customTheme || {};
  const textColor = theme.textColor || "#F5E6D3";
  const accentColor = theme.accentColor || "#E9A84A";

  const match = matches.find(m => m.id === widgetAiMatchId) || currentMatch;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [widgetAiMessages, widgetAiLoading]);

  if (!match) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    sendWidgetAiMessage(input);
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const quickPrompts = [
    { label: "📢 Match Commentary", text: "Give me live commentary of this game!" },
    { label: "📊 Win Prediction", text: "Who has the best chance to win this game?" },
    { label: "📋 Tactical Analysis", text: "What tactics should both teams use?" },
  ];

  return (
    <div 
      className="flex flex-col select-text no-drag animate-fade-in"
      style={{
        height: 380,
        background: "rgba(0, 0, 0, 0.12)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        color: textColor,
        fontFamily: "Inter, sans-serif",
        fontSize: "12px",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span style={{ color: accentColor, fontWeight: "bold", fontSize: "10px", letterSpacing: "0.05em" }}>💬 AI ASSISTANT:</span>
          <span className="opacity-90 font-bold tracking-wide text-xs">
            {match.homeTeam.shortName} vs {match.awayTeam.shortName}
          </span>
        </div>
        <button
          onClick={() => toggleWidgetAi(match.id)}
          className="text-white/40 hover:text-white cursor-pointer px-1 text-base leading-none"
          title="Close Chat"
        >
          ×
        </button>
      </div>

      {/* Message History */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
        style={{ scrollbarWidth: "thin" }}
      >
        {widgetAiMessages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col max-w-[85%] ${
              msg.sender === "user" ? "self-end items-end" : "self-start items-start"
            }`}
          >
            <span 
              className="text-[8px] uppercase tracking-wider mb-0.5 font-bold"
              style={{ color: msg.sender === "user" ? accentColor : "#A0886B" }}
            >
              {msg.sender === "user" ? "You" : "AI"}
            </span>
            <div 
              className={`p-2.5 rounded-lg border leading-relaxed text-xs ${
                msg.sender === "user" 
                  ? "bg-white/5 border-white/10 text-right" 
                  : "bg-black/45 border-white/5"
              }`}
              style={{
                borderRadius: "10px",
                whiteSpace: "pre-wrap"
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {widgetAiLoading && (
          <div className="self-start flex flex-col items-start max-w-[85%]">
            <span className="text-[8px] uppercase tracking-wider mb-0.5 text-[#A0886B] font-bold">AI</span>
            <div className="p-2.5 rounded-lg bg-black/45 border border-white/5 animate-pulse text-xs">
              💬 Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-1.5 flex gap-2 overflow-x-auto flex-shrink-0 border-t border-white/5 bg-black/10">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => sendWidgetAiMessage(p.text)}
            disabled={widgetAiLoading}
            className="text-[10px] px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer disabled:opacity-40 transition-all font-semibold whitespace-nowrap text-[#F5E6D3]"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-white/5 flex gap-2 bg-black/20 flex-shrink-0">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={widgetAiLoading}
          placeholder="Ask about goals, form, tactics..."
          className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-white/20 placeholder-white/20"
          style={{ color: textColor }}
        />
        <button
          onClick={handleSend}
          disabled={widgetAiLoading || !input.trim()}
          className="px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          style={{ 
            backgroundColor: accentColor, 
            color: "#171311"
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
