/**
 * PixelMascot
 *
 * Renders a 12×14 pixel-art creature using inline SVG rectangles.
 * Supports accessories overlay, custom drawing canvas grids,
 * click interactions (wink/wave), and confetti animations.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useWidgetStore } from '../store/widgetStore'

// ── Palette ──────────────────────────────────────────────────────────────────

const P = {
  0: null,        // transparent
  1: '#E8744A',   // main orange body
  2: '#C95B35',   // shadow/shading
  3: '#1A0F0A',   // dark detail (eyes, mouth)
  4: '#F4A475',   // highlight orange
  5: '#FFFFFF',   // sparkle white
}

// ── Pixel grids (12 cols × 14 rows) ─────────────────────────────────────────

const STATES = {
  idle: [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,4,4,4,4,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,3,3,1,1,1,1,3,3,1,1],
    [1,1,3,3,1,1,1,1,3,3,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,3,1,1,1,1,3,1,1,1],
    [1,1,1,1,3,3,3,3,1,1,1,1],
    [0,2,1,1,1,1,1,1,1,1,2,0],
    [0,0,2,2,1,1,1,1,2,2,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,0,2,2,0,0,0,0,2,2,0,0],
  ],

  hype: [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,4,4,4,4,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,3,3,5,1,1,5,3,3,1,1],
    [1,1,3,3,1,1,1,1,3,3,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,3,3,3,3,3,3,3,3,1,1],
    [1,1,1,3,1,1,1,1,3,1,1,1],
    [0,2,1,1,1,1,1,1,1,1,2,0],
    [0,0,2,2,1,1,1,1,2,2,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [2,0,2,2,0,0,0,0,2,2,0,2],
  ],

  sleep: [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,4,4,4,4,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,3,3,3,1,1,3,3,3,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,3,3,3,1,1,1,1,1],
    [0,2,1,1,1,1,1,1,1,1,2,0],
    [0,0,2,2,1,1,1,1,2,2,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,0,2,2,0,0,0,0,2,2,0,0],
  ],

  alert: [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,4,4,4,4,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,3,3,5,1,1,5,3,3,1,1],
    [1,1,3,3,1,1,1,1,3,3,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,3,3,3,1,1,1,1,1],
    [1,1,1,1,3,0,3,1,1,1,1,1],
    [0,2,1,1,3,3,3,1,1,1,2,0],
    [0,0,2,2,1,1,1,1,2,2,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0],
    [0,0,2,2,0,0,0,0,2,2,0,0],
  ],
}

// ── Alert exclamation icon (8×12) ────────────────────────────────────────────

const ALERT_ICON = [
  [0,0,6,6,6,0,0],
  [0,6,6,7,6,6,0],
  [0,6,7,7,7,6,0],
  [0,6,7,7,7,6,0],
  [0,6,7,7,7,6,0],
  [0,6,6,7,6,6,0],
  [0,0,6,7,6,0,0],
  [0,0,0,0,0,0,0],
  [0,0,6,6,6,0,0],
  [0,6,6,7,6,6,0],
  [0,6,7,7,7,6,0],
  [0,0,6,6,6,0,0],
]
const ALERT_PALETTE = { ...P, 6: '#E85D5D', 7: '#FFFFFF' }

// ── ZZZ bubble component ──────────────────────────────────────────────────────

function ZzzBubbles() {
  return (
    <div className="absolute -top-2 -right-1 pointer-events-none select-none">
      <span className="zzz-bubble" style={{ right: 0,  top: 0  }}>z</span>
      <span className="zzz-bubble" style={{ right: -6, top: -8 }}>z</span>
      <span className="zzz-bubble" style={{ right: -12,top: -18}}>Z</span>
    </div>
  )
}

// ── Confetti canvas ───────────────────────────────────────────────────────────

function ConfettiCanvas({ w, h }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrame;
    const colors = ["#FFD700", "#FF007F", "#00FFFF", "#FFE042", "#FF6B6B"];
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: h + Math.random() * 5,
      vx: (Math.random() - 0.5) * 2.2,
      vy: -Math.random() * 3 - 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 2 + 1.5,
    }));

    function loop() {
      ctx.clearRect(0, 0, w, h);
      let active = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        if (p.y < h + 10) active = true;

        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      });
      if (active) {
        animationFrame = requestAnimationFrame(loop);
      }
    }
    loop();
    return () => cancelAnimationFrame(animationFrame);
  }, [w, h]);

  return <canvas ref={canvasRef} width={w} height={h} className="absolute inset-0 pointer-events-none" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PixelMascot({
  state     = 'idle',
  pixelSize = 4,
  className = '',
  showAlert = false,
  animate   = true,
}) {
  const customTheme = useWidgetStore((s) => s.customTheme);
  const customMascot = customTheme?.customMascot;
  const customGrid = customTheme?.customGrid;
  const activeSkin = customTheme?.activeSkin || "default";

  const [clickedAnim, setClickedAnim] = useState(null);
  const [speechBubble, setSpeechBubble] = useState(null);

  // If match status is live and team just scored, show a goal celebration
  useEffect(() => {
    if (state === "hype") {
      setSpeechBubble("GOAL!");
      const timer = setTimeout(() => setSpeechBubble(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleClick = () => {
    if (clickedAnim) return;
    const anims = ["wink", "wave", "cheer"];
    const chosen = anims[Math.floor(Math.random() * anims.length)];
    setClickedAnim(chosen);

    if (chosen === "cheer") {
      setSpeechBubble("HI YA!");
    } else if (chosen === "wink") {
      setSpeechBubble("WINK!");
    } else {
      setSpeechBubble("WAVE!");
    }

    setTimeout(() => {
      setClickedAnim(null);
      setSpeechBubble(null);
    }, 1200);
  };

  // Determine grid based on state and click animations
  let grid = customGrid || STATES[state] || STATES.idle;
  if (!customGrid) {
    if (clickedAnim === "wink") {
      // modify eye rows of idle grid
      grid = JSON.parse(JSON.stringify(STATES.idle));
      grid[4] = [1,1,3,3,3,1,1,3,3,3,1,1]; // closed lines
    } else if (clickedAnim === "cheer") {
      grid = STATES.hype;
    }
  }

  const rows = grid.length;
  const cols = grid[0].length;
  const w = cols * pixelSize;
  const h = rows * pixelSize;

  const wrapperClass = [
    'relative inline-block pixel-render cursor-pointer select-none',
    animate && state === 'idle' && !clickedAnim ? 'animate-bob'  : '',
    animate && state === 'hype' ? 'animate-bob'  : '',
    animate && state === 'alert' ? 'alert-bounce' : '',
    clickedAnim === 'cheer' ? 'alert-bounce' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass} style={{ width: w, height: h }} onClick={handleClick}>
      {/* Speech bubble overlay */}
      {speechBubble && (
        <div 
          className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#FFF8EE] text-[#1A0F0A] border border-[#1A0F0A] px-2 py-0.5 rounded text-[8px] font-bold font-mono shadow-md z-10 animate-bounce whitespace-nowrap"
        >
          {speechBubble}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1A0F0A]" />
        </div>
      )}

      {/* Main mascot: either custom image or SVG grid */}
      {customMascot ? (
        <img
          src={customMascot}
          alt="Mascot"
          className="pixel-render block select-none"
          style={{ width: w, height: h, objectFit: 'contain' }}
          draggable={false}
        />
      ) : (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ imageRendering: 'pixelated', display: 'block' }}
        >
          {grid.map((row, y) =>
            row.map((key, x) => {
              const fill = P[key];
              if (!fill) return null;
              return (
                <rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={fill}
                />
              )
            })
          )}

          {/* Dynamic accessories layer (works on custom sprites as well!) */}
          {activeSkin === "crown" && (
            <>
              {/* Gold Crown */}
              <rect x={4*pixelSize} y={0*pixelSize} width={pixelSize} height={pixelSize} fill="#FFE042" />
              <rect x={6*pixelSize} y={0*pixelSize} width={pixelSize} height={pixelSize} fill="#FFE042" />
              <rect x={8*pixelSize} y={0*pixelSize} width={pixelSize} height={pixelSize} fill="#FFE042" />
              <rect x={4*pixelSize} y={1*pixelSize} width={5*pixelSize} height={pixelSize} fill="#FFE042" />
              <rect x={3*pixelSize} y={2*pixelSize} width={7*pixelSize} height={pixelSize} fill="#C69E00" />
            </>
          )}

          {activeSkin === "referee" && (
            <>
              {/* Referee stripes (black/white) */}
              {[9, 10, 11].map(y => (
                <React.Fragment key={y}>
                  <rect x={3*pixelSize} y={y*pixelSize} width={pixelSize} height={pixelSize} fill="#111" />
                  <rect x={4*pixelSize} y={y*pixelSize} width={pixelSize} height={pixelSize} fill="#FFF" />
                  <rect x={5*pixelSize} y={y*pixelSize} width={pixelSize} height={pixelSize} fill="#111" />
                  <rect x={6*pixelSize} y={y*pixelSize} width={pixelSize} height={pixelSize} fill="#FFF" />
                  <rect x={7*pixelSize} y={y*pixelSize} width={pixelSize} height={pixelSize} fill="#111" />
                  <rect x={8*pixelSize} y={y*pixelSize} width={pixelSize} height={pixelSize} fill="#FFF" />
                </React.Fragment>
              ))}
            </>
          )}

          {activeSkin === "visor" && (
            <>
              {/* Cyber Visor */}
              <rect x={2*pixelSize} y={4*pixelSize} width={8*pixelSize} height={2*pixelSize} fill="#FF007F" opacity="0.95" />
              <rect x={5*pixelSize} y={4*pixelSize} width={pixelSize} height={2*pixelSize} fill="#00FFFF" />
              <rect x={6*pixelSize} y={4*pixelSize} width={pixelSize} height={2*pixelSize} fill="#00FFFF" />
            </>
          )}

          {/* Arm wave modification */}
          {clickedAnim === "wave" && (
            <>
              <rect x={10*pixelSize} y={3*pixelSize} width={pixelSize} height={3*pixelSize} fill="#E8744A" />
              <rect x={11*pixelSize} y={2*pixelSize} width={pixelSize} height={pixelSize} fill="#F4A475" />
            </>
          )}
        </svg>
      )}

      {/* Confetti canvas celebration */}
      {(state === "hype" || clickedAnim === "cheer") && (
        <ConfettiCanvas w={w} h={h} />
      )}

      {/* Alert icon overlay (shown on compact alert state) */}
      {showAlert && (
        <div
          className="absolute -top-3 -right-2 pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        >
          <svg
            width={7 * 3}
            height={12 * 3}
            viewBox={`0 0 ${7 * 3} ${12 * 3}`}
            style={{ imageRendering: 'pixelated', display: 'block' }}
          >
            {ALERT_ICON.map((row, y) =>
              row.map((key, x) => {
                const fill = ALERT_PALETTE[key]
                if (!fill) return null
                return (
                  <rect
                    key={`a-${x}-${y}`}
                    x={x * 3}
                    y={y * 3}
                    width={3}
                    height={3}
                    fill={fill}
                  />
                )
              })
            )}
          </svg>
        </div>
      )}

      {/* Zzz bubbles when sleeping */}
      {state === 'sleep' && <ZzzBubbles />}
    </div>
  )
}
