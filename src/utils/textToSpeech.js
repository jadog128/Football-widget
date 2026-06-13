export function speakEvent(text, volume = 0.5) {
  if (!window.speechSynthesis) return;

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;

    // Apply chiptune / robotic settings (high pitch, slightly slower rate)
    utterance.pitch = 1.6; // High pitch for a tiny game console vibe
    utterance.rate = 1.05; // Slightly faster/robotic cadence

    // Look for a robotic or English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") || v.name.includes("Natural")),
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Text-to-speech commentary error:", err);
  }
}
