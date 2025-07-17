// TTS Settings interface
export interface TTSSettings {
  voice: string;
  speed: number;
}

// General Settings interface
export interface GeneralSettings {
  enableTooltip: boolean;
  defaultSummaryType: string;
  theme: string;
}

// Default TTS settings
export const DEFAULT_TTS_SETTINGS: TTSSettings = {
  voice: "Google US English",
  speed: 1.0,
};

// Default General settings
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  enableTooltip: true,
  defaultSummaryType: "brief",
  theme: "auto",
};

// Error message constants
export const ERROR_MESSAGES = {
  TTS_FAILED: "🔇 Text-to-Speech failed. Your browser may not support it.",
  TTS_NOT_SUPPORTED: "🔇 Text-to-Speech is not supported in this browser.",
  PAUSE_NOT_SUPPORTED:
    "⏸ Pause not supported in this browser. Click stop to restart.",
};

// Check if TTS is supported
export function isTTSSupported(): boolean {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

// Check if pause/resume is supported
export function isPauseResumeSupported(): boolean {
  return (
    "speechSynthesis" in window &&
    "pause" in speechSynthesis &&
    "resume" in speechSynthesis
  );
}

// Wait for voices to be loaded
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
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

// Get voice from settings
export function getVoiceFromSettings(
  voices: SpeechSynthesisVoice[],
  settings: TTSSettings
): SpeechSynthesisVoice | null {
  if (settings.voice === "Google US English") {
    return (
      voices.find((v) => v.name.includes("Google US English")) ||
      voices[0] ||
      null
    );
  } else {
    return voices.find((v) => v.name === settings.voice) || voices[0] || null;
  }
}

// Load TTS settings from storage
export async function loadTTSSettings(): Promise<TTSSettings> {
  try {
    const { ttsSettings } = await chrome.storage.sync.get(["ttsSettings"]);
    return ttsSettings || DEFAULT_TTS_SETTINGS;
  } catch (error) {
    console.error("Error loading TTS settings:", error);
    return DEFAULT_TTS_SETTINGS;
  }
}

// Save TTS settings to storage
export async function saveTTSSettings(settings: TTSSettings): Promise<void> {
  try {
    await chrome.storage.sync.set({ ttsSettings: settings });
  } catch (error) {
    console.error("Error saving TTS settings:", error);
    throw error;
  }
}

// Load General settings from storage
export async function loadGeneralSettings(): Promise<GeneralSettings> {
  try {
    const { generalSettings } = await chrome.storage.sync.get([
      "generalSettings",
    ]);
    return generalSettings || DEFAULT_GENERAL_SETTINGS;
  } catch (error) {
    console.error("Error loading general settings:", error);
    return DEFAULT_GENERAL_SETTINGS;
  }
}

// Save General settings to storage
export async function saveGeneralSettings(
  settings: GeneralSettings
): Promise<void> {
  try {
    await chrome.storage.sync.set({ generalSettings: settings });
  } catch (error) {
    console.error("Error saving general settings:", error);
    throw error;
  }
}

// Apply theme to the page
export function applyTheme(theme: string): void {
  const root = document.documentElement;

  // Remove existing theme attributes
  root.removeAttribute("data-theme");

  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    // Light theme is default, no attribute needed
    root.removeAttribute("data-theme");
  } else if (theme === "auto") {
    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      root.setAttribute("data-theme", "dark");
    }
    // Light theme is default for auto mode when system is light
  }
}
 