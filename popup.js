document.addEventListener("DOMContentLoaded", () => {
  const summarizeBtn = document.getElementById("summarize");
  const resultDiv = document.getElementById("result");
  const copyBtn = document.getElementById("copy-btn");
  const summaryTypeSelect = document.getElementById("summary-type");

  summarizeBtn.addEventListener("click", async () => {
    resultDiv.textContent = "Summarizing...";

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        resultDiv.textContent = "❌ Could not get the active tab.";
        return;
      }

      // Optional: inject content.js manually in case it wasn't injected (e.g., SPA, Shadow DOM)
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      // Send message to content script
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

      // Send text to background or summarizer
      const summary = await chrome.runtime.sendMessage({
        action: "summarize_text",
        text,
        summaryType,
      });
      console.log(summary)

      resultDiv.textContent = summary || "⚠️ No summary returned.";
    } catch (err) {
      console.error("❌ Error:", err);
      resultDiv.textContent = `⚠️ ${err.message}`;
    }
  });

  copyBtn.addEventListener("click", () => {
    const text = resultDiv.textContent;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy Summary"), 2000);
    });
  });
});
