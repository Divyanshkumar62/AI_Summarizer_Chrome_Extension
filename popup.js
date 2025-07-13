const speakBtn = document.getElementById("speak-btn");
const summarizeBtn = document.getElementById("summarize");
const resultDiv = document.getElementById("result");
const copyBtn = document.getElementById("copy-btn");
const summaryTypeSelect = document.getElementById("summary-type");
const floatingControls = document.getElementById("floating-controls");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");
const settingsBtn = document.getElementById("settings-btn");

// TTS State Management
let isSpeaking = false;
let isPaused = false;
let utterance = null;
let currentText = "";
let ttsSettings = { voice: "Google US English", speed: 1.0 };
let isStoppingTTS = false; // Flag to prevent error messages when stopping

// Error message constants
const ERROR_MESSAGES = {
  TAB_NOT_FOUND: "❌ Could not get the active tab.",
  TEXT_EXTRACTION_FAILED: "❌ Couldn't extract text from this page.",
  NO_SUMMARY: "⚠️ No summary returned.",
  TTS_FAILED: "🔇 Text-to-Speech failed. Your browser may not support it.",
  TTS_NOT_SUPPORTED: "🔇 Text-to-Speech is not supported in this browser.",
  PAUSE_NOT_SUPPORTED:
    "⏸ Pause not supported in this browser. Click stop to restart.",
  UNKNOWN_ERROR: "❌ An unexpected error occurred. Please try again.",
};

// Check if TTS is supported
function isTTSSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

// Check if pause/resume is supported
function isPauseResumeSupported() {
  return (
    "speechSynthesis" in window &&
    "pause" in speechSynthesis &&
    "resume" in speechSynthesis
  );
}

// Load settings from storage
async function loadSettings() {
  try {
    // Load TTS settings
    const { ttsSettings: settings } = await chrome.storage.sync.get([
      "ttsSettings",
    ]);
    if (settings) {
      ttsSettings = settings;
      console.log("[Popup] TTS settings loaded:", ttsSettings);
    } else {
      console.log("[Popup] No TTS settings found, using defaults");
    }

    // Load General settings
    const { generalSettings } = await chrome.storage.sync.get([
      "generalSettings",
    ]);
    if (generalSettings) {
      // Apply default summary type
      if (generalSettings.defaultSummaryType) {
        summaryTypeSelect.value = generalSettings.defaultSummaryType;
        console.log(
          "[Popup] Default summary type applied:",
          generalSettings.defaultSummaryType
        );
      }

      // Apply theme
      if (generalSettings.theme) {
        applyTheme(generalSettings.theme);
        console.log("[Popup] Theme applied:", generalSettings.theme);
      }
    } else {
      console.log("[Popup] No general settings found, using defaults");
    }
  } catch (error) {
    console.error("[Popup] Error loading settings:", error);
  }
}

// Theme Management
function applyTheme(theme) {
  const root = document.documentElement;

  // Remove existing theme attributes
  root.removeAttribute("data-theme");

  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else if (theme === "auto") {
    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      root.setAttribute("data-theme", "dark");
    }
  }
  // Light theme is default, no attribute needed
}

// Wait for voices to be available
function waitForVoices() {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
    }
  });
}

// Get the correct voice based on settings
function getVoiceFromSettings(voices) {
  if (ttsSettings.voice === "Google US English") {
    return (
      voices.find((v) => v.name.includes("Google US English")) || voices[0]
    );
  } else {
    return voices.find((v) => v.name === ttsSettings.voice) || voices[0];
  }
}

// Safe text content assignment (XSS protection)
function setTextContent(element, text) {
  if (element && typeof text === "string") {
    element.textContent = text;
  }
}

// Show error message (without replacing summary)
function showError(message) {
  // Don't replace summary text with error messages
  console.error("[Popup] Error:", message);
}

// Show loading message
function showLoading() {
  setTextContent(resultDiv, "Summarizing...");
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load settings first
    await loadSettings();

    // Preload voices so they're available immediately
    await waitForVoices();
    console.log("[Popup] Voices preloaded successfully");

    summarizeBtn.addEventListener("click", async () => {
      try {
        console.log("[Popup] Summarize button clicked");
        showLoading();

        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab || !tab.id) {
          console.error("[Popup] No active tab found");
          showError(ERROR_MESSAGES.TAB_NOT_FOUND);
          return;
        }

        console.log("[Popup] Active tab found:", tab.id);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content.js"],
        });

        console.log("[Popup] Content script injected");

        const response = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(
            tab.id,
            { type: "GET_ARTICLE_TEXT" },
            (res) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "[Popup] Chrome runtime error:",
                  chrome.runtime.lastError
                );
                return reject(new Error(chrome.runtime.lastError.message));
              }
              console.log("[Popup] Article text response:", res);
              resolve(res);
            }
          );
        });

        if (!response || !response.text) {
          console.error("[Popup] No text extracted from page");
          showError(ERROR_MESSAGES.TEXT_EXTRACTION_FAILED);
          return;
        }

        console.log("[Popup] Text extracted, length:", response.text.length);
        const { text } = response;
        const summaryType = summaryTypeSelect.value;

        console.log("[Popup] Sending summarization request...");
        const summary = await chrome.runtime.sendMessage({
          action: "summarize_text",
          text,
          summaryType,
          showTooltip: false,
        });

        console.log(
          "[Popup] Summary received:",
          summary ? "Success" : "Failed"
        );
        setTextContent(resultDiv, summary || ERROR_MESSAGES.NO_SUMMARY);
      } catch (err) {
        console.error("[Popup] Detailed error:", err);
        showError(`⚠️ ${err.message || ERROR_MESSAGES.UNKNOWN_ERROR}`);
      }
    });

    copyBtn.addEventListener("click", () => {
      try {
        const text = resultDiv.textContent;
        if (!text || text === "Select a Type and click Summarize") {
          return;
        }

        // Update button to show copy icon and text
        copyBtn.innerHTML = "<span>📋</span> Copy";

        navigator.clipboard
          .writeText(text)
          .then(() => {
            // Success state - green background with checkmark
            copyBtn.innerHTML = "<span>✓</span> Copied!";
            copyBtn.style.background = "#059669";
            copyBtn.style.transform = "translateY(-1px)";
            copyBtn.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.2)";

            setTimeout(() => {
              // Reset to original state
              copyBtn.innerHTML = "<span>📋</span> Copy";
              copyBtn.style.background = "";
              copyBtn.style.transform = "";
              copyBtn.style.boxShadow = "";
            }, 1500);
          })
          .catch((error) => {
            console.error("[Popup] Copy failed:", error);
            // Error state - red background
            copyBtn.innerHTML = "<span>❌</span> Failed";
            copyBtn.style.background = "#dc2626";
            copyBtn.style.transform = "translateY(-1px)";
            copyBtn.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.2)";

            setTimeout(() => {
              // Reset to original state
              copyBtn.innerHTML = "<span>📋</span> Copy";
              copyBtn.style.background = "";
              copyBtn.style.transform = "";
              copyBtn.style.boxShadow = "";
            }, 1500);
          });
      } catch (error) {
        console.error("[Popup] Copy error:", error);
        // Error state for exception
        copyBtn.innerHTML = "<span>❌</span> Failed";
        copyBtn.style.background = "#dc2626";
        copyBtn.style.transform = "translateY(-1px)";
        copyBtn.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.2)";

        setTimeout(() => {
          // Reset to original state
          copyBtn.innerHTML = "<span>📋</span> Copy";
          copyBtn.style.background = "";
          copyBtn.style.transform = "";
          copyBtn.style.boxShadow = "";
        }, 1500);
      }
    });
  } catch (error) {
    console.error("[Popup] DOMContentLoaded error:", error);
  }
});

// Enhanced TTS Functionality
function showFloatingControls() {
  try {
    floatingControls.classList.add("visible");
    speakBtn.classList.add("disabled");

    // Update pause button based on browser support
    updatePauseButtonSupport();
  } catch (error) {
    console.error("[Popup] Error showing floating controls:", error);
  }
}

function hideFloatingControls() {
  try {
    floatingControls.classList.remove("visible");
    speakBtn.classList.remove("disabled");

    // If we're hiding controls and not speaking, clear the state
    if (!isSpeaking) {
      currentText = "";
      utterance = null;
    }
  } catch (error) {
    console.error("[Popup] Error hiding floating controls:", error);
  }
}

function updatePauseButtonSupport() {
  try {
    const pauseIcon = pauseBtn.querySelector(".floating-icon");
    if (!isPauseResumeSupported()) {
      pauseIcon.textContent = "⏸";
      pauseBtn.title = ERROR_MESSAGES.PAUSE_NOT_SUPPORTED;
      pauseBtn.classList.add("disabled");
      pauseBtn.style.opacity = "0.5";
      pauseBtn.style.cursor = "not-allowed";
    } else {
      pauseBtn.title = "Pause/Resume";
      pauseBtn.classList.remove("disabled");
      pauseBtn.style.opacity = "1";
      pauseBtn.style.cursor = "pointer";
      updatePauseButtonIcon();
    }
  } catch (error) {
    console.error("[Popup] Error updating pause button support:", error);
  }
}

function updatePauseButtonIcon() {
  try {
    const pauseIcon = pauseBtn.querySelector(".floating-icon");
    if (pauseIcon && isPauseResumeSupported()) {
      pauseIcon.textContent = isPaused ? "▶️" : "⏸";
    }
  } catch (error) {
    console.error("[Popup] Error updating pause icon:", error);
  }
}

async function startTTS(text) {
  try {
    if (!text || isSpeaking) return;

    // Check TTS support
    if (!isTTSSupported()) {
      showError(ERROR_MESSAGES.TTS_NOT_SUPPORTED);
      return;
    }

    // Cancel any existing speech to prevent overlapping
    speechSynthesis.cancel();

    currentText = text;
    utterance = new SpeechSynthesisUtterance(text);

    // Wait for voices to be available and apply TTS settings
    const voices = await waitForVoices();
    console.log(
      "[Popup] Available voices:",
      voices.map((v) => v.name)
    );
    console.log("[Popup] Using TTS settings:", ttsSettings);

    // Get the correct voice based on settings
    const selectedVoice = getVoiceFromSettings(voices);
    utterance.voice = selectedVoice;
    console.log("[Popup] Selected voice:", selectedVoice?.name);

    utterance.rate = ttsSettings.speed;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      if (!isStoppingTTS) {
        isSpeaking = false;
        isPaused = false;
        hideFloatingControls();
        // Ensure microphone button is re-enabled
        speakBtn.classList.remove("disabled");
      }
    };

    utterance.onpause = () => {
      if (!isStoppingTTS) {
        isPaused = true;
        updatePauseButtonIcon();
      }
    };

    utterance.onresume = () => {
      if (!isStoppingTTS) {
        isPaused = false;
        updatePauseButtonIcon();
      }
    };

    utterance.onerror = (event) => {
      if (!isStoppingTTS) {
        console.error("[Popup] TTS Error:", event);
        isSpeaking = false;
        isPaused = false;
        hideFloatingControls();
        showError(ERROR_MESSAGES.TTS_FAILED);
      }
    };

    speechSynthesis.speak(utterance);
    isSpeaking = true;
    isPaused = false;
    isStoppingTTS = false;
    showFloatingControls();
    updatePauseButtonIcon();
  } catch (error) {
    console.error("[Popup] TTS start error:", error);
    isSpeaking = false;
    isPaused = false;
    isStoppingTTS = false;
    hideFloatingControls();
    showError(ERROR_MESSAGES.TTS_FAILED);
  }
}

function pauseResumeTTS() {
  try {
    if (!isSpeaking || !isPauseResumeSupported()) return;

    if (isPaused) {
      speechSynthesis.resume();
    } else {
      speechSynthesis.pause();
    }
  } catch (error) {
    console.error("[Popup] TTS pause/resume error:", error);
    showError(ERROR_MESSAGES.TTS_FAILED);
  }
}

function stopTTS() {
  try {
    if (!isSpeaking) return;

    // Set flag to prevent error messages
    isStoppingTTS = true;

    speechSynthesis.cancel();
    isSpeaking = false;
    isPaused = false;
    hideFloatingControls();

    // Clear current text and utterance
    currentText = "";
    utterance = null;

    // Ensure microphone button is re-enabled
    speakBtn.classList.remove("disabled");

    // Reset flag after a short delay
    setTimeout(() => {
      isStoppingTTS = false;
    }, 100);
  } catch (error) {
    console.error("[Popup] TTS stop error:", error);
    isSpeaking = false;
    isPaused = false;
    isStoppingTTS = false;
    hideFloatingControls();
    currentText = "";
    utterance = null;
    speakBtn.classList.remove("disabled");
  }
}

// Event Listeners
speakBtn.addEventListener("click", async (e) => {
  try {
    e.stopPropagation();

    // Don't allow clicks if button is disabled
    if (speakBtn.classList.contains("disabled")) {
      return;
    }

    // Reload settings to ensure we have the latest
    await loadSettings();

    const text = resultDiv.textContent.trim();

    if (!text || text === "Select a Type and click Summarize") return;

    if (!isSpeaking) {
      startTTS(text);
    }
  } catch (error) {
    console.error("[Popup] Speak button click error:", error);
  }
});

pauseBtn.addEventListener("click", (e) => {
  try {
    e.stopPropagation();

    // Don't allow clicks if pause is not supported
    if (!isPauseResumeSupported()) {
      return;
    }

    pauseResumeTTS();
  } catch (error) {
    console.error("[Popup] Pause button click error:", error);
  }
});

stopBtn.addEventListener("click", (e) => {
  try {
    e.stopPropagation();
    stopTTS();
  } catch (error) {
    console.error("[Popup] Stop button click error:", error);
  }
});

// Settings button event listener
settingsBtn.addEventListener("click", () => {
  try {
    console.log("[Popup] Settings button clicked, opening options page");
    chrome.runtime.openOptionsPage();
  } catch (error) {
    console.error("[Popup] Error opening options page:", error);
  }
});

// Outside click detection
document.addEventListener("click", (e) => {
  try {
    const isClickInsideControls = floatingControls.contains(e.target);
    const isClickOnSpeakBtn = speakBtn.contains(e.target);

    if (isSpeaking && !isClickInsideControls && !isClickOnSpeakBtn) {
      hideFloatingControls();
      // Don't stop TTS, just hide controls - TTS continues in background
    }
  } catch (error) {
    console.error("[Popup] Outside click detection error:", error);
  }
});

// Prevent floating controls from triggering outside click
floatingControls.addEventListener("click", (e) => {
  try {
    e.stopPropagation();
  } catch (error) {
    console.error("[Popup] Floating controls click error:", error);
  }
});
