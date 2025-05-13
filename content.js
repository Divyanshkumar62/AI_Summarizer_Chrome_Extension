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

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_ARTICLE_TEXT") {
    const text = getArticleText(); // or however you extract main text
    sendResponse({ text });
    console.log(text)
    return true; // keep message channel open for async responses
  }

  if (req.type === "show-summary") {
    showSummaryTooltip(req.summary);
  }
});


let summarizeBtn = null;
let summaryTooltip = null;

document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection()?.toString()?.trim();

  if (selectedText) {
    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();
    showSummarizeButton(rect, selectedText);
  } else {
    removeSummarizeButton();
  }
});

function showSummarizeButton(rect, selectedText) {
  removeSummarizeButton();

  summarizeBtn = document.createElement("button");
  summarizeBtn.innerText = "Summarize";
  summarizeBtn.className = "gemini-summarize-btn";
  summarizeBtn.style.position = "absolute";
  summarizeBtn.style.top = `${rect.bottom + window.scrollY}px`;
  summarizeBtn.style.left = `${rect.right + window.scrollX}px`;
  summarizeBtn.style.zIndex = "9999";

  summarizeBtn.onclick = () => {
    chrome.runtime.sendMessage({
      type: "summarize-selection",
      text: selectedText,
    });
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

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  summaryTooltip = document.createElement("div");
  summaryTooltip.className = "gemini-summary-tooltip";
  summaryTooltip.innerText = summary;
  summaryTooltip.style.position = "absolute";
  summaryTooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
  summaryTooltip.style.left = `${rect.left + window.scrollX}px`;
  summaryTooltip.style.backgroundColor = "#fff";
  summaryTooltip.style.border = "1px solid #ccc";
  summaryTooltip.style.padding = "10px";
  summaryTooltip.style.zIndex = "9999";

  document.body.appendChild(summaryTooltip);

  setTimeout(() => {
    removeSummaryTooltip();
  }, 15000); // Hide after 15 seconds
}

function removeSummaryTooltip() {
  if (summaryTooltip) {
    summaryTooltip.remove();
    summaryTooltip = null;
  }
}
