const speakBtn = document.getElementById("speak-btn");
const summarizeBtn = document.getElementById("summarize");
const resultDiv = document.getElementById("result");
const copyBtn = document.getElementById("copy-btn");
const summaryTypeSelect = document.getElementById("summary-type");
const floatingControls = document.getElementById("floating-controls");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");

// TTS State Management
let isSpeaking = false;
let isPaused = false;
let utterance = null;
let currentText = "";

document.addEventListener("DOMContentLoaded", () => {
  summarizeBtn.addEventListener("click", async () => {
    resultDiv.textContent = "Summarizing...";

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        resultDiv.textContent = "❌ Could not get the active tab.";
        return;
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/content.js"],
      });

      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { type: "GET_ARTICLE_TEXT" }, (res) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          resolve(res);
        });
      });

      if (!response || !response.text) {
        resultDiv.textContent = "❌ Couldn't extract text from this page.";
        return;
      }

      const { text } = response;
      const summaryType = summaryTypeSelect.value;

      const summary = await chrome.runtime.sendMessage({
        action: "summarize_text",
        text,
        summaryType,
        showTooltip: false,
      });

      resultDiv.textContent = summary || "⚠️ No summary returned.";
    } catch (err) {
      console.error("❌ Error:", err);
      resultDiv.textContent = `⚠️ ${err.message}`;
    }
  });

  copyBtn.addEventListener("click", () => {
    const text = document.getElementById("result").textContent;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy Summary"), 2000);
    });
  });
});

// Enhanced TTS Functionality
function showFloatingControls() {
  floatingControls.classList.add("visible");
  speakBtn.classList.add("disabled");
}

function hideFloatingControls() {
  floatingControls.classList.remove("visible");
  speakBtn.classList.remove("disabled");
}

function updatePauseButtonIcon() {
  const pauseIcon = pauseBtn.querySelector(".floating-icon");
  pauseIcon.textContent = isPaused ? "▶️" : "⏸";
}

function startTTS(text) {
  if (!text || isSpeaking) return;

  currentText = text;
  utterance = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  utterance.voice =
    voices.find((v) => v.name.includes("Google US English")) || voices[0];
  utterance.rate = 1;
  utterance.pitch = 1.1;

  utterance.onend = () => {
    isSpeaking = false;
    isPaused = false;
    hideFloatingControls();
    // Ensure microphone button is re-enabled
    speakBtn.classList.remove("disabled");
  };

  utterance.onpause = () => {
    isPaused = true;
    updatePauseButtonIcon();
  };

  utterance.onresume = () => {
    isPaused = false;
    updatePauseButtonIcon();
  };

  speechSynthesis.speak(utterance);
  isSpeaking = true;
  isPaused = false;
  showFloatingControls();
  updatePauseButtonIcon();
}

function pauseResumeTTS() {
  if (!isSpeaking) return;

  if (isPaused) {
    speechSynthesis.resume();
  } else {
    speechSynthesis.pause();
  }
}

function stopTTS() {
  if (!isSpeaking) return;

  speechSynthesis.cancel();
  isSpeaking = false;
  isPaused = false;
  hideFloatingControls();

  // Restart TTS from beginning
  if (currentText) {
    setTimeout(() => startTTS(currentText), 100);
  }
}

// Event Listeners
speakBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  // Don't allow clicks if button is disabled
  if (speakBtn.classList.contains("disabled")) {
    return;
  }

  const text = resultDiv.innerText.trim();

  if (!text || text === "Select a Type and click Summarize") return;

  if (!isSpeaking) {
    startTTS(text);
  }
});

pauseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  pauseResumeTTS();
});

stopBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  stopTTS();
});

// Outside click detection
document.addEventListener("click", (e) => {
  const isClickInsideControls = floatingControls.contains(e.target);
  const isClickOnSpeakBtn = speakBtn.contains(e.target);

  if (isSpeaking && !isClickInsideControls && !isClickOnSpeakBtn) {
    hideFloatingControls();
    // Don't stop TTS, just hide controls
  }
});

// Prevent floating controls from triggering outside click
floatingControls.addEventListener("click", (e) => {
  e.stopPropagation();
});
