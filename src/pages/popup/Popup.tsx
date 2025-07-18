import React, { useState, useEffect, useRef, useCallback } from "react";

// Types
interface TTSSettings {
  voice: string;
  speed: number;
}

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

const Popup: React.FC = () => {
  // State management
  const [summaryType, setSummaryType] = useState<string>("brief");
  const [result, setResult] = useState<string>(
    "Select a Type and click Summarize"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showFloatingControls, setShowFloatingControls] =
    useState<boolean>(false);
  const [ttsSettings, setTtsSettings] = useState<TTSSettings>({
    voice: "Google US English",
    speed: 1.0,
  });

  // Refs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isStoppingTTSRef = useRef<boolean>(false);
  const floatingControlsRef = useRef<HTMLDivElement>(null);
  const speakBtnRef = useRef<HTMLButtonElement>(null);

  // Check if TTS is supported
  const isTTSSupported = useCallback(() => {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }, []);

  // Check if pause/resume is supported
  const isPauseResumeSupported = useCallback(() => {
    return (
      "speechSynthesis" in window &&
      "pause" in speechSynthesis &&
      "resume" in speechSynthesis
    );
  }, []);

  // Load settings from storage
  const loadSettings = useCallback(async () => {
    try {
      // Load TTS settings
      const { ttsSettings: settings } = await chrome.storage.sync.get([
        "ttsSettings",
      ]);
      if (settings) {
        setTtsSettings(settings);
        console.log("[Popup] TTS settings loaded:", settings);
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
          setSummaryType(generalSettings.defaultSummaryType);
          console.log(
            "[Popup] Default summary type applied:",
            generalSettings.defaultSummaryType
          );
        }

        // Apply theme
        if (generalSettings.theme) {
          applyTheme(generalSettings.theme);
          console.log("[Popup] Theme applied:", generalSettings.theme);
        } else {
          // Apply default theme if none is set
          applyTheme("auto");
          console.log("[Popup] Default theme applied: auto");
        }
      } else {
        console.log("[Popup] No general settings found, using defaults");
      }
    } catch (error) {
      console.error("[Popup] Error loading settings:", error);
    }
  }, []);

  // Theme Management
  const applyTheme = useCallback((theme: string) => {
    const root = document.documentElement;
    root.removeAttribute("data-theme");

    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      // Light theme is default, no attribute needed
      root.removeAttribute("data-theme");
    } else if (theme === "auto") {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        root.setAttribute("data-theme", "dark");
      }
      // Light theme is default for auto mode when system is light
    }
  }, []);

  // Wait for voices to be available
  const waitForVoices = useCallback(() => {
    return new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        speechSynthesis.onvoiceschanged = () => {
          resolve(speechSynthesis.getVoices());
        };
      }
    });
  }, []);

  // Get the correct voice based on settings
  const getVoiceFromSettings = useCallback(
    (voices: SpeechSynthesisVoice[]) => {
      if (ttsSettings.voice === "Google US English") {
        return (
          voices.find((v) => v.name.includes("Google US English")) || voices[0]
        );
      } else {
        return voices.find((v) => v.name === ttsSettings.voice) || voices[0];
      }
    },
    [ttsSettings.voice]
  );

  // Show error message
  const showError = useCallback((message: string) => {
    console.error("[Popup] Error:", message);
  }, []);

  // Summarize functionality
  const handleSummarize = useCallback(async () => {
    try {
      console.log("[Popup] Summarize button clicked");
      setIsLoading(true);
      // Don't set result text - let the spinner show instead

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        console.error("[Popup] No active tab found");
        showError(ERROR_MESSAGES.TAB_NOT_FOUND);
        setIsLoading(false);
        return;
      }

      console.log("[Popup] Active tab found:", tab.id);

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content/content.js"],
        });
        console.log("[Popup] Content script injected successfully");
      } catch (injectionError) {
        console.error(
          "[Popup] Content script injection failed:",
          injectionError
        );
        // Continue anyway, the script might already be injected
      }

      const response = await new Promise<any>((resolve, reject) => {
        chrome.tabs.sendMessage(
          tab.id!,
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
        setIsLoading(false);
        return;
      }

      console.log("[Popup] Text extracted, length:", response.text.length);
      const { text } = response;

      // (Removed: API key check in popup. Let background handle it.)
      console.log("[Popup] Sending summarization request...");

      // Use a simpler approach with timeout that can be cleared
      const summary = await new Promise<string>((resolve, reject) => {
        console.log("[Popup] Setting up message listener...");

        let isResolved = false; // Flag to prevent multiple resolutions

        // Set up timeout
        const timeoutId = setTimeout(() => {
          console.log("[Popup] Timeout triggered, isResolved:", isResolved);
          if (!isResolved) {
            console.log("[Popup] Setting isResolved to true and rejecting");
            isResolved = true;
            reject(new Error("Request timed out. Please try again."));
          } else {
            console.log("[Popup] Already resolved, ignoring timeout");
          }
        }, 25000);

        chrome.runtime.sendMessage(
          {
            action: "summarize_text",
            text,
            summaryType,
            showTooltip: false,
          },
          (response) => {
            console.log(
              "[Popup] Message callback triggered, response:",
              response
            );

            // Clear the timeout since we got a response
            clearTimeout(timeoutId);

            // Check if popup is still open
            if (!document.body) {
              console.log("[Popup] Popup window closed, ignoring response");
              return;
            }

            // Prevent multiple resolutions
            if (isResolved) {
              console.log("[Popup] Already resolved, ignoring response");
              return;
            }

            if (chrome.runtime.lastError) {
              console.error("[Popup] Runtime error:", chrome.runtime.lastError);
              if (!isResolved) {
                isResolved = true;
                reject(new Error(chrome.runtime.lastError.message));
              }
              return;
            }

            console.log("[Popup] Summary response received:", response);
            if (response && typeof response === "string") {
              console.log(
                "[Popup] Resolving with summary, length:",
                response.length
              );
              if (!isResolved) {
                console.log("[Popup] Setting isResolved to true and resolving");
                isResolved = true;
                // Add a small delay to ensure resolution happens before timeout
                setTimeout(() => {
                  console.log("[Popup] Actually resolving the promise");
                  resolve(response);
                }, 10);
              } else {
                console.log("[Popup] Already resolved, ignoring response");
              }
            } else {
              console.error("[Popup] Invalid response type:", typeof response);
              if (!isResolved) {
                console.log(
                  "[Popup] Setting isResolved to true and rejecting due to invalid response"
                );
                isResolved = true;
                reject(new Error("Invalid response from background script"));
              } else {
                console.log(
                  "[Popup] Already resolved, ignoring invalid response"
                );
              }
            }
          }
        );
      });

      console.log(
        "[Popup] Summary received successfully, length:",
        summary.length
      );
      setResult(summary);
      setIsLoading(false);
    } catch (err: any) {
      console.error("[Popup] Detailed error:", err);
      showError(`⚠️ ${err.message || ERROR_MESSAGES.UNKNOWN_ERROR}`);
      setIsLoading(false);
    }
  }, [summaryType, showError]);

  // Copy functionality
  const handleCopy = useCallback(async () => {
    try {
      const text = result;
      if (!text || text === "Select a Type and click Summarize") {
        return;
      }

      // Update button to show copy icon and text
      const copyBtn = document.getElementById("copy-btn");
      if (copyBtn) {
        copyBtn.innerHTML = "<span>📋</span> Copy";
      }

      await navigator.clipboard.writeText(text);

      // Success state - lighter green background with checkmark
      if (copyBtn) {
        copyBtn.innerHTML = "<span>✓</span> Copied!";
        copyBtn.style.background = "#10b981";
        copyBtn.style.borderColor = "#10b981";
        copyBtn.style.transform = "translateY(-1px)";
        copyBtn.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.3)";

        setTimeout(() => {
          // Reset to original state
          copyBtn.innerHTML = "<span>📋</span> Copy";
          copyBtn.style.background = "#059669";
          copyBtn.style.borderColor = "#059669";
          copyBtn.style.transform = "";
          copyBtn.style.boxShadow = "";
        }, 1500);
      }
    } catch (error) {
      console.error("[Popup] Copy failed:", error);

      // Error state - red background
      const copyBtn = document.getElementById("copy-btn");
      if (copyBtn) {
        copyBtn.innerHTML = "<span>❌</span> Failed";
        copyBtn.style.background = "#dc2626";
        copyBtn.style.transform = "translateY(-1px)";
        copyBtn.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.2)";

        setTimeout(() => {
          // Reset to original state
          copyBtn.innerHTML = "<span>📋</span> Copy";
          copyBtn.style.background = "#059669";
          copyBtn.style.borderColor = "#059669";
          copyBtn.style.transform = "";
          copyBtn.style.boxShadow = "";
        }, 1500);
      }
    }
  }, [result]);

  // TTS functionality
  const startTTS = useCallback(
    async (text: string) => {
      try {
        if (!text || isSpeaking) return;

        if (!isTTSSupported()) {
          showError(ERROR_MESSAGES.TTS_NOT_SUPPORTED);
          return;
        }

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        const voices = await waitForVoices();
        console.log(
          "[Popup] Available voices:",
          voices.map((v) => v.name)
        );
        console.log("[Popup] Using TTS settings:", ttsSettings);

        const selectedVoice = getVoiceFromSettings(voices);
        utterance.voice = selectedVoice;
        console.log("[Popup] Selected voice:", selectedVoice?.name);

        utterance.rate = ttsSettings.speed;
        utterance.pitch = 1.1;

        utterance.onend = () => {
          if (!isStoppingTTSRef.current) {
            setIsSpeaking(false);
            setIsPaused(false);
            setShowFloatingControls(false);
          }
        };

        utterance.onpause = () => {
          if (!isStoppingTTSRef.current) {
            setIsPaused(true);
          }
        };

        utterance.onresume = () => {
          if (!isStoppingTTSRef.current) {
            setIsPaused(false);
          }
        };

        utterance.onerror = (event) => {
          if (!isStoppingTTSRef.current) {
            console.error("[Popup] TTS Error:", event);
            setIsSpeaking(false);
            setIsPaused(false);
            setShowFloatingControls(false);
            showError(ERROR_MESSAGES.TTS_FAILED);
          }
        };

        speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
        isStoppingTTSRef.current = false;
        setShowFloatingControls(true);
      } catch (error) {
        console.error("[Popup] TTS start error:", error);
        setIsSpeaking(false);
        setIsPaused(false);
        isStoppingTTSRef.current = false;
        setShowFloatingControls(false);
        showError(ERROR_MESSAGES.TTS_FAILED);
      }
    },
    [
      isSpeaking,
      isTTSSupported,
      waitForVoices,
      ttsSettings,
      getVoiceFromSettings,
      showError,
    ]
  );

  const pauseResumeTTS = useCallback(() => {
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
  }, [isSpeaking, isPaused, isPauseResumeSupported, showError]);

  const stopTTS = useCallback(() => {
    try {
      if (!isSpeaking) return;

      isStoppingTTSRef.current = true;
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setShowFloatingControls(false);
      utteranceRef.current = null;

      setTimeout(() => {
        isStoppingTTSRef.current = false;
      }, 100);
    } catch (error) {
      console.error("[Popup] TTS stop error:", error);
      setIsSpeaking(false);
      setIsPaused(false);
      isStoppingTTSRef.current = false;
      setShowFloatingControls(false);
      utteranceRef.current = null;
    }
  }, [isSpeaking]);

  const handleSpeak = useCallback(
    async (e: React.MouseEvent) => {
      try {
        e.stopPropagation();

        if (isSpeaking) return;

        await loadSettings();

        const text = result.trim();
        if (!text || text === "Select a Type and click Summarize") return;

        startTTS(text);
      } catch (error) {
        console.error("[Popup] Speak button click error:", error);
      }
    },
    [isSpeaking, result, loadSettings, startTTS]
  );

  const handlePause = useCallback(
    (e: React.MouseEvent) => {
      try {
        e.stopPropagation();
        if (!isPauseResumeSupported()) return;
        pauseResumeTTS();
      } catch (error) {
        console.error("[Popup] Pause button click error:", error);
      }
    },
    [isPauseResumeSupported, pauseResumeTTS]
  );

  const handleStop = useCallback(
    (e: React.MouseEvent) => {
      try {
        e.stopPropagation();
        stopTTS();
      } catch (error) {
        console.error("[Popup] Stop button click error:", error);
      }
    },
    [stopTTS]
  );

  // Settings button
  const handleSettings = useCallback(() => {
    try {
      console.log("[Popup] Settings button clicked, opening options page");
      chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error("[Popup] Error opening options page:", error);
    }
  }, []);

  // Outside click detection
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      try {
        const target = e.target as Node;
        const isClickInsideControls =
          floatingControlsRef.current?.contains(target);
        const isClickOnSpeakBtn = speakBtnRef.current?.contains(target);

        if (isSpeaking && !isClickInsideControls && !isClickOnSpeakBtn) {
          setShowFloatingControls(false);
        }
      } catch (error) {
        console.error("[Popup] Outside click detection error:", error);
      }
    },
    [isSpeaking]
  );

  // Initialize
  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await waitForVoices();
      console.log("[Popup] Voices preloaded successfully");
    };

    init();
  }, [loadSettings, waitForVoices]);

  // Event listeners
  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [handleOutsideClick]);

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="header-content">
          <div className="header-text">
            <h1>SmartDigest</h1>
            <p className="subtitle">
              Get instant summaries of your selected text
            </p>
          </div>
          <button
            className="settings-btn"
            onClick={handleSettings}
            title="Settings"
          >
            <span className="settings-icon">⚙️</span>
          </button>
        </div>
      </div>

      <div className="input-container">
        <div className="select-wrapper">
          <select
            id="summary-type"
            value={summaryType}
            onChange={(e) => setSummaryType(e.target.value)}
          >
            <option value="brief">Brief Summary</option>
            <option value="detailed">Detailed Analysis</option>
            <option value="bullets">Bullet Points</option>
          </select>
        </div>
        <div className="button-group">
          <button
            className="btn primary"
            onClick={handleSummarize}
            disabled={isLoading}
          >
            <span className="btn-icon">✨</span>
            <span>{isLoading ? "Summarizing..." : "Summarize"}</span>
          </button>
          <button className="btn secondary" id="copy-btn" onClick={handleCopy}>
            <span>📋</span> Copy
          </button>
          <div className="speak-button-container">
            <button
              className="btn icon-btn"
              id="speak-btn"
              ref={speakBtnRef}
              onClick={handleSpeak}
              disabled={isSpeaking}
              title="Text to Speech"
            >
              <img className="mic" src="/microphone.png" alt="microphone" />
            </button>
            <div
              className={`floating-controls ${
                showFloatingControls ? "visible" : ""
              }`}
              id="floating-controls"
              ref={floatingControlsRef}
            >
              <button
                className="floating-btn pause-btn"
                id="pause-btn"
                onClick={handlePause}
                disabled={!isPauseResumeSupported()}
                title={
                  isPauseResumeSupported()
                    ? "Pause/Resume"
                    : ERROR_MESSAGES.PAUSE_NOT_SUPPORTED
                }
              >
                <span className="floating-icon">{isPaused ? "▶️" : "⏸"}</span>
              </button>
              <button
                className="floating-btn stop-btn"
                id="stop-btn"
                onClick={handleStop}
                title="Stop"
              >
                <span className="floating-icon">⏹</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="result-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <pre id="result">{result}</pre>
        )}
      </div>
    </div>
  );
};

export default Popup;
