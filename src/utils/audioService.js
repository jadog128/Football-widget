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
      // Goal celebration fanfare (arpeggio)
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.15);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.18);
      });

    } else if (type === "fulltime") {
      // Tricolor whistle (short, short, long)
      const playWhistle = (startTime, duration, freq) => {
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        lfo.type = "sine";
        lfo.frequency.setValueAtTime(35, startTime);
        lfoGain.gain.setValueAtTime(200, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.8, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(masterGain);

        lfo.start(startTime);
        osc.start(startTime);
        lfo.stop(startTime + duration);
        osc.stop(startTime + duration);
      };

      playWhistle(ctx.currentTime + 0.0, 0.15, 900);
      playWhistle(ctx.currentTime + 0.2, 0.15, 900);
      playWhistle(ctx.currentTime + 0.4, 0.45, 1100);
    }
  } catch (err) {
    console.error("Failed to play synthesis sound:", err);
  }
}
