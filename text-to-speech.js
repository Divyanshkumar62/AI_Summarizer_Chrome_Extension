let utterance = null;
let isSpeaking = false;
let isPaused = false;

export function toggleSpeech(text, button) {
  if (!text.trim()) return;

  if (!utterance || !isSpeaking) {
    // Create a new utterance
    utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    utterance.voice =
      voices.find((v) => v.name.includes("Google US English")) || voices[0];
    utterance.rate = 1;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      isSpeaking = false;
      isPaused = false;
      if (button) button.textContent = "🔊 Listen";
    };

    speechSynthesis.speak(utterance);
    isSpeaking = true;
    isPaused = false;
    if (button) button.textContent = "⏸ Pause";
  } else if (!isPaused) {
    speechSynthesis.pause();
    isPaused = true;
    if (button) button.textContent = "▶️ Resume";
  } else {
    speechSynthesis.resume();
    isPaused = false;
    if (button) button.textContent = "⏸ Pause";
  }
}
