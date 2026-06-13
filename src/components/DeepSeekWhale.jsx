import React from "react";

/**
 * 8-bit animated DeepSeek whale mascot.
 * Two variants: "wide" (horizontal, swimming) and "compact" (standing, splashing).
 */
export default function DeepSeekWhale({ variant = "wide", size = 4 }) {
  if (variant === "compact") {
    return <CompactWhale size={size} />;
  }
  return <WideWhale size={size} />;
}

// ── Wide / swimming whale ─────────────────────────────────────────────────────
// A horizontal whale swimming across the screen with a looping scroll animation

function WideWhale({ size = 4 }) {
  // 14x10 pixel grid — whale swimming left to right
  const frames = [
    // Frame 1: tail up
    [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,1,1,0,0,0],
      [0,0,0,0,0,1,1,1,4,4,1,1,0,0],
      [0,0,0,0,0,1,1,1,4,4,1,1,0,0],
      [0,0,0,0,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,0,1,1,1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,0,2,2,3,3,0],
    ],
    // Frame 2: tail down
    [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,1,1,0,0,0],
      [0,0,0,0,0,1,1,1,4,4,1,1,0,0],
      [0,0,0,0,0,1,1,1,4,4,1,1,0,0],
      [0,0,0,0,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,0,1,1,1,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,2,2,3,3,0],
    ],
  ];

  const P = {
    0: null,
    1: "#4A90D9", // body (DeepSeek blue)
    2: "#2E6BB5", // tail darker
    3: "#1A4A7A", // tail tip
    4: "#FFFFFF", // belly / highlight
  };

  return <AnimatedPixelArt frames={frames} palette={P} size={size} interval={600} />;
}

// ── Compact / splashing whale ─────────────────────────────────────────────────
// A vertical whale breaching the surface with splash particles

function CompactWhale({ size = 4 }) {
  const frames = [
    // Frame 1: up
    [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,0,0],
      [0,0,0,1,1,4,1,1,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,0,0,2,2,0,0,0,0],
      [0,0,0,0,2,2,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ],
    // Frame 2: splash!
    [
      [0,0,0,0,6,0,6,0,0,0],
      [0,0,0,6,0,0,0,6,0,0],
      [0,0,0,0,1,0,0,0,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,4,4,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,0,0,2,2,0,0,0,0],
      [0,0,0,0,2,2,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ],
  ];

  const P = {
    0: null,
    1: "#4A90D9", // body
    2: "#2E6BB5", // tail
    4: "#FFFFFF", // belly
    6: "#6CB4EE", // splash
  };

  return (
    <div className="animate-bob">
      <AnimatedPixelArt frames={frames} palette={P} size={size} interval={800} />
    </div>
  );
}

// ── Generic animated pixel art renderer ───────────────────────────────────────

function AnimatedPixelArt({ frames, palette, size, interval }) {
  const [frameIdx, setFrameIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % frames.length);
    }, interval);
    return () => clearInterval(timer);
  }, [frames.length, interval]);

  const grid = frames[frameIdx];
  const rows = grid.length;
  const cols = grid[0].length;
  const w = cols * size;
  const h = rows * size;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ imageRendering: "pixelated", display: "block" }}
    >
      {grid.map((row, y) =>
        row.map((key, x) => {
          const fill = palette[key];
          if (!fill) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * size}
              y={y * size}
              width={size}
              height={size}
              fill={fill}
            />
          );
        }),
      )}
    </svg>
  );
}
