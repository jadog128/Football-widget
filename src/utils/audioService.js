// Chiptune Audio Service using Web Audio API

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSound(type, volume = 0.5) {
  try {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (type === "whistle") {
      // Kickoff referee whistle
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(950, ctx.currentTime);

      lfo.type = "sine";
      lfo.frequency.setValueAtTime(32, ctx.currentTime); // 32 Hz vibrato
      lfoGain.gain.setValueAtTime(180, ctx.currentTime); // Frequency deviation

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);

      lfo.start(ctx.currentTime);
      osc.start(ctx.currentTime);

      lfo.stop(ctx.currentTime + 0.35);
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "fanfare") {
      // Goal notification - clean two-tone chime
      [880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.1 + 0.3,
        );
        osc.connect(g);
        g.connect(masterGain);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.35);
      });
    } else if (type === "fulltime") {
      // Full time - three short descending beeps
      [800, 700, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
        g.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.15 + 0.2,
        );
        osc.connect(g);
        g.connect(masterGain);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.25);
      });
    } else if (type === "deepseek-alert") {
      // Low credits - two-tone alert (like a phone warning)
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        g.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.15 + 0.25,
        );
        osc.connect(g);
        g.connect(masterGain);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } else if (type === "notification-ping") {
      // Standard notification ping - single clean tone
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (err) {
    console.error("Failed to play synthesis sound:", err);
  }
}
