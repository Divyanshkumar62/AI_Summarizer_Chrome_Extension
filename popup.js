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

// Error message constants
const ERROR_MESSAGES = {
  TAB_NOT_FOUND: "❌ Could not get the active tab.",
  TEXT_EXTRACTION_FAILED: "❌ Couldn't extract text from this page.",
  NO_SUMMARY: "⚠️ No summary returned.",
  TTS_FAILED: "🔇 Text-to-Speech failed. Your browser may not support it.",
  TTS_NOT_SUPPORTED: "🔇 Text-to-Speech is not supported in this browser.",
  UNKNOWN_ERROR: "❌ An unexpected error occurred. Please try again.",
};

// Check if TTS is supported
function isTTSSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

// Safe text content assignment (XSS protection)
function setTextContent(element, text) {
  if (element && typeof text === "string") {
    element.textContent = text;
  }
}

// Show error message
function showError(message) {
  setTextContent(resultDiv, message);
}

// Show loading message
function showLoading() {
  setTextContent(resultDiv, "Summarizing...");
}

document.addEventListener("DOMContentLoaded", () => {
  try {
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
  } catch (error) {
    console.error("[Popup] Error showing floating controls:", error);
  }
}

function hideFloatingControls() {
  try {
    floatingControls.classList.remove("visible");
    speakBtn.classList.remove("disabled");
  } catch (error) {
    console.error("[Popup] Error hiding floating controls:", error);
  }
}

function updatePauseButtonIcon() {
  try {
    const pauseIcon = pauseBtn.querySelector(".floating-icon");
    if (pauseIcon) {
      pauseIcon.textContent = isPaused ? "▶️" : "⏸";
    }
  } catch (error) {
    console.error("[Popup] Error updating pause icon:", error);
  }
}

function startTTS(text) {
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

    // Get available voices
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

    utterance.onerror = (event) => {
      console.error("[Popup] TTS Error:", event);
      isSpeaking = false;
      isPaused = false;
      hideFloatingControls();
      showError(ERROR_MESSAGES.TTS_FAILED);
    };

    speechSynthesis.speak(utterance);
    isSpeaking = true;
    isPaused = false;
    showFloatingControls();
    updatePauseButtonIcon();
  } catch (error) {
    console.error("[Popup] TTS start error:", error);
    isSpeaking = false;
    isPaused = false;
    hideFloatingControls();
    showError(ERROR_MESSAGES.TTS_FAILED);
  }
}

function pauseResumeTTS() {
  try {
    if (!isSpeaking) return;

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

    speechSynthesis.cancel();
    isSpeaking = false;
    isPaused = false;
    hideFloatingControls();

    // Restart TTS from beginning
    if (currentText) {
      setTimeout(() => startTTS(currentText), 100);
    }
  } catch (error) {
    console.error("[Popup] TTS stop error:", error);
    isSpeaking = false;
    isPaused = false;
    hideFloatingControls();
  }
}

// Event Listeners
speakBtn.addEventListener("click", (e) => {
  try {
    e.stopPropagation();

    // Don't allow clicks if button is disabled
    if (speakBtn.classList.contains("disabled")) {
      return;
    }

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

// Outside click detection
document.addEventListener("click", (e) => {
  try {
    const isClickInsideControls = floatingControls.contains(e.target);
    const isClickOnSpeakBtn = speakBtn.contains(e.target);

    if (isSpeaking && !isClickInsideControls && !isClickOnSpeakBtn) {
      hideFloatingControls();
      // Don't stop TTS, just hide controls
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
