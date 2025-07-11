import { getGeminiSummary } from "./src/summarizer.js";

console.log("[Background] Service worker starting...");

// Error message constants
const ERROR_MESSAGES = {
  TAB_NOT_FOUND: "❌ Could not get the active tab.",
  API_KEY_MISSING: "❌ API key missing. Please enter it in the options page.",
  TTS_FAILED: "🔇 Text-to-Speech failed. Your browser may not support it.",
  UNKNOWN_ERROR: "❌ An unexpected error occurred. Please try again.",
  TEXT_TOO_SHORT:
    "⚠️ Please select more text to summarize (at least 10 characters).",
  INVALID_INPUT: "⚠️ Invalid input provided. Please try again.",
};

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  try {
    console.log("[Background] Extension installed, creating context menu...");
    chrome.contextMenus.create({
      id: "summarize-selection",
      title: "Summarize with SmartDigest",
      contexts: ["selection"],
    });

    chrome.runtime.openOptionsPage();
  } catch (error) {
    console.error("[Background] Error during installation:", error);
  }
});

// Context menu summarization
chrome.contextMenus.onClicked.addListener((info, tab) => {
  try {
    if (info.menuItemId === "summarize-selection" && info.selectionText) {
      console.log(
        "[Background] Context menu clicked, selected text length:",
        info.selectionText.length
      );
      chrome.tabs
        .sendMessage(tab.id, {
          type: "summarize-selection",
          text: info.selectionText,
          showTooltip: true,
        })
        .catch((error) => {
          console.error("[Background] Error sending message to tab:", error);
        });
    }
  } catch (error) {
    console.error("[Background] Error in context menu click:", error);
  }
});

// Message listener for summarize-selection (popup or content.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log("[Background] Message received:", {
      type: message.type || message.action,
      textLength: message.text?.length,
      showTooltip: message.showTooltip,
    });

    if (
      message.type === "summarize-selection" ||
      message.action === "summarize_text"
    ) {
      (async () => {
        try {
          const { text, summaryType = "brief", showTooltip } = message;

          // Validate input
          if (!text || typeof text !== "string") {
            console.warn("[Background] Invalid text input:", typeof text);
            sendResponse(ERROR_MESSAGES.INVALID_INPUT);
            return;
          }

          if (text.trim().length < 10) {
            console.warn("[Background] Text too short:", text.trim().length);
            sendResponse(ERROR_MESSAGES.TEXT_TOO_SHORT);
            return;
          }

          console.log("[Background] Getting API key from storage...");
          const { geminiApiKey } = await chrome.storage.sync.get([
            "geminiApiKey",
          ]);

          if (!geminiApiKey) {
            console.warn("[Background] Gemini API key is missing.");
            chrome.runtime.openOptionsPage();
            sendResponse(ERROR_MESSAGES.API_KEY_MISSING);
            return;
          }

          console.log("[Background] API key found, calling summarizer...");
          const summary = await getGeminiSummary(
            text,
            summaryType,
            geminiApiKey
          );
          console.log(
            "[Background] Summary generated successfully, length:",
            summary.length
          );

          const tabId = sender.tab?.id ?? message.tabId;

          if (showTooltip && tabId !== undefined) {
            try {
              console.log("[Background] Sending tooltip to tab:", tabId);
              await chrome.tabs.sendMessage(tabId, {
                type: "show-summary-tooltip",
                summary,
              });
            } catch (error) {
              console.error(
                "[Background] Error sending tooltip message:",
                error
              );
            }
          }

          sendResponse(summary);
        } catch (error) {
          console.error("[Background] Error while summarizing:", error);

          const errorMsg = error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
          console.log("[Background] Sending error response:", errorMsg);

          if (message.showTooltip && sender.tab?.id) {
            try {
              await chrome.tabs.sendMessage(sender.tab.id, {
                type: "show-summary-tooltip",
                summary: errorMsg,
              });
            } catch (tooltipError) {
              console.error(
                "[Background] Error sending error tooltip:",
                tooltipError
              );
            }
          }

          sendResponse(errorMsg);
        }
      })();

      return true; // Keep message channel open for async response
    }
  } catch (error) {
    console.error("[Background] Error in message listener:", error);
    sendResponse(ERROR_MESSAGES.UNKNOWN_ERROR);
  }
});
