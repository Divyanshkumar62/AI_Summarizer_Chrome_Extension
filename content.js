let summarizeBtn = null;
let summaryTooltip = null;

function getArticleText() {
  const article = document.querySelector("article");
  if (article) return article.innerText;

  const paragraphs = Array.from(document.querySelectorAll("p"));
  if (paragraphs.length > 0)
    return paragraphs.map((p) => p.innerText).join("\n");

  const main = document.querySelector("main");
  if (main) return main.innerText;

  return document.body.innerText;
}

// Listener for messages from background.js
chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  console.log("[Content Script] Message received:", req);

  if (req.type === "GET_ARTICLE_TEXT") {
    const text = getArticleText();
    sendResponse({ text });
    return true;
  }

  if (req.type === "show-summary-tooltip") {
    showSummaryTooltip(req.summary);
  }
});

// Detect selected text on mouseup, and ignore if clicking on summarize button
document.addEventListener("mouseup", (e) => {
  if (e.target === summarizeBtn) {
    return; // Don't reprocess selection when clicking on summarize button
  }

  const selectedText = window.getSelection()?.toString()?.trim();
  if (selectedText) {
    console.log("[Content Script] Text selected--", selectedText);
    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();
    showSummarizeButton(rect, selectedText);
  } else {
    removeSummarizeButton();
  }
});

function showSummarizeButton(rect, selectedText) {
  removeSummarizeButton();

  console.log("[Content Script] Showing summarize button...");

  summarizeBtn = document.createElement("button");
  summarizeBtn.innerText = "Summarize";
  Object.assign(summarizeBtn.style, {
    position: "absolute",
    top: `${rect.top + window.scrollY - 50}px`,
    left: `${rect.left + window.scrollX}px`,
    padding: "8px 14px",
    backgroundColor: "#007bff",
    fontSize: "16px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    zIndex: "9999",
    cursor: "pointer",
  });

  summarizeBtn.onclick = () => {
    console.log("[Content Script] Summarize button clicked");

    showLoadingTooltip();

    chrome.runtime.sendMessage(
      {
        type: "summarize-selection",
        text: selectedText,
        showTooltip: true,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "[Content Script] Error sending message:",
            chrome.runtime.lastError.message
          );
          showSummaryTooltip("❌ Error: " + chrome.runtime.lastError.message);
          return;
        }

        console.log("[Content Script] Got response from background:", response);

        if (response) {
          showSummaryTooltip(response);
        }
      }
    );

    removeSummarizeButton();
  };

  document.body.appendChild(summarizeBtn);
}

function removeSummarizeButton() {
  if (summarizeBtn) {
    summarizeBtn.remove();
    summarizeBtn = null;
  }
}

function showSummaryTooltip(summary) {
  removeSummaryTooltip();

  summaryTooltip = document.createElement("div");
  Object.assign(summaryTooltip.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#ffffff",
    border: "1px solid #ccc",
    padding: "24px",
    maxWidth: "600px",
    maxHeight: "400px",
    overflowY: "auto",
    zIndex: "9999",
    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.2)",
    fontSize: "16px",
    borderRadius: "10px",
    lineHeight: "1.6",
    fontFamily: "Arial, sans-serif",
    color: "#222",
  });

  const summaryText = document.createElement("div");
  summaryText.innerText = summary;
  summaryText.style.marginBottom = "16px";
  summaryTooltip.appendChild(summaryText);

  const btnContainer = document.createElement("div");
  Object.assign(btnContainer.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  });

  const copyBtn = document.createElement("button");
  copyBtn.innerText = "Copy";
  Object.assign(copyBtn.style, {
    padding: "8px 16px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  });
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(summary).then(() => {
      copyBtn.innerText = "Copied!";
      setTimeout(() => (copyBtn.innerText = "Copy"), 1500);
    });
  };

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "Close";
  Object.assign(closeBtn.style, {
    padding: "8px 16px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  });
  closeBtn.onclick = removeSummaryTooltip;

  btnContainer.appendChild(copyBtn);
  btnContainer.appendChild(closeBtn);

  summaryTooltip.appendChild(btnContainer);
  document.body.appendChild(summaryTooltip);

}


function showLoadingTooltip() {
  removeSummaryTooltip();

  summaryTooltip = document.createElement("div");
  summaryTooltip.innerText = "⏳ Summarizing...";
  Object.assign(summaryTooltip.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    padding: "15px 30px",
    borderRadius: "8px",
    fontSize: "16px",
    zIndex: "9999",
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  });

  document.body.appendChild(summaryTooltip);
}

function removeSummaryTooltip() {
  if (summaryTooltip) {
    summaryTooltip.remove();
    summaryTooltip = null;
  }
}
