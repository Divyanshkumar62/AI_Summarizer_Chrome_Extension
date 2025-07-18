import { getGeminiSummary } from "../utils/api";
import { retrieveApiKeySecurely, sanitizeInput } from "../utils/security";

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
      chrome.tabs.sendMessage(
        tab?.id || 0,
        {
          type: "summarize-selection",
          text: info.selectionText,
          showTooltip: true,
        },
        (error) => {
          console.error("[Background] Error sending message to tab:", error);
        }
      );
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

          // Sanitize input
          const sanitizedText = sanitizeInput(text);

          console.log("[Background] Getting API key from secure storage...");
          const apiKey = await retrieveApiKeySecurely();

          if (!apiKey) {
            console.warn("[Background] Gemini API key is missing.");
            chrome.runtime.openOptionsPage();
            sendResponse(ERROR_MESSAGES.API_KEY_MISSING);
            return;
          }

          console.log("[Background] API key found, calling summarizer...");
          const summary = await getGeminiSummary(
            sanitizedText,
            summaryType,
            apiKey
          );
          console.log(
            "[Background] Summary generated successfully, length:",
            summary.length
          );

          const tabId =
            sender.tab && sender.tab.id ? sender.tab.id : message.tabId;

          if (showTooltip && typeof tabId === "number") {
            try {
              console.log("[Background] Sending tooltip to tab:", tabId);
              await chrome.tabs.sendMessage(tabId, {
                type: "show-summary-tooltip",
                summary,
                timestamp: Date.now(),
              });
            } catch (error) {
              console.error(
                "[Background] Error sending tooltip message:",
                error
              );
            }
          }

          console.log("[Background] About to send response to popup...");
          sendResponse(summary);
          console.log("[Background] Response sent successfully");
        } catch (error: any) {
          console.error("[Background] Error while summarizing:", error);

          let errorMsg = ERROR_MESSAGES.UNKNOWN_ERROR;

          if (error.message) {
            // Check for specific error types
            if (error.message.includes("API key")) {
              errorMsg = ERROR_MESSAGES.API_KEY_MISSING;
            } else if (error.message.includes("rate limit")) {
              errorMsg = "⚠️ Rate limit exceeded. Please try again later.";
            } else if (error.message.includes("503")) {
              errorMsg =
                "❌ Gemini API service is temporarily unavailable. Please try again in a few minutes.";
            } else if (error.message.includes("403")) {
              errorMsg =
                "❌ API key is invalid or has insufficient permissions.";
            } else if (error.message.includes("400")) {
              errorMsg = "❌ Invalid API key or request format.";
            } else {
              errorMsg = error.message;
            }
          }

          console.log("[Background] Sending error response:", errorMsg);

          if (
            message.showTooltip &&
            sender.tab &&
            typeof sender.tab.id === "number"
          ) {
            try {
              await chrome.tabs.sendMessage(sender.tab.id, {
                type: "show-summary-tooltip",
                summary: errorMsg,
                timestamp: Date.now(),
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
