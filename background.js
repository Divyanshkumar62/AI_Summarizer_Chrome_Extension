import { getGeminiSummary } from "./summarizer.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "summarize-selection") {
    chrome.storage.sync.get(["geminiApiKey"], async ({ geminiApiKey }) => {
      if (!geminiApiKey) {
        chrome.runtime.openOptionsPage(); // Prompt user to enter key
        return;
      }
      try {
        const summary = await getGeminiSummary(
          message.text,
          "brief",
          geminiApiKey
        );
        chrome.tabs.sendMessage(sender.tab.id, {
          type: "show-summary",
          summary: summary,
        });
      } catch (error) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: "show-summary",
          summary: "Gemini Error: " + error.message,
        });
      }
    });
  }
});
