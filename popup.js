const speakBtn = document.getElementById("speak-btn");
const summarizeBtn = document.getElementById("summarize");
const resultDiv = document.getElementById("result");
const copyBtn = document.getElementById("copy-btn");
const summaryTypeSelect = document.getElementById("summary-type");

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
        files: ["content.js"],
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

//  text to speech
let isSpeaking = false;
let isPaused = false;
let utterance = null;

speakBtn.addEventListener("click", () => {
  const text = resultDiv.innerText.trim();

  if (!text) return;

  if (!isSpeaking) {
    utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.name.includes("Google US English")) || voices[0];
    utterance.rate = 1;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      isSpeaking = false;
      speakBtn.textContent = "Listen";
    };

    speechSynthesis.speak(utterance);
    isSpeaking = true;
    speakBtn.textContent = "Pause";
  } else if (!isPaused) {
    speechSynthesis.pause();
    isPaused = true;
    speakBtn.textContent = "Paused";
  }
});
