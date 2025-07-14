// DOM Elements
const generalNavBtn = document.getElementById("general-nav-btn");
const apiNavBtn = document.getElementById("api-nav-btn");
const settingsNavBtn = document.getElementById("settings-nav-btn");
const helpNavBtn = document.getElementById("help-nav-btn");
const supportNavBtn = document.getElementById("support-nav-btn");
const generalSection = document.getElementById("general-section");
const apiSection = document.getElementById("api-section");
const ttsSection = document.getElementById("tts-section");
const helpSection = document.getElementById("help-section");
const supportSection = document.getElementById("support-section");

// API Settings Elements
const apiKeyInput = document.getElementById("api-key");
const saveApiButton = document.getElementById("save-api-button");
const apiSuccessMessage = document.getElementById("api-success-message");

// General Settings Elements
const enableTooltipCheckbox = document.getElementById("enable-tooltip");
const defaultSummaryTypeSelect = document.getElementById(
  "default-summary-type"
);
const themeLightRadio = document.getElementById("theme-light");
const themeDarkRadio = document.getElementById("theme-dark");
const themeAutoRadio = document.getElementById("theme-auto");
const saveGeneralButton = document.getElementById("save-general-button");
const generalSuccessMessage = document.getElementById(
  "general-success-message"
);

// Support Elements
const feedbackForm = document.getElementById("feedback-form");
const feedbackMessage = document.getElementById("feedback-message");
const feedbackEmail = document.getElementById("feedback-email");
const feedbackMetadata = document.getElementById("feedback-metadata");
const feedbackSubmit = document.getElementById("feedback-submit");
const feedbackStatus = document.getElementById("feedback-status");
const charCount = document.getElementById("char-count");
const faqQuestions = document.querySelectorAll(".faq-question");
const accordionHeaders = document.querySelectorAll(".accordion-header");

// TTS Settings Elements
const voiceSelect = document.getElementById("voice-select");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const testTextInput = document.getElementById("test-text");
const testVoiceBtn = document.getElementById("test-voice-btn");
const saveTtsButton = document.getElementById("save-tts-button");
const ttsSuccessMessage = document.getElementById("tts-success-message");

// TTS State
let testUtterance = null;
let isTestPlaying = false;

// Default TTS settings
const DEFAULT_TTS_SETTINGS = {
  voice: "Google US English",
  speed: 1.0,
};

// Default General settings
const DEFAULT_GENERAL_SETTINGS = {
  enableTooltip: true,
  defaultSummaryType: "brief",
  theme: "auto",
};

// Navigation Functions
function showGeneralSection() {
  generalNavBtn.classList.add("active");
  apiNavBtn.classList.remove("active");
  settingsNavBtn.classList.remove("active");
  helpNavBtn.classList.remove("active");
  supportNavBtn.classList.remove("active");
  generalSection.style.display = "block";
  apiSection.style.display = "none";
  ttsSection.style.display = "none";
  helpSection.style.display = "none";
  supportSection.style.display = "none";
}

function showApiSection() {
  apiNavBtn.classList.add("active");
  generalNavBtn.classList.remove("active");
  settingsNavBtn.classList.remove("active");
  helpNavBtn.classList.remove("active");
  supportNavBtn.classList.remove("active");
  apiSection.style.display = "block";
  generalSection.style.display = "none";
  ttsSection.style.display = "none";
  helpSection.style.display = "none";
  supportSection.style.display = "none";
}

function showTtsSection() {
  settingsNavBtn.classList.add("active");
  generalNavBtn.classList.remove("active");
  apiNavBtn.classList.remove("active");
  helpNavBtn.classList.remove("active");
  supportNavBtn.classList.remove("active");
  ttsSection.style.display = "block";
  generalSection.style.display = "none";
  apiSection.style.display = "none";
  helpSection.style.display = "none";
  supportSection.style.display = "none";
}

function showHelpSection() {
  helpNavBtn.classList.add("active");
  generalNavBtn.classList.remove("active");
  apiNavBtn.classList.remove("active");
  settingsNavBtn.classList.remove("active");
  supportNavBtn.classList.remove("active");
  helpSection.style.display = "block";
  generalSection.style.display = "none";
  apiSection.style.display = "none";
  ttsSection.style.display = "none";
  supportSection.style.display = "none";
}

function showSupportSection() {
  supportNavBtn.classList.add("active");
  generalNavBtn.classList.remove("active");
  apiNavBtn.classList.remove("active");
  settingsNavBtn.classList.remove("active");
  helpNavBtn.classList.remove("active");
  supportSection.style.display = "block";
  generalSection.style.display = "none";
  apiSection.style.display = "none";
  ttsSection.style.display = "none";
  helpSection.style.display = "none";
}

// Voice Loading Functions
function loadVoices() {
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

function populateVoiceSelect(voices) {
  voiceSelect.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "Google US English";
  defaultOption.textContent = "Google US English (Recommended)";
  voiceSelect.appendChild(defaultOption);

  // Add system voices
  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

// TTS Functions
function createTestUtterance(text, voice, speed) {
  const utterance = new SpeechSynthesisUtterance(text);

  // Set voice
  const voices = speechSynthesis.getVoices();
  if (voice === "Google US English") {
    utterance.voice =
      voices.find((v) => v.name.includes("Google US English")) || voices[0];
  } else {
    utterance.voice = voices.find((v) => v.name === voice) || voices[0];
  }

  // Set speed
  utterance.rate = speed;

  return utterance;
}

function testVoice() {
  if (isTestPlaying) {
    speechSynthesis.cancel();
    isTestPlaying = false;
    testVoiceBtn.innerHTML =
      '<span class="material-icons">play_arrow</span> Test Voice';
    return;
  }

  const text = testTextInput.value.trim();
  if (!text) {
    alert("Please enter text to test");
    return;
  }

  const voice = voiceSelect.value;
  const speed = parseFloat(speedSlider.value);

  testUtterance = createTestUtterance(text, voice, speed);

  testUtterance.onend = () => {
    isTestPlaying = false;
    testVoiceBtn.innerHTML =
      '<span class="material-icons">play_arrow</span> Test Voice';
  };

  testUtterance.onerror = () => {
    isTestPlaying = false;
    testVoiceBtn.innerHTML =
      '<span class="material-icons">play_arrow</span> Test Voice';
    alert("Error playing test voice. Please try again.");
  };

  speechSynthesis.speak(testUtterance);
  isTestPlaying = true;
  testVoiceBtn.innerHTML = '<span class="material-icons">stop</span> Stop Test';
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

// Settings Management
async function loadSettings() {
  try {
    // Load API key
    const { geminiApiKey } = await chrome.storage.sync.get(["geminiApiKey"]);
    if (geminiApiKey) {
      apiKeyInput.value = geminiApiKey;
    }

    // Load TTS settings
    const { ttsSettings } = await chrome.storage.sync.get(["ttsSettings"]);
    const ttsSettingsData = ttsSettings || DEFAULT_TTS_SETTINGS;

    // Apply TTS settings
    voiceSelect.value = ttsSettingsData.voice;
    speedSlider.value = ttsSettingsData.speed;
    speedValue.textContent = `${ttsSettingsData.speed}x`;

    // Load General settings
    const { generalSettings } = await chrome.storage.sync.get([
      "generalSettings",
    ]);
    const generalSettingsData = generalSettings || DEFAULT_GENERAL_SETTINGS;

    // Apply General settings
    enableTooltipCheckbox.checked = generalSettingsData.enableTooltip;
    defaultSummaryTypeSelect.value = generalSettingsData.defaultSummaryType;

    // Apply theme radio button
    if (generalSettingsData.theme === "light") {
      themeLightRadio.checked = true;
    } else if (generalSettingsData.theme === "dark") {
      themeDarkRadio.checked = true;
    } else {
      themeAutoRadio.checked = true;
    }

    // Apply theme to page
    applyTheme(generalSettingsData.theme);
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

async function saveApiSettings() {
  try {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert("Please enter your Gemini API key");
      return;
    }

    await chrome.storage.sync.set({ geminiApiKey: apiKey });

    apiSuccessMessage.style.display = "flex";
    setTimeout(() => {
      apiSuccessMessage.style.display = "none";
    }, 3000);
  } catch (error) {
    console.error("Error saving API settings:", error);
    alert("Error saving API settings. Please try again.");
  }
}

async function saveGeneralSettings() {
  try {
    const settings = {
      enableTooltip: enableTooltipCheckbox.checked,
      defaultSummaryType: defaultSummaryTypeSelect.value,
      theme: themeLightRadio.checked
        ? "light"
        : themeDarkRadio.checked
        ? "dark"
        : "auto",
    };

    await chrome.storage.sync.set({ generalSettings: settings });

    // Apply theme immediately
    applyTheme(settings.theme);

    generalSuccessMessage.style.display = "flex";
    setTimeout(() => {
      generalSuccessMessage.style.display = "none";
    }, 3000);
  } catch (error) {
    console.error("Error saving general settings:", error);
    alert("Error saving general settings. Please try again.");
  }
}

async function saveTtsSettings() {
  try {
    const settings = {
      voice: voiceSelect.value,
      speed: parseFloat(speedSlider.value),
    };

    await chrome.storage.sync.set({ ttsSettings: settings });

    ttsSuccessMessage.style.display = "flex";
    setTimeout(() => {
      ttsSuccessMessage.style.display = "none";
    }, 3000);
  } catch (error) {
    console.error("Error saving TTS settings:", error);
    alert("Error saving TTS settings. Please try again.");
  }
}

// Feedback form submission
async function handleFeedbackSubmit(e) {
  e.preventDefault();

  const message = feedbackMessage.value.trim();
  const email = feedbackEmail.value.trim();

  // Validation
  if (message.length < 20) {
    showFeedbackStatus(
      "Please provide at least 20 characters of feedback.",
      "error"
    );
    return;
  }

  if (message.length > 500) {
    showFeedbackStatus(
      "Feedback is too long. Please keep it under 500 characters.",
      "error"
    );
    return;
  }

  if (email && !isValidEmail(email)) {
    showFeedbackStatus("Please enter a valid email address.", "error");
    return;
  }

  // Prepare metadata
  const metadata = {
    extensionVersion: chrome.runtime.getManifest().version,
    browser: navigator.userAgent,
    os: navigator.platform,
    timestamp: new Date().toISOString(),
  };

  // Show loading state
  showFeedbackStatus("Sending feedback...", "loading");
  feedbackSubmit.disabled = true;

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append("message", message);
    if (email) formData.append("email", email);
    formData.append("metadata", JSON.stringify(metadata));

    // Submit to Formspree (placeholder URL)
    const response = await fetch("https://formspree.io/f/your-form-id", {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      showFeedbackStatus(
        "Thank you for your feedback! We'll review it shortly.",
        "success"
      );
      feedbackForm.reset();
      charCount.textContent = "0";
    } else {
      throw new Error("Submission failed");
    }
  } catch (error) {
    console.error("Feedback submission error:", error);
    showFeedbackStatus(
      "Failed to send feedback. Please try again or contact us directly.",
      "error"
    );
  } finally {
    feedbackSubmit.disabled = false;
  }
}

function showFeedbackStatus(message, type) {
  feedbackStatus.textContent = message;
  feedbackStatus.className = `feedback-status ${type}`;

  if (type === "success") {
    setTimeout(() => {
      feedbackStatus.style.display = "none";
    }, 5000);
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize navigation
    showGeneralSection();

    // Load existing settings
    await loadSettings();

    // Load voices
    const voices = await loadVoices();
    populateVoiceSelect(voices);

    // Navigation event listeners
    generalNavBtn.addEventListener("click", showGeneralSection);
    apiNavBtn.addEventListener("click", showApiSection);
    settingsNavBtn.addEventListener("click", showTtsSection);
    helpNavBtn.addEventListener("click", showHelpSection);
    supportNavBtn.addEventListener("click", showSupportSection);

    // FAQ functionality
    faqQuestions.forEach((question) => {
      question.addEventListener("click", () => {
        const isExpanded = question.getAttribute("aria-expanded") === "true";
        const answer = question.nextElementSibling;

        // Close all other FAQ items
        faqQuestions.forEach((q) => {
          q.setAttribute("aria-expanded", "false");
          q.nextElementSibling.classList.remove("active");
        });

        // Toggle current item
        if (!isExpanded) {
          question.setAttribute("aria-expanded", "true");
          answer.classList.add("active");
        }
      });
    });

    // Accordion functionality
    accordionHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        const isExpanded = header.getAttribute("aria-expanded") === "true";
        const content = header.nextElementSibling;

        // Close all other accordion items
        accordionHeaders.forEach((h) => {
          h.setAttribute("aria-expanded", "false");
          h.nextElementSibling.classList.remove("expanded");
        });

        // Toggle current item
        if (!isExpanded) {
          header.setAttribute("aria-expanded", "true");
          content.classList.add("expanded");
        }
      });
    });

    // Feedback form functionality
    feedbackMessage.addEventListener("input", () => {
      const length = feedbackMessage.value.length;
      charCount.textContent = length;

      if (length > 450) {
        charCount.style.color = "#dc2626";
      } else if (length > 400) {
        charCount.style.color = "#f59e0b";
      } else {
        charCount.style.color = "var(--text-secondary)";
      }
    });

    feedbackForm.addEventListener("submit", handleFeedbackSubmit);

    // General settings event listeners
    saveGeneralButton.addEventListener("click", saveGeneralSettings);

    // API settings event listeners
    saveApiButton.addEventListener("click", saveApiSettings);

    // TTS settings event listeners
    speedSlider.addEventListener("input", (e) => {
      const speed = parseFloat(e.target.value);
      speedValue.textContent = `${speed}x`;
    });

    testVoiceBtn.addEventListener("click", testVoice);
    saveTtsButton.addEventListener("click", saveTtsSettings);

    // Theme change listeners
    [themeLightRadio, themeDarkRadio, themeAutoRadio].forEach((radio) => {
      radio.addEventListener("change", () => {
        const selectedTheme = radio.value;
        applyTheme(selectedTheme);
      });
    });
  } catch (error) {
    console.error("Error initializing options page:", error);
  }
});
