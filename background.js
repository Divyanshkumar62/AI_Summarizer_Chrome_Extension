import { getGeminiSummary } from "./summarizer.js";

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarize-selection",
    title: "Summarize with Gemini",
    contexts: ["selection"],
  });

  chrome.runtime.openOptionsPage();
});

// Context menu summarization
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarize-selection" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      type: "summarize-selection",
      text: info.selectionText,
      showTooltip: true,
    });
  }
});

// Message listener for summarize-selection (popup or content.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Background] Message received:", message);

  if (
    message.type === "summarize-selection" ||
    message.action === "summarize_text"
  ) {
    
    (async () => {
      const { text, summaryType = "brief", showTooltip } = message;

      try {
        const { geminiApiKey } = await chrome.storage.sync.get([
          "geminiApiKey",
        ]);

        if (!geminiApiKey) {
          console.warn("[Background] Gemini API key is missing.");
          chrome.runtime.openOptionsPage();
          sendResponse(
            "❌ API key missing. Please enter it in the options page."
          );
          return;
        }

        console.log("[Background] Summarizing text...");

        const summary = await getGeminiSummary(text, summaryType, geminiApiKey);
        console.log("[Background] Summary generated:", summary);

        const tabId = sender.tab?.id ?? message.tabId;

        if (showTooltip && tabId !== undefined) {
          chrome.tabs.sendMessage(tabId, {
            type: "show-summary-tooltip",
            summary,
          });
        }

        sendResponse(summary); // Reply back to sender
      } catch (error) {
        const errorMsg = "Gemini Error: " + error.message;
        console.error("[Background] Error while summarizing:", errorMsg);

        if (message.showTooltip && sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: "show-summary-tooltip",
            summary: errorMsg,
          });
        }

        sendResponse(errorMsg);
      }
    })();

    return true; // Keep message channel open for async sendResponse
  }
});
