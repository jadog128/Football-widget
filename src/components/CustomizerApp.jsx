import React, { useEffect, useState, useRef } from "react";
import { useWidgetStore } from "../store/widgetStore";
import WidgetWide from "./WidgetWide";
import WidgetCompact from "./WidgetCompact";
import { playSound } from "../utils/audioService";
import { TEAMS_BY_LEAGUE } from "../utils/teams";

const PRESETS = [
  {
    name: "Default Dark",
    borderRadius: "24px",
    defaultBgStart: "#2D2520",
    defaultBgEnd: "#171311",
    alertBgStart: "#7E492F",
    alertBgEnd: "#3D2114",
    textColor: "#F5E6D3",
    accentColor: "#E9A84A",
  },
  {
    name: "Terracotta Sunset",
    borderRadius: "24px",
    defaultBgStart: "#4E2B1F",
    defaultBgEnd: "#1F120E",
    alertBgStart: "#9E3C1E",
    alertBgEnd: "#4E1205",
    textColor: "#FDF5F2",
    accentColor: "#F37243",
  },
  {
    name: "Midnight Slate",
    borderRadius: "16px",
    defaultBgStart: "#1E293B",
    defaultBgEnd: "#0F172A",
    alertBgStart: "#0369A1",
    alertBgEnd: "#0C4A6E",
    textColor: "#F8FAFC",
    accentColor: "#38BDF8",
  },
  {
    name: "Retro Gameboy",
    borderRadius: "0px",
    defaultBgStart: "#8BAC0F",
    defaultBgEnd: "#306230",
    alertBgStart: "#9BBC0F",
    alertBgEnd: "#0F380F",
    textColor: "#0F380F",
    accentColor: "#306230",
  },
  {
    name: "Cyberpunk Neon",
    borderRadius: "12px",
    defaultBgStart: "#1F0C2E",
    defaultBgEnd: "#0A0210",
    alertBgStart: "#9D00FF",
    alertBgEnd: "#300060",
    textColor: "#00FFFF",
    accentColor: "#FF007F",
  },
];

// ── Retro Bounce Synthesizer ──────────────────────────────────────────────
function playRetroBounce(volume) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  } catch (_) {}
}

export default function CustomizerApp() {
  const { customTheme, setCustomTheme, loadCustomTheme } = useWidgetStore();
  const [activeTab, setActiveTab] = useState("design"); // "design" | "mascot" | "settings" | "game"
  const [previewMode, setPreviewMode] = useState("wide"); // "wide" | "compact"

  // ── Tab 1: Design States ──────────────────────────────────────────────────
  const [borderRadius, setBorderRadius] = useState(24);
  const [defaultBgStart, setDefaultBgStart] = useState("#2D2520");
  const [defaultBgEnd, setDefaultBgEnd] = useState("#171311");
  const [alertBgStart, setAlertBgStart] = useState("#7E492F");
  const [alertBgEnd, setAlertBgEnd] = useState("#3D2114");
  const [textColor, setTextColor] = useState("#F5E6D3");
  const [accentColor, setAccentColor] = useState("#E9A84A");
  const [customMascot, setCustomMascot] = useState(null);

  // ── Tab 2: Mascot Creator States ──────────────────────────────────────────
  const [drawingPaletteIdx, setDrawingPaletteIdx] = useState(1);
  const [drawingGrid, setDrawingGrid] = useState(
    Array.from({ length: 14 }, () => Array(12).fill(0)),
  );

  // ── Tab 3: Settings States ────────────────────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [shortcutKey, setShortcutKey] = useState("CommandOrControl+Shift+F");
  const [favoriteInput, setFavoriteInput] = useState("");
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [followedLeagues, setFollowedLeagues] = useState([]);
  const [autoHideEnabled, setAutoHideEnabled] = useState(false);
  const [ghostModeEnabled, setGhostModeEnabled] = useState(false);
  const [utilityMode, setUtilityMode] = useState("none");
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [deepseekWidgetEnabled, setDeepseekWidgetEnabled] = useState(false);
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
  const [deepseekCreditLimit, setDeepseekCreditLimit] = useState(10.0);

  // ── Tab 4: Mini-Game States ───────────────────────────────────────────────
  const gameCanvasRef = useRef(null);
  const [gameState, setGameState] = useState("idle"); // "idle" | "playing" | "gameover"
  const [gameScore, setGameScore] = useState(0);
  const gameLoopRef = useRef(null);

  // Initial Load & Scroll Override
  useEffect(() => {
    loadCustomTheme();

    // Override main stylesheet overflow lock for Customizer window
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
    const root = document.getElementById("root");
    if (root) {
      root.style.overflow = "auto";
      root.style.height = "auto";
    }

    return () => {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      if (root) {
        root.style.overflow = "hidden";
        root.style.height = "100%";
      }
    };
  }, [loadCustomTheme]);

  // Sync state on load
  useEffect(() => {
    if (customTheme) {
      setBorderRadius(parseInt(customTheme.borderRadius) || 0);
      setDefaultBgStart(customTheme.defaultBgStart || "#2D2520");
      setDefaultBgEnd(customTheme.defaultBgEnd || "#171311");
      setAlertBgStart(customTheme.alertBgStart || "#7E492F");
      setAlertBgEnd(customTheme.alertBgEnd || "#3D2114");
      setTextColor(customTheme.textColor || "#F5E6D3");
      setAccentColor(customTheme.accentColor || "#E9A84A");
      setCustomMascot(customTheme.customMascot || null);

      setSoundEnabled(customTheme.soundEnabled !== false);
      setVolume(customTheme.volume ?? 0.5);
      setSpeechEnabled(!!customTheme.speechEnabled);
      setShortcutKey(customTheme.globalShortcut || "CommandOrControl+Shift+F");
      setFavoriteTeams(customTheme.favoriteTeams || []);
      setFollowedLeagues(customTheme.followedLeagues || []);
      setAutoHideEnabled(!!customTheme.autoHideEnabled);
      setGhostModeEnabled(!!customTheme.ghostModeEnabled);
      setUtilityMode(customTheme.utilityMode || "none");
      setGeminiKey(customTheme.geminiKey || "");
      setOpenrouterKey(customTheme.openrouterKey || "");
      setDeepseekWidgetEnabled(!!customTheme.deepseekWidgetEnabled);
      setDeepseekApiKey(customTheme.deepseekApiKey || "");
      setDeepseekCreditLimit(customTheme.deepseekCreditLimit ?? 10.0);

      if (customTheme.customGrid) {
        setDrawingGrid(customTheme.customGrid);
      }
    }
  }, [customTheme]);

  const applyChanges = (updates) => {
    setCustomTheme(updates);
  };

  // Preset Selection
  const handlePresetSelect = (preset) => {
    const updates = {
      borderRadius: preset.borderRadius,
      defaultBgStart: preset.defaultBgStart,
      defaultBgEnd: preset.defaultBgEnd,
      alertBgStart: preset.alertBgStart,
      alertBgEnd: preset.alertBgEnd,
      textColor: preset.textColor,
      accentColor: preset.accentColor,
    };
    applyChanges(updates);
  };

  // Base64 image uploader
  const handleMascotUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result;
      if (typeof base64 === "string") {
        setCustomMascot(base64);
        applyChanges({ customMascot: base64, customGrid: null });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeMascot = () => {
    setCustomMascot(null);
    applyChanges({ customMascot: null });
  };

  // Drawing Canvas Grid Click/Drag
  const handleCellDraw = (row, col) => {
    const next = drawingGrid.map((r, rIdx) =>
      r.map((c, cIdx) =>
        rIdx === row && cIdx === col ? drawingPaletteIdx : c,
      ),
    );
    setDrawingGrid(next);
  };

  const handleCellDrag = (e, row, col) => {
    if (e.buttons === 1) {
      handleCellDraw(row, col);
    }
  };

  const saveDrawingGrid = () => {
    applyChanges({ customGrid: drawingGrid, customMascot: null });
    playSound("whistle", volume);
  };

  const clearDrawingGrid = () => {
    setDrawingGrid(Array.from({ length: 14 }, () => Array(12).fill(0)));
  };

  // Snapping preset triggering
  const triggerSnap = (preset) => {
    window.electronAPI?.snapWindow(preset);
  };

  // Favorite teams managers
  const addFavoriteTeam = () => {
    if (!favoriteInput.trim()) return;
    const next = [...favoriteTeams, favoriteInput.trim()];
    setFavoriteTeams(next);
    applyChanges({ favoriteTeams: next });
    setFavoriteInput("");
  };

  const removeFavoriteTeam = (idx) => {
    const next = favoriteTeams.filter((_, i) => i !== idx);
    setFavoriteTeams(next);
    applyChanges({ favoriteTeams: next });
  };

  // Followed leagues checkboxes
  const toggleLeague = (league) => {
    const next = followedLeagues.includes(league)
      ? followedLeagues.filter((l) => l !== league)
      : [...followedLeagues, league];
    setFollowedLeagues(next);
    applyChanges({ followedLeagues: next });
  };

  // Apply customizable hotkey
  const applyCustomShortcut = async () => {
    const success = await window.electronAPI?.setShortcut(shortcutKey);
    if (success) {
      alert("Shortcut registered successfully: " + shortcutKey);
    } else {
      alert("Failed to register shortcut. Check formatting.");
    }
  };

  // ── Mini Game Logic ────────────────────────────────────────────────────────
  const startGame = () => {
    setGameState("playing");
    setGameScore(0);
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    let mascotX = width / 2 - 16;
    const mascotY = height - 26;
    const mascotWidth = 32;
    const mascotHeight = 22;

    let ballX = width / 2;
    let ballY = 20;
    let ballVx = (Math.random() - 0.5) * 1.5;
    let ballVy = 0.5;
    const ballRadius = 6;
    const gravity = 0.045;

    let keys = {};
    const handleKeyDown = (e) => {
      if (["ArrowLeft", "ArrowRight", "Space", " "].includes(e.key)) {
        e.preventDefault();
      }
      keys[e.key] = true;
    };
    const handleKeyUp = (e) => {
      keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let score = 0;

    const loop = () => {
      // Input movement
      if (keys["ArrowLeft"] || keys["a"]) {
        mascotX = Math.max(0, mascotX - 2.5);
      }
      if (keys["ArrowRight"] || keys["d"]) {
        mascotX = Math.min(width - mascotWidth, mascotX + 2.5);
      }

      // Physics
      ballVy += gravity;
      ballX += ballVx;
      ballY += ballVy;

      // Wall collision
      if (ballX - ballRadius < 0 || ballX + ballRadius > width) {
        ballVx = -ballVx * 0.9;
        ballX = ballX - ballRadius < 0 ? ballRadius : width - ballRadius;
      }

      // Mascot bounce collision
      if (
        ballY + ballRadius >= mascotY &&
        ballY - ballRadius <= mascotY + mascotHeight &&
        ballX + ballRadius >= mascotX &&
        ballX - ballRadius <= mascotX + mascotWidth &&
        ballVy > 0
      ) {
        ballVy = -2.3; // Floatier bounce
        ballY = mascotY - ballRadius;

        // Add velocity variance based on hit point
        const hitPoint =
          (ballX - (mascotX + mascotWidth / 2)) / (mascotWidth / 2);
        ballVx = hitPoint * 1.0 + (Math.random() - 0.5) * 0.25;

        score += 1;
        setGameScore(score);
        playRetroBounce(volume);
      }

      // Drop death check
      if (ballY - ballRadius > height) {
        setGameState("gameover");
        const hs = customTheme?.gameHighScore || 0;
        if (score > hs) {
          applyChanges({ gameHighScore: score });
        }
        return;
      }

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Pitch background
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, height - 4, width, 4); // Ground line

      // Draw mascot
      ctx.fillStyle = "#E8744A";
      ctx.fillRect(mascotX, mascotY, mascotWidth, mascotHeight);
      ctx.fillStyle = "#1A0F0A";
      ctx.fillRect(mascotX + 6, mascotY + 5, 4, 4); // eye
      ctx.fillRect(mascotX + 20, mascotY + 5, 4, 4); // eye
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(mascotX + 8, mascotY + 5, 2, 2); // eye sparkle
      ctx.fillRect(mascotX + 22, mascotY + 5, 2, 2);

      // Draw Ball
      ctx.fillStyle = "#F5E6D3";
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1A0F0A";
      ctx.lineWidth = 1;
      ctx.stroke();

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, volume, customTheme]);

  // Skin unlocking criteria calculations
  const predictionScore = customTheme?.predictionScore || 0;
  const gameHighScore = customTheme?.gameHighScore || 0;

  const skins = [
    {
      id: "default",
      name: "Default (Free)",
      unlocked: true,
      desc: "Always available",
    },
    {
      id: "referee",
      name: "Referee Jersey",
      unlocked: predictionScore >= 5 || gameHighScore >= 10,
      desc: "Predict 5 correct OR Score 10 in Keepie-Uppie",
    },
    {
      id: "crown",
      name: "King Crown",
      unlocked: predictionScore >= 12 || gameHighScore >= 20,
      desc: "Predict 12 correct OR Score 20 in Keepie-Uppie",
    },
    {
      id: "visor",
      name: "Cyber Visor",
      unlocked: predictionScore >= 20 || gameHighScore >= 30,
      desc: "Predict 20 correct OR Score 30 in Keepie-Uppie",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#1E1710] text-[#F5E6D3] flex flex-col font-sans p-5 select-none overflow-y-auto">
      {/* Header */}
      <header className="mb-4 flex-shrink-0">
        <h1 className="font-serif text-2xl font-bold text-w-text">
          Widget Settings Dashboard
        </h1>
        {/* Navigation Tabs */}
        <div className="flex gap-1.5 mt-3 border-b border-white/5 pb-2">
          {["design", "mascot", "settings", "game"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[#E9A84A] text-[#171311]"
                  : "bg-[#2D2520] hover:bg-[#3E332B] text-[#A0886B]"
              }`}
            >
              {tab === "game" ? "⚽ Keepie-Uppie" : tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Live Preview */}
        <div className="flex flex-col bg-[#171311] border border-white/5 rounded-2xl p-4 justify-between min-h-[260px] h-fit">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#8F7D74]">
              Live Widget Preview
            </span>
            <div className="flex bg-[#2D2520] rounded-lg p-1 gap-1">
              <button
                onClick={() => setPreviewMode("wide")}
                className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  previewMode === "wide"
                    ? "bg-[#E9A84A] text-[#171311] font-semibold"
                    : "text-[#A0886B] hover:text-w-text"
                }`}
              >
                Wide
              </button>
              <button
                onClick={() => setPreviewMode("compact")}
                className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  previewMode === "compact"
                    ? "bg-[#E9A84A] text-[#171311] font-semibold"
                    : "text-[#A0886B] hover:text-w-text"
                }`}
              >
                Compact
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 bg-black/10 rounded-xl overflow-hidden min-h-[190px]">
            <div className="transform scale-[0.85] origin-center">
              {previewMode === "wide" ? <WidgetWide /> : <WidgetCompact />}
            </div>
          </div>
        </div>

        {/* Right Side: Tab Contents (Unconstrained height, flows with whole page scroll) */}
        <div className="flex flex-col bg-[#171311] border border-white/5 rounded-2xl p-4 gap-4">
          {/* TAB 1: DESIGN */}
          {activeTab === "design" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-[#8F7D74] block mb-2">
                  Theme Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className="bg-[#2D2520] hover:bg-white/5 border border-white/5 text-xs px-3 py-2 rounded-lg transition-all active:scale-95 text-w-text cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="uppercase tracking-wider text-[#8F7D74]">
                    Corner Roundness
                  </span>
                  <span className="text-[#E9A84A]">{borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="36"
                  value={borderRadius}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBorderRadius(val);
                    applyChanges({ borderRadius: `${val}px` });
                  }}
                  className="w-full accent-[#E9A84A] bg-[#2D2520] h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-[#8F7D74] block mb-2">
                  Mascot File Upload
                </label>
                <div className="flex items-center gap-3">
                  <label className="bg-[#E9A84A] hover:bg-[#F4A475] text-[#171311] font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all active:scale-95">
                    Upload PNG / JPG
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMascotUpload}
                      className="hidden"
                    />
                  </label>
                  {customMascot && (
                    <button
                      onClick={removeMascot}
                      className="bg-[#E053531A] hover:bg-[#E0535333] border border-[#E0535344] text-[#E05353] font-semibold text-xs px-3 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full h-px bg-white/5 my-1" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs uppercase tracking-wider font-semibold text-[#8F7D74] block mb-1">
                    Gradients Start
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={defaultBgStart}
                      onChange={(e) => {
                        setDefaultBgStart(e.target.value);
                        applyChanges({ defaultBgStart: e.target.value });
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs uppercase font-mono">
                      {defaultBgStart}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-2xs uppercase tracking-wider font-semibold text-[#8F7D74] block mb-1">
                    Gradients End
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={defaultBgEnd}
                      onChange={(e) => {
                        setDefaultBgEnd(e.target.value);
                        applyChanges({ defaultBgEnd: e.target.value });
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs uppercase font-mono">
                      {defaultBgEnd}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs uppercase tracking-wider font-semibold text-[#8F7D74] block mb-1">
                    Alert Start
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={alertBgStart}
                      onChange={(e) => {
                        setAlertBgStart(e.target.value);
                        applyChanges({ alertBgStart: e.target.value });
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs uppercase font-mono">
                      {alertBgStart}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-2xs uppercase tracking-wider font-semibold text-[#8F7D74] block mb-1">
                    Alert End
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={alertBgEnd}
                      onChange={(e) => {
                        setAlertBgEnd(e.target.value);
                        applyChanges({ alertBgEnd: e.target.value });
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs uppercase font-mono">
                      {alertBgEnd}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASCOT CREATOR */}
          {activeTab === "mascot" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-[#8F7D74] block mb-2">
                  Draw Mascot (12×14 Grid Canvas)
                </label>

                {/* Palette */}
                <div className="flex gap-1.5 mb-3">
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const colors = {
                      0: "border border-dashed border-[#8F7D74] bg-transparent",
                      1: "bg-[#E8744A]",
                      2: "bg-[#C95B35]",
                      3: "bg-[#1A0F0A]",
                      4: "bg-[#F4A475]",
                      5: "bg-[#FFFFFF]",
                    };
                    const labels = {
                      0: "✖",
                      1: "Main",
                      2: "Shad",
                      3: "Dark",
                      4: "Lite",
                      5: "Spark",
                    };
                    return (
                      <button
                        key={idx}
                        onClick={() => setDrawingPaletteIdx(idx)}
                        className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[7px] font-bold border-2 cursor-pointer ${
                          colors[idx]
                        } ${drawingPaletteIdx === idx ? "border-white" : "border-transparent"}`}
                      >
                        <span
                          className={
                            idx === 3 || idx === 2 ? "text-white" : "text-black"
                          }
                        >
                          {labels[idx]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Draw Canvas Grid */}
                <div className="inline-grid grid-cols-12 gap-[1px] bg-[#2D2520] p-2 rounded-xl border border-white/5 select-none">
                  {drawingGrid.map((row, rIdx) =>
                    row.map((val, cIdx) => {
                      const colors = {
                        0: "bg-[#171311]",
                        1: "bg-[#E8744A]",
                        2: "bg-[#C95B35]",
                        3: "bg-[#1A0F0A]",
                        4: "bg-[#F4A475]",
                        5: "bg-[#FFFFFF]",
                      };
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          onMouseDown={() => handleCellDraw(rIdx, cIdx)}
                          onMouseEnter={(e) => handleCellDrag(e, rIdx, cIdx)}
                          className={`w-4 h-4 rounded-xs border-white/5 transition-all cursor-crosshair ${colors[val]}`}
                        />
                      );
                    }),
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={saveDrawingGrid}
                    className="bg-[#E9A84A] text-[#171311] font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Save Canvas Design
                  </button>
                  <button
                    onClick={clearDrawingGrid}
                    className="bg-[#2D2520] text-[#A0886B] font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Clear Grid
                  </button>
                </div>
              </div>

              {/* Wardrobe accessories list */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-[#8F7D74] block mb-2">
                  Mascot Wardrobe Accessories
                </label>
                <div className="flex flex-col gap-2">
                  {skins.map((skin) => (
                    <div
                      key={skin.id}
                      className="flex justify-between items-center p-3 rounded-xl bg-[#2D2520] border border-white/5"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{skin.name}</span>
                        <span className="text-[9px] text-[#8F7D74]">
                          {skin.desc}
                        </span>
                      </div>
                      {skin.unlocked ? (
                        <button
                          onClick={() => applyChanges({ activeSkin: skin.id })}
                          className={`text-xs px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                            customTheme?.activeSkin === skin.id
                              ? "bg-[#E9A84A] text-[#171311]"
                              : "bg-[#171311] hover:bg-white/5 text-[#A0886B]"
                          }`}
                        >
                          Wear
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#E05353] font-bold">
                          🔒 LOCKED
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS & PREFERENCES */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-4">
              {/* Sound and Commentary */}
              <div className="p-3 bg-[#2D2520] rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">
                      Retro Sound Effects
                    </span>
                    <span className="text-[9px] text-[#8F7D74]">
                      Enable chiptune game whistles/fanfares
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => {
                      setSoundEnabled(e.target.checked);
                      applyChanges({ soundEnabled: e.target.checked });
                    }}
                    className="accent-[#E9A84A] cursor-pointer w-4 h-4"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between text-[10px] text-[#8F7D74] mb-1 font-bold">
                    <span>VOLUME LEVEL</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    disabled={!soundEnabled}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      applyChanges({ volume: v });
                    }}
                    className="w-full accent-[#E9A84A] bg-[#171311] h-1 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">
                      TTS Announcer Commentator
                    </span>
                    <span className="text-[9px] text-[#8F7D74]">
                      Speak score alerts using a robotic retro voice
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={speechEnabled}
                    onChange={(e) => {
                      setSpeechEnabled(e.target.checked);
                      applyChanges({ speechEnabled: e.target.checked });
                    }}
                    className="accent-[#E9A84A] cursor-pointer w-4 h-4"
                  />
                </div>
              </div>

              {/* Utility Mode */}
              <div className="p-3 bg-[#2D2520] rounded-xl border border-white/5 flex flex-col gap-2">
                <span className="text-xs font-bold block mb-1">
                  Mascot Idle Utility Mode
                </span>
                <p className="text-[9px] text-[#8F7D74] mb-2">
                  Displays real-time systems or weather when no matches are
                  scheduled.
                </p>
                <div className="flex gap-2">
                  {[
                    { id: "none", label: "Disabled" },
                    { id: "cpu", label: "CPU & RAM" },
                    { id: "weather", label: "Weather" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setUtilityMode(mode.id);
                        applyChanges({ utilityMode: mode.id });
                      }}
                      className={`flex-1 py-1.5 text-2xs uppercase tracking-wider font-bold rounded-lg cursor-pointer ${
                        utilityMode === mode.id
                          ? "bg-[#E9A84A] text-[#171311]"
                          : "bg-[#171311] text-[#A0886B] hover:text-white"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Window controls: Snapping & Hide */}
              <div className="p-3 bg-[#2D2520] rounded-xl border border-white/5 flex flex-col gap-3">
                <span className="text-xs font-bold">
                  Screen Dock Snapping Presets
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerSnap("top-left")}
                    className="bg-[#171311] hover:bg-white/5 border border-white/5 py-1.5 text-2xs uppercase tracking-wider font-bold rounded-lg cursor-pointer text-w-text"
                  >
                    Top Left
                  </button>
                  <button
                    onClick={() => triggerSnap("top-right")}
                    className="bg-[#171311] hover:bg-white/5 border border-white/5 py-1.5 text-2xs uppercase tracking-wider font-bold rounded-lg cursor-pointer text-w-text"
                  >
                    Top Right
                  </button>
                  <button
                    onClick={() => triggerSnap("bottom-left")}
                    className="bg-[#171311] hover:bg-white/5 border border-white/5 py-1.5 text-2xs uppercase tracking-wider font-bold rounded-lg cursor-pointer text-w-text"
                  >
                    Bottom Left
                  </button>
                  <button
                    onClick={() => triggerSnap("bottom-right")}
                    className="bg-[#171311] hover:bg-white/5 border border-white/5 py-1.5 text-2xs uppercase tracking-wider font-bold rounded-lg cursor-pointer text-w-text"
                  >
                    Bottom Right
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">
                      Slide Edge Auto-Hide
                    </span>
                    <span className="text-[9px] text-[#8F7D74]">
                      Slides 90% off-screen when mouse leaves
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoHideEnabled}
                    onChange={(e) => {
                      setAutoHideEnabled(e.target.checked);
                      applyChanges({ autoHideEnabled: e.target.checked });
                    }}
                    className="accent-[#E9A84A] cursor-pointer w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">
                      Click-Through Ghost Mode
                    </span>
                    <span className="text-[9px] text-[#8F7D74]">
                      Makes widget pass all clicks. Toggle hotkey: Ctrl+Shift+G
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={ghostModeEnabled}
                    onChange={(e) => {
                      setGhostModeEnabled(e.target.checked);
                      applyChanges({ ghostModeEnabled: e.target.checked });
                    }}
                    className="accent-[#E9A84A] cursor-pointer w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">
                      Enable DeepSeek Status Widget
                    </span>
                    <span className="text-[9px] text-[#8F7D74]">
                      Shows API health status & token cost tracker
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={deepseekWidgetEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setDeepseekWidgetEnabled(enabled);
                      applyChanges({ deepseekWidgetEnabled: enabled });
                      if (enabled) {
                        window.electronAPI?.openDeepseekWidget?.();
                      } else {
                        window.electronAPI?.closeDeepseekWidget?.();
                      }
                    }}
                    className="accent-[#E9A84A] cursor-pointer w-4 h-4"
                  />
                </div>
              </div>

              {/* Secure API Keys Configuration */}
              <div className="p-3 bg-[#2D2520] rounded-xl border border-white/5 flex flex-col gap-3">
                <span className="text-xs font-bold">
                  Safe AI Commentator API Keys
                </span>
                <p className="text-[9px] text-[#8F7D74]">
                  Configure your Gemini or OpenRouter key. Keys are saved
                  locally on your computer and never sent elsewhere.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#A0886B] uppercase font-bold">
                      Gemini API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Paste your Gemini key here"
                      value={geminiKey}
                      onChange={(e) => {
                        setGeminiKey(e.target.value);
                        applyChanges({ geminiKey: e.target.value });
                      }}
                      className="bg-[#171311] border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none text-white focus:border-[#E9A84A]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#A0886B] uppercase font-bold">
                      OpenRouter API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Paste your OpenRouter key here"
                      value={openrouterKey}
                      onChange={(e) => {
                        setOpenrouterKey(e.target.value);
                        applyChanges({ openrouterKey: e.target.value });
                      }}
                      className="bg-[#171311] border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none text-white focus:border-[#E9A84A]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#A0886B] uppercase font-bold">
                      DeepSeek API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Paste your DeepSeek key (for usage billing)"
                      value={deepseekApiKey}
                      onChange={(e) => {
                        setDeepseekApiKey(e.target.value);
                        applyChanges({ deepseekApiKey: e.target.value });
                      }}
                      className="bg-[#171311] border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none text-white focus:border-[#E9A84A]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#A0886B] uppercase font-bold">
                      Credit Limit ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10.00"
                      value={deepseekCreditLimit}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setDeepseekCreditLimit(val);
                        applyChanges({ deepseekCreditLimit: val });
                      }}
                      className="bg-[#171311] border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none text-white focus:border-[#E9A84A]"
                    />
                    <span className="text-[8px] text-[#5A4232]">
                      Set your total DeepSeek credit balance. Remaining = limit
                      − used.
                    </span>
                  </div>
                </div>
              </div>

              {/* Global Shortcut configuration */}
              <div className="p-3 bg-[#2D2520] rounded-xl border border-white/5 flex flex-col gap-2">
                <span className="text-xs font-bold">
                  Global Shortcut Keybind
                </span>
                <p className="text-[9px] text-[#8F7D74]">
                  Set the key combination to show/hide the widget.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shortcutKey}
                    onChange={(e) => setShortcutKey(e.target.value)}
                    className="flex-1 bg-[#171311] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono outline-none text-white focus:border-[#E9A84A]"
                  />
                  <button
                    onClick={applyCustomShortcut}
                    className="bg-[#E9A84A] text-[#171311] font-bold text-xs px-3 rounded-lg cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Test Notifications */}
              <div className="p-3 bg-[#2D2520] rounded-xl border border-white/5 flex flex-col gap-3">
                <span className="text-xs font-bold">Test Notifications</span>
                <p className="text-[9px] text-[#8F7D74]">
                  Send a test OS notification to verify your system alerts are
                  working.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      window.electronAPI?.showToast?.({
                        id: Date.now(),
                        type: "goal",
                        scoringTeam: "England",
                        opponent: "France",
                        homeScore: "2",
                        awayScore: "1",
                        competition: "Test Match",
                        status: "live",
                        teamColor: "#E8744A",
                        scorer: "Harry Kane (23')",
                      });
                    }}
                    className="flex-1 bg-[#E9A84A] hover:bg-[#F4A475] text-[#171311] font-bold text-xs py-2 rounded-lg cursor-pointer transition-all active:scale-95"
                  >
                    ⚽ Test Football
                  </button>
                  <button
                    onClick={() => {
                      window.electronAPI?.showToast?.({
                        id: Date.now(),
                        type: "deepseek",
                        scoringTeam: "DeepSeek Credits Running Low",
                        opponent: "$0.42 remaining — test! This is working.",
                        homeScore: "⚠️ Low Credits",
                        awayScore: "",
                        competition: "DeepSeek",
                        status: "finished",
                        teamColor: "#52B788",
                      });
                    }}
                    className="flex-1 bg-[#E05353] hover:bg-red-500 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-all active:scale-95"
                  >
                    🔵 Test DeepSeek
                  </button>
                  <button
                    onClick={() => {
                      window.electronAPI?.showToast?.({
                        id: Date.now(),
                        type: "update",
                        scoringTeam: "Update v9.9.9 Available",
                        opponent:
                          "Test notification — this is what an update alert looks like.",
                        homeScore: "⬇ Download",
                        awayScore: "",
                        competition: "Update",
                        status: "finished",
                        teamColor: "#E9A84A",
                        downloadUrl: "https://football-widget.vercel.app",
                      });
                    }}
                    className="flex-1 bg-[#E9A84A] hover:bg-[#F4A475] text-[#171311] font-bold text-xs py-2 rounded-lg cursor-pointer transition-all active:scale-95"
                  >
                    ⬇ Test Update
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={async () => {
                      const { checkForUpdatesAndNotify } =
                        await import("../services/updateService");
                      const result = await checkForUpdatesAndNotify((notif) =>
                        window.electronAPI?.showToast?.(notif),
                      );
                      if (!result) {
                        window.electronAPI?.showToast?.({
                          id: Date.now(),
                          type: "update",
                          scoringTeam: "No Updates Available",
                          opponent: "You're running the latest version.",
                          homeScore: "✅",
                          awayScore: "",
                          competition: "Update",
                          status: "finished",
                          teamColor: "#52B788",
                        });
                      }
                    }}
                    className="w-full bg-[#2D2520] hover:bg-white/5 border border-white/10 text-[#F5E6D3] font-bold text-xs py-2 rounded-lg cursor-pointer transition-all active:scale-95"
                  >
                    🔍 Check for Updates
                  </button>
                </div>
              </div>

              {/* Filters: Leagues and Favorite Teams */}
              <div className="p-3 bg-[#2D2520] rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Favorite Teams</span>
                  {favoriteTeams.length > 0 && (
                    <span className="text-[9px] text-[#E9A84A] font-bold">
                      {favoriteTeams.length} selected
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-[#8F7D74]">
                  Click any team to follow them. Their goals will trigger
                  beautiful notifications and matches will sort to the top.
                </p>

                {/* Search filter */}
                <input
                  type="text"
                  placeholder="Search teams…"
                  value={favoriteInput}
                  onChange={(e) => setFavoriteInput(e.target.value)}
                  className="bg-[#171311] border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none text-white placeholder-[#5A4232] focus:border-[#E9A84A] w-full"
                />

                {/* Selected teams row */}
                {favoriteTeams.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {favoriteTeams.map((team, idx) => (
                      <span
                        key={idx}
                        className="bg-[#171311] border border-white/5 px-2 py-0.5 rounded text-[9px] flex items-center gap-1.5"
                      >
                        <span className="text-[#E9A84A]">★</span>
                        {team}
                        <button
                          onClick={() => removeFavoriteTeam(idx)}
                          className="text-[#E05353] font-bold text-[8px] cursor-pointer hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* League-grouped team browser */}
                <div
                  className="max-h-[280px] overflow-y-auto border border-white/5 rounded-lg bg-[#1A1410]"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {Object.entries(TEAMS_BY_LEAGUE).map(([league, teams]) => {
                    const filteredTeams = favoriteInput
                      ? teams.filter((t) =>
                          t.toLowerCase().includes(favoriteInput.toLowerCase()),
                        )
                      : teams;
                    if (filteredTeams.length === 0 && favoriteInput)
                      return null;

                    const allSelected = teams.every((t) =>
                      favoriteTeams.includes(t),
                    );
                    const anySelected = teams.some((t) =>
                      favoriteTeams.includes(t),
                    );

                    return (
                      <div
                        key={league}
                        className="border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-black/20">
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider"
                            style={{ color: "#8F7D74" }}
                          >
                            {league}
                          </span>
                          <button
                            onClick={() => {
                              let next;
                              if (allSelected) {
                                next = favoriteTeams.filter(
                                  (t) => !teams.includes(t),
                                );
                              } else {
                                const existing = new Set(favoriteTeams);
                                teams.forEach((t) => existing.add(t));
                                next = [...existing];
                              }
                              setFavoriteTeams(next);
                              applyChanges({ favoriteTeams: next });
                            }}
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                            style={{
                              color: allSelected ? "#E9A84A" : "#5A4232",
                              background: allSelected
                                ? "rgba(233,168,74,0.1)"
                                : "transparent",
                            }}
                            title={allSelected ? "Deselect all" : "Select all"}
                          >
                            {allSelected ? "✕ ALL" : "ALL"}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 px-2.5 py-1.5">
                          {filteredTeams.map((team) => {
                            const isFav = favoriteTeams.includes(team);
                            return (
                              <button
                                key={team}
                                onClick={() => {
                                  const next = isFav
                                    ? favoriteTeams.filter((t) => t !== team)
                                    : [...favoriteTeams, team];
                                  setFavoriteTeams(next);
                                  applyChanges({ favoriteTeams: next });
                                }}
                                className={`text-[8px] px-1.5 py-0.5 rounded cursor-pointer transition-all font-bold ${
                                  isFav
                                    ? "text-[#E9A84A]"
                                    : "text-[#8F7D74] hover:text-white"
                                }`}
                                style={{
                                  background: isFav
                                    ? "rgba(233,168,74,0.1)"
                                    : "rgba(255,255,255,0.03)",
                                  border: isFav
                                    ? "1px solid rgba(233,168,74,0.2)"
                                    : "1px solid rgba(255,255,255,0.05)",
                                }}
                              >
                                {isFav ? "★ " : ""}
                                {team}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="w-full h-px bg-white/5 my-1" />

                <span className="text-xs font-bold">Followed Leagues</span>
                <p className="text-[9px] text-[#8F7D74]">
                  Deselect leagues you do not wish to follow in the fixtures
                  panel.
                </p>
                <div className="flex flex-col gap-1.5 text-xs">
                  {[
                    "FIFA World Cup 2026",
                    "Premier League",
                    "UEFA Champions League",
                    "La Liga",
                    "Bundesliga",
                    "Serie A",
                    "Ligue 1",
                  ].map((league) => {
                    const checked = followedLeagues.includes(league);
                    return (
                      <label
                        key={league}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span>{league}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLeague(league)}
                          className="accent-[#E9A84A] cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KEEPIE-UPPIE GAME */}
          {activeTab === "game" && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#8F7D74]">
                  Keepie-Uppie Retro Challenge
                </span>
                <h3 className="font-serif text-lg font-bold text-[#E9A84A] mt-1">
                  High Score: {customTheme?.gameHighScore || 0}
                </h3>
                <p className="text-[9px] text-[#8F7D74] mt-1">
                  Use Left / Right Arrows (or A/D keys) to position the mascot
                  and bounce the ball.
                </p>
              </div>

              {/* Game Screen Container */}
              <div className="relative border-4 border-[#2D2520] rounded-2xl overflow-hidden shadow-2xl">
                <canvas
                  ref={gameCanvasRef}
                  width={280}
                  height={280}
                  className="block bg-[#1E293B]"
                />

                {/* Overlays */}
                {gameState === "idle" && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3">
                    <span className="text-xs text-[#8F7D74]">
                      PREVENT IT FROM FALLING!
                    </span>
                    <button
                      onClick={startGame}
                      className="bg-[#E9A84A] hover:bg-[#F4A475] text-[#171311] font-bold text-xs px-5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      START GAME
                    </button>
                  </div>
                )}

                {gameState === "gameover" && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-3">
                    <span className="text-sm font-bold text-[#E05353] font-mono">
                      GAME OVER
                    </span>
                    <span className="text-2xs text-[#8F7D74]">
                      FINAL SCORE: {gameScore}
                    </span>
                    <button
                      onClick={startGame}
                      className="bg-[#E9A84A] hover:bg-[#F4A475] text-[#171311] font-bold text-xs px-5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      TRY AGAIN
                    </button>
                  </div>
                )}

                {gameState === "playing" && (
                  <div className="absolute top-2 left-2 bg-black/55 px-3 py-1 rounded-md text-[10px] font-bold font-mono">
                    SCORE: {gameScore}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
