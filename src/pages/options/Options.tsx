import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  loadTTSSettings,
  saveTTSSettings,
  loadGeneralSettings,
  saveGeneralSettings,
  applyTheme,
  waitForVoices,
  getVoiceFromSettings,
  isTTSSupported,
} from "../../utils/tts";
import {
  storeApiKeySecurely,
  retrieveApiKeySecurely,
} from "../../utils/security";

// Types
interface TTSSettings {
  voice: string;
  speed: number;
}

interface GeneralSettings {
  enableTooltip: boolean;
  defaultSummaryType: string;
  theme: string;
}

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const Options: React.FC = () => {
  // Navigation state
  const [activeSection, setActiveSection] = useState<
    "general" | "api" | "tts" | "help" | "support"
  >("general");

  // Settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    enableTooltip: true,
    defaultSummaryType: "brief",
    theme: "auto",
  });

  const [ttsSettings, setTtsSettings] = useState<TTSSettings>({
    voice: "Google US English",
    speed: 1.0,
  });

  const [apiKey, setApiKey] = useState<string>("");

  // UI state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTestPlaying, setIsTestPlaying] = useState<boolean>(false);
  const [successMessages, setSuccessMessages] = useState<{
    [key: string]: boolean;
  }>({});
  const [errorMessages, setErrorMessages] = useState<{
    [key: string]: string;
  }>({});
  const [expandedAccordions, setExpandedAccordions] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedFaqs, setExpandedFaqs] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Feedback form state
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [feedbackEmail, setFeedbackEmail] = useState<string>("");
  const [feedbackStatus, setFeedbackStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({
    type: "idle",
    message: "",
  });

  // Refs
  const testUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const testTextRef = useRef<HTMLInputElement>(null);

  // FAQ data
  const faqItems: FAQItem[] = [
    {
      question: "Nothing happens when I click summarize",
      answer: (
        <div>
          <p>
            This usually means your Gemini API key isn't configured. Here's how
            to fix it:
          </p>
          <ol>
            <li>
              Go to the <strong>API Key</strong> tab in settings
            </li>
            <li>
              Get your API key from{" "}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google AI Studio
              </a>
            </li>
            <li>Paste the key and click "Save API Settings"</li>
            <li>Try summarizing again</li>
          </ol>
        </div>
      ),
    },
    {
      question: "My summary is empty or shows an error",
      answer: (
        <div>
          <p>This could be due to several reasons:</p>
          <ul>
            <li>
              <strong>API Limit:</strong> You may have reached your Gemini API
              quota
            </li>
            <li>
              <strong>Invalid Key:</strong> Your API key might be incorrect or
              expired
            </li>
            <li>
              <strong>Network Issue:</strong> Check your internet connection
            </li>
            <li>
              <strong>Content Too Short:</strong> Select at least 10 characters
              of text
            </li>
          </ul>
          <p>Try refreshing the page and checking your API key in settings.</p>
        </div>
      ),
    },
    {
      question: "Text-to-speech doesn't work",
      answer: (
        <div>
          <p>Text-to-speech requires browser support. Here's what to check:</p>
          <ul>
            <li>
              <strong>Browser Support:</strong> Works best in Chrome, Edge, and
              Firefox
            </li>
            <li>
              <strong>System Voices:</strong> Your system needs available voices
            </li>
            <li>
              <strong>Permissions:</strong> Allow audio playback if prompted
            </li>
            <li>
              <strong>Settings:</strong> Check TTS settings in the options page
            </li>
          </ul>
          <p>Try testing different voices in the TTS Settings tab.</p>
        </div>
      ),
    },
    {
      question: "Settings are not saving",
      answer: (
        <div>
          <p>If your settings aren't persisting, try these steps:</p>
          <ol>
            <li>Check if you're signed into Chrome with sync enabled</li>
            <li>Try refreshing the options page</li>
            <li>Check browser storage permissions</li>
            <li>Disable and re-enable the extension</li>
          </ol>
          <p>
            Settings should sync across your devices when signed into Chrome.
          </p>
        </div>
      ),
    },
    {
      question: "Dark mode is not working properly",
      answer: (
        <div>
          <p>Dark mode issues can be resolved by:</p>
          <ul>
            <li>
              <strong>Theme Setting:</strong> Check your theme preference in
              General Settings
            </li>
            <li>
              <strong>System Preference:</strong> Auto mode follows your OS dark
              mode setting
            </li>
            <li>
              <strong>Browser Cache:</strong> Try refreshing the page or
              clearing cache
            </li>
            <li>
              <strong>Extension Restart:</strong> Disable and re-enable the
              extension
            </li>
          </ul>
          <p>Dark mode applies to both the popup and options page.</p>
        </div>
      ),
    },
  ];

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load API key
        const storedApiKey = await retrieveApiKeySecurely();
        if (storedApiKey) {
          setApiKey(storedApiKey);
        }

        // Load TTS settings
        const storedTtsSettings = await loadTTSSettings();
        setTtsSettings(storedTtsSettings);

        // Load General settings
        const storedGeneralSettings = await loadGeneralSettings();
        setGeneralSettings(storedGeneralSettings);

        // Apply theme
        applyTheme(storedGeneralSettings.theme);

        // Load voices
        const availableVoices = await waitForVoices();
        setVoices(availableVoices);
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  // Navigation functions
  const showSection = useCallback((section: typeof activeSection) => {
    setActiveSection(section);
    // Clear any error messages when switching sections
    setErrorMessages({});
  }, []);

  // Settings save functions
  const saveGeneralSettingsHandler = useCallback(async () => {
    try {
      await saveGeneralSettings(generalSettings);
      applyTheme(generalSettings.theme);
      setSuccessMessages((prev) => ({ ...prev, general: true }));
      setErrorMessages((prev) => ({ ...prev, general: "" }));
      setTimeout(
        () => setSuccessMessages((prev) => ({ ...prev, general: false })),
        3000
      );
    } catch (error) {
      console.error("Error saving general settings:", error);
      setErrorMessages((prev) => ({
        ...prev,
        general: "Error saving general settings. Please try again.",
      }));
    }
  }, [generalSettings]);

  const saveApiSettingsHandler = useCallback(async () => {
    try {
      if (!apiKey.trim()) {
        setErrorMessages((prev) => ({
          ...prev,
          api: "Please enter your Gemini API key",
        }));
        return;
      }
      await storeApiKeySecurely(apiKey);
      setSuccessMessages((prev) => ({ ...prev, api: true }));
      setErrorMessages((prev) => ({ ...prev, api: "" }));
      setTimeout(
        () => setSuccessMessages((prev) => ({ ...prev, api: false })),
        3000
      );
    } catch (error) {
      console.error("Error saving API settings:", error);
      setErrorMessages((prev) => ({
        ...prev,
        api: "Error saving API settings. Please try again.",
      }));
    }
  }, [apiKey]);

  const saveTtsSettingsHandler = useCallback(async () => {
    try {
      await saveTTSSettings(ttsSettings);
      setSuccessMessages((prev) => ({ ...prev, tts: true }));
      setErrorMessages((prev) => ({ ...prev, tts: "" }));
      setTimeout(
        () => setSuccessMessages((prev) => ({ ...prev, tts: false })),
        3000
      );
    } catch (error) {
      console.error("Error saving TTS settings:", error);
      setErrorMessages((prev) => ({
        ...prev,
        tts: "Error saving TTS settings. Please try again.",
      }));
    }
  }, [ttsSettings]);

  // TTS test functions
  const testVoice = useCallback(() => {
    if (isTestPlaying) {
      speechSynthesis.cancel();
      setIsTestPlaying(false);
      testUtteranceRef.current = null;
      return;
    }

    const text = testTextRef.current?.value.trim();
    if (!text) {
      setErrorMessages((prev) => ({
        ...prev,
        tts: "Please enter text to test",
      }));
      return;
    }

    if (!isTTSSupported()) {
      setErrorMessages((prev) => ({
        ...prev,
        tts: "Text-to-speech is not supported in this browser",
      }));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = getVoiceFromSettings(voices, ttsSettings);
    utterance.voice = selectedVoice;
    utterance.rate = ttsSettings.speed;

    utterance.onend = () => {
      setIsTestPlaying(false);
      testUtteranceRef.current = null;
    };

    utterance.onerror = () => {
      setIsTestPlaying(false);
      testUtteranceRef.current = null;
      setErrorMessages((prev) => ({
        ...prev,
        tts: "Error playing test voice. Please try again.",
      }));
    };

    testUtteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsTestPlaying(true);
  }, [isTestPlaying, ttsSettings, voices]);

  // Accordion functions
  const toggleAccordion = useCallback((key: string) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const toggleFaq = useCallback((index: number) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  // Feedback form functions
  const handleFeedbackSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (feedbackMessage.length < 20) {
        setFeedbackStatus({
          type: "error",
          message: "Please provide at least 20 characters of feedback.",
        });
        return;
      }

      if (feedbackMessage.length > 500) {
        setFeedbackStatus({
          type: "error",
          message: "Feedback is too long. Please keep it under 500 characters.",
        });
        return;
      }

      if (feedbackEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(feedbackEmail)) {
        setFeedbackStatus({
          type: "error",
          message: "Please enter a valid email address.",
        });
        return;
      }

      const metadata = {
        extensionVersion: chrome.runtime.getManifest().version,
        browser: navigator.userAgent,
        os: navigator.platform,
        timestamp: new Date().toISOString(),
      };

      setFeedbackStatus({ type: "loading", message: "Sending feedback..." });

      try {
        const formData = new FormData();
        formData.append("message", feedbackMessage);
        if (feedbackEmail) formData.append("email", feedbackEmail);
        formData.append("metadata", JSON.stringify(metadata));

        const response = await fetch("https://formspree.io/f/mldldprn", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          setFeedbackStatus({
            type: "success",
            message: "Thank you for your feedback! We'll review it shortly.",
          });
          setFeedbackMessage("");
          setFeedbackEmail("");
        } else {
          throw new Error("Submission failed");
        }
      } catch (error) {
        console.error("Feedback submission error:", error);
        setFeedbackStatus({
          type: "error",
          message:
            "Failed to send feedback. Please try again or contact us directly.",
        });
      }
    },
    [feedbackMessage, feedbackEmail]
  );

  const getCharCountColor = () => {
    if (feedbackMessage.length > 450) return "text-red-600";
    if (feedbackMessage.length > 400) return "text-yellow-600";
    return "text-gray-500";
  };

  // Helper function to show notifications
  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    const notification = document.createElement("div");
    notification.className = "copy-notification";
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#10b981" : "#ef4444"};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
  };

  // Fallback copy function for older browsers
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        showNotification("Email copied to clipboard!", "success");
      } else {
        showNotification(
          "Failed to copy email. Please copy manually: " + text,
          "error"
        );
      }
    } catch {
      showNotification(
        "Failed to copy email. Please copy manually: " + text,
        "error"
      );
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="app-container">
      {/* Header Section */}
      <header className="app-header">
        <div className="brand-container">
          <div className="logo-wrapper">
            <span className="material-icons logo-icon">auto_awesome</span>
            <h1 className="brand-name">SmartDigest</h1>
          </div>
          <p className="tagline">Condense your content in seconds</p>
          <span className="version">v1.0</span>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          {[
            { id: "general", label: "General", icon: "settings" },
            { id: "api", label: "API Key", icon: "key" },
            { id: "tts", label: "TTS Settings", icon: "settings_voice" },
            { id: "help", label: "Help", icon: "help_outline" },
            { id: "support", label: "Support", icon: "support_agent" },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => showSection(id as typeof activeSection)}
              className={`nav-link ${activeSection === id ? "active" : ""}`}
              aria-label={`${label} Settings`}
            >
              <span className="material-icons">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* General Settings Section */}
        {activeSection === "general" && (
          <div className="form-card">
            <div className="card-header">
              <h2>General Settings</h2>
              <p className="card-subtitle">
                Configure general behavior and appearance preferences
              </p>
            </div>

            <div className="form-content">
              <div className="input-group">
                <label className="input-label">
                  <span className="material-icons">text_fields</span>
                  Text Selection Tooltip
                </label>
                <div className="toggle-wrapper">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={generalSettings.enableTooltip}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          enableTooltip: e.target.checked,
                        }))
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">
                    Enable "Summarize" tooltip when text is selected
                  </span>
                </div>
                <p className="help-text">
                  Show the floating summarize button when you select text on web
                  pages
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span className="material-icons">format_list_bulleted</span>
                  Default Summary Style
                </label>
                <div className="input-wrapper">
                  <select
                    value={generalSettings.defaultSummaryType}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        defaultSummaryType: e.target.value,
                      }))
                    }
                    aria-label="Default Summary Type"
                  >
                    <option value="brief">Brief Summary</option>
                    <option value="detailed">Detailed Analysis</option>
                    <option value="bullets">Bullet Points</option>
                  </select>
                  <span className="material-icons input-icon">expand_more</span>
                </div>
                <p className="help-text">
                  Set your preferred summary style as the default option
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span className="material-icons">palette</span>
                  Theme / Appearance
                </label>
                <div className="theme-options">
                  {[
                    { value: "light", label: "Light Mode", icon: "🌞" },
                    { value: "dark", label: "Dark Mode", icon: "🌙" },
                    { value: "auto", label: "Auto (System)", icon: "🔄" },
                  ].map(({ value, label, icon }) => (
                    <label key={value} className="theme-option">
                      <input
                        type="radio"
                        name="theme"
                        value={value}
                        checked={generalSettings.theme === value}
                        onChange={(e) => {
                          const newTheme = e.target.value;
                          setGeneralSettings((prev) => ({
                            ...prev,
                            theme: newTheme,
                          }));
                          // Apply theme immediately
                          applyTheme(newTheme);
                        }}
                      />
                      <span className="theme-icon">{icon}</span>
                      <span className="theme-label">{label}</span>
                    </label>
                  ))}
                </div>
                <p className="help-text">
                  Choose your preferred theme for the extension interface
                </p>
              </div>

              <button
                onClick={saveGeneralSettingsHandler}
                className="btn primary"
                aria-label="Save General Settings"
              >
                <span className="material-icons">save</span>
                <span>Save General Settings</span>
              </button>

              {successMessages.general && (
                <div
                  className="success-message"
                  role="alert"
                  aria-live="polite"
                >
                  <span className="material-icons">check_circle</span>
                  <span>General settings saved successfully!</span>
                </div>
              )}

              {errorMessages.general && (
                <div className="error-message" role="alert" aria-live="polite">
                  <span className="material-icons">error</span>
                  <span>{errorMessages.general}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Configuration Section */}
        {activeSection === "api" && (
          <div className="form-card">
            <div className="card-header">
              <h2>API Configuration</h2>
              <p className="card-subtitle">
                Set up your Gemini API key to enable SmartDigest
              </p>
            </div>

            <div className="form-content">
              <div className="input-group">
                <label className="input-label">
                  <span className="material-icons">key</span>
                  Gemini API Key
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    aria-label="Gemini API Key"
                    aria-required="true"
                  />
                  <span className="material-icons input-icon">vpn_key</span>
                </div>
                <p className="help-text">
                  Get your API Key from{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google AI Studio
                    <span className="material-icons link-icon">
                      open_in_new
                    </span>
                  </a>
                </p>
              </div>

              <button
                onClick={saveApiSettingsHandler}
                className="btn primary"
                aria-label="Save API Settings"
              >
                <span className="material-icons">save</span>
                <span>Save API Settings</span>
              </button>

              {successMessages.api && (
                <div
                  className="success-message"
                  role="alert"
                  aria-live="polite"
                >
                  <span className="material-icons">check_circle</span>
                  <span>API settings saved successfully!</span>
                </div>
              )}

              {errorMessages.api && (
                <div className="error-message" role="alert" aria-live="polite">
                  <span className="material-icons">error</span>
                  <span>{errorMessages.api}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TTS Settings Section */}
        {activeSection === "tts" && (
          <div className="form-card">
            <div className="card-header">
              <h2>Text-to-Speech Settings</h2>
              <p className="card-subtitle">
                Configure voice settings for better TTS experience
              </p>
            </div>

            <div className="form-content">
              <div className="input-group">
                <label className="input-label">
                  <span className="material-icons">record_voice_over</span>
                  Voice Selection
                </label>
                <div className="input-wrapper">
                  <select
                    value={ttsSettings.voice}
                    onChange={(e) =>
                      setTtsSettings((prev) => ({
                        ...prev,
                        voice: e.target.value,
                      }))
                    }
                    aria-label="Select Voice"
                  >
                    {voices.length === 0 ? (
                      <option value="">Loading voices...</option>
                    ) : (
                      voices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))
                    )}
                  </select>
                  <span className="material-icons input-icon">expand_more</span>
                </div>
                <p className="help-text">
                  Choose your preferred voice for text-to-speech
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span className="material-icons">speed</span>
                  Speech Speed
                  <span id="speed-value">{ttsSettings.speed}x</span>
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ttsSettings.speed}
                    onChange={(e) =>
                      setTtsSettings((prev) => ({
                        ...prev,
                        speed: parseFloat(e.target.value),
                      }))
                    }
                    aria-label="Speech Speed"
                  />
                  <div className="slider-labels">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>
                <p className="help-text">
                  Adjust the speed of text-to-speech playback
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span className="material-icons">play_circle</span>
                  Test Voice
                </label>
                <div className="test-voice-container">
                  <input
                    type="text"
                    ref={testTextRef}
                    placeholder="Enter text to test voice settings"
                    defaultValue="Hello! This is a test of the text-to-speech settings."
                  />
                  <button
                    onClick={testVoice}
                    className="btn secondary"
                    disabled={isTestPlaying}
                  >
                    <span className="material-icons">
                      {isTestPlaying ? "stop" : "play_arrow"}
                    </span>
                    {isTestPlaying ? "Stop Test" : "Test Voice"}
                  </button>
                </div>
                <p className="help-text">
                  Test your voice settings with custom text
                </p>
              </div>

              <button
                onClick={saveTtsSettingsHandler}
                className="btn primary"
                aria-label="Save TTS Settings"
              >
                <span className="material-icons">save</span>
                <span>Save TTS Settings</span>
              </button>

              {successMessages.tts && (
                <div
                  className="success-message"
                  role="alert"
                  aria-live="polite"
                >
                  <span className="material-icons">check_circle</span>
                  <span>TTS settings saved successfully!</span>
                </div>
              )}

              {errorMessages.tts && (
                <div className="error-message" role="alert" aria-live="polite">
                  <span className="material-icons">error</span>
                  <span>{errorMessages.tts}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        {activeSection === "help" && (
          <div className="form-card">
            <div className="card-header">
              <h2>Help & Documentation</h2>
              <p className="card-subtitle">
                Learn how to use SmartDigest effectively
              </p>
            </div>

            <div className="form-content">
              <div className="help-content">
                <div className="help-section">
                  <h3 className="help-title">
                    <span className="help-icon">🚀</span>
                    Getting Started
                  </h3>
                  <ol className="help-list">
                    <li>
                      <strong>Click the extension icon</strong> from your
                      browser toolbar.
                    </li>
                    <li>
                      <strong>Choose your summary type</strong>: Brief,
                      Detailed, or Bullet Points.
                    </li>
                    <li>
                      Click <strong>"Summarize"</strong> to generate a summary
                      of the current webpage.
                    </li>
                  </ol>
                </div>

                <div className="help-divider"></div>

                <div className="help-section">
                  <h3 className="help-title">
                    <span className="help-icon">🖱️</span>
                    On-Page Summarizer
                  </h3>
                  <ul className="help-list">
                    <li>Select any text on a webpage.</li>
                    <li>A "Summarize" button will appear.</li>
                    <li>Click it to get a summary tooltip.</li>
                  </ul>
                </div>

                <div className="help-divider"></div>

                <div className="help-section">
                  <h3 className="help-title">
                    <span className="help-icon">🔊</span>
                    Text-to-Speech (TTS)
                  </h3>
                  <ul className="help-list">
                    <li>Click the 🎤 mic icon to read the summary aloud.</li>
                    <li>Click ⏸ to pause, ▶️ to resume, or ⏹ to restart.</li>
                    <li>
                      Adjust voice, speed, and pitch in the
                      <strong>Settings</strong> tab.
                    </li>
                  </ul>
                </div>

                <div className="help-divider"></div>

                <div className="help-section">
                  <h3 className="help-title">
                    <span className="help-icon">✨</span>
                    Tips
                  </h3>
                  <ul className="help-list">
                    <li>
                      You can copy any summary using the
                      <strong>Copy</strong> button.
                    </li>
                    <li>
                      Use the Settings page to control tooltip display, voices,
                      and themes.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Section */}
        {activeSection === "support" && (
          <div className="form-card">
            <div className="card-header">
              <h2>Support & Feedback</h2>
              <p className="card-subtitle">
                Get help and share your feedback with us
              </p>
            </div>

            <div className="form-content">
              {/* FAQ Section */}
              <div className="support-accordion">
                <button
                  className="accordion-header"
                  aria-expanded={expandedAccordions.faq}
                  onClick={() => toggleAccordion("faq")}
                >
                  <span className="accordion-icon">❓</span>
                  <span className="accordion-title">FAQ</span>
                  <span className="accordion-toggle">▼</span>
                </button>
                <div
                  className={`accordion-content ${
                    expandedAccordions.faq ? "expanded" : ""
                  }`}
                >
                  <div className="faq-container">
                    {faqItems.map((item, index) => (
                      <div key={index} className="faq-item">
                        <button
                          className="faq-question"
                          aria-expanded={expandedFaqs[index]}
                          onClick={() => toggleFaq(index)}
                        >
                          <span>{item.question}</span>
                          <span className="faq-icon">+</span>
                        </button>
                        <div
                          className={`faq-answer ${
                            expandedFaqs[index] ? "active" : ""
                          }`}
                        >
                          {item.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Support Channels */}
              <div className="support-accordion">
                <button
                  className="accordion-header"
                  aria-expanded={expandedAccordions.help}
                  onClick={() => toggleAccordion("help")}
                >
                  <span className="accordion-icon">📞</span>
                  <span className="accordion-title">Get Help</span>
                  <span className="accordion-toggle">▼</span>
                </button>
                <div
                  className={`accordion-content ${
                    expandedAccordions.help ? "expanded" : ""
                  }`}
                >
                  <div className="support-channels">
                    <a
                      href="https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="support-link"
                    >
                      <span className="support-link-icon">🐛</span>
                      <div className="support-link-content">
                        <span className="support-link-title">Report a Bug</span>
                        <span className="support-link-desc">
                          Create an issue on GitHub
                        </span>
                      </div>
                      <span className="material-icons">open_in_new</span>
                    </a>
                    <div className="support-link">
                      <span className="support-link-icon">📧</span>
                      <div className="support-link-content">
                        <span className="support-link-title">
                          Email Support
                        </span>
                        <span className="support-link-desc">
                          contactsmartdigest@gmail.com
                        </span>
                      </div>
                      <div className="support-link-actions">
                        <button
                          onClick={() => {
                            const email = "contactsmartdigest@gmail.com";

                            // Try modern clipboard API first
                            if (
                              navigator.clipboard &&
                              navigator.clipboard.writeText
                            ) {
                              navigator.clipboard
                                .writeText(email)
                                .then(() => {
                                  showNotification(
                                    "Email copied to clipboard!",
                                    "success"
                                  );
                                })
                                .catch(() => {
                                  // Fallback to old method
                                  fallbackCopyTextToClipboard(email);
                                });
                            } else {
                              // Fallback for older browsers
                              fallbackCopyTextToClipboard(email);
                            }
                          }}
                          className="copy-btn"
                          title="Copy email to clipboard"
                        >
                          <span className="material-icons">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy & Trust */}
              <div className="support-accordion">
                <button
                  className="accordion-header"
                  aria-expanded={expandedAccordions.privacy}
                  onClick={() => toggleAccordion("privacy")}
                >
                  <span className="accordion-icon">🔒</span>
                  <span className="accordion-title">Privacy & Trust</span>
                  <span className="accordion-toggle">▼</span>
                </button>
                <div
                  className={`accordion-content ${
                    expandedAccordions.privacy ? "expanded" : ""
                  }`}
                >
                  <div className="privacy-info">
                    <div className="privacy-item">
                      <span className="material-icons">security</span>
                      <span>We don't store or track your data</span>
                    </div>
                    <div className="privacy-item">
                      <span className="material-icons">computer</span>
                      <span>
                        Everything runs locally except summaries sent securely
                        to Gemini API
                      </span>
                    </div>
                    <div className="privacy-item">
                      <span className="material-icons">description</span>
                      <a
                        href="https://github.com/Divyanshkumar62/AI_Summarizer_Chrome_Extension/blob/main/PRIVACY.md"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Read our Privacy Policy
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Form */}
              <div className="support-accordion">
                <button
                  className="accordion-header"
                  aria-expanded={expandedAccordions.feedback}
                  onClick={() => toggleAccordion("feedback")}
                >
                  <span className="accordion-icon">💬</span>
                  <span className="accordion-title">Send Feedback</span>
                  <span className="accordion-toggle">▼</span>
                </button>
                <div
                  className={`accordion-content ${
                    expandedAccordions.feedback ? "expanded" : ""
                  }`}
                >
                  <form
                    onSubmit={handleFeedbackSubmit}
                    className="feedback-form"
                  >
                    <div className="feedback-field">
                      <label htmlFor="feedback-message">Your Feedback</label>
                      <textarea
                        id="feedback-message"
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        required
                        placeholder="Tell us what went wrong or what you'd like to see improved."
                        minLength={20}
                        maxLength={500}
                      />
                      <div className="char-counter">
                        <span className={getCharCountColor()}>
                          {feedbackMessage.length}
                        </span>
                        /500
                      </div>
                    </div>

                    <div className="feedback-field">
                      <label htmlFor="feedback-email">Email (Optional)</label>
                      <input
                        type="email"
                        id="feedback-email"
                        value={feedbackEmail}
                        onChange={(e) => setFeedbackEmail(e.target.value)}
                        placeholder="Want a reply? Leave your email"
                      />
                    </div>

                    <button type="submit" className="btn primary">
                      <span className="material-icons">send</span>
                      <span>Send Feedback</span>
                    </button>

                    {feedbackStatus.type !== "idle" && (
                      <div className={`feedback-status ${feedbackStatus.type}`}>
                        {feedbackStatus.message}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>SmartDigest &copy; 2024. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Options;
