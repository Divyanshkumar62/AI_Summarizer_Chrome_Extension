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

document.addEventListener("mouseup", (e) => {
  if (e.target === summarizeBtn) {
    return;
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

  summarizeBtn = document.createElement("button");
  summarizeBtn.className = "gemini-summarize-btn";
  summarizeBtn.innerHTML = '<span class="sparkle">✨</span> Summarize';
  Object.assign(summarizeBtn.style, {
    position: "absolute",
    top: `${rect.top + window.scrollY - 50}px`,
    left: `${rect.left + window.scrollX}px`,
    padding: "8px 16px",
    background: "linear-gradient(135deg, #4A90E2, #357ABD)",
    fontSize: "14px",
    color: "white",
    border: "none",
    borderRadius: "8px",
    zIndex: "9999",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 12px rgba(74, 144, 226, 0.2)",
    transition: "all 0.2s ease",
    animation: "buttonAppear 0.3s ease",
  });

  summarizeBtn.onmouseover = () => {
    summarizeBtn.style.transform = "translateY(-1px)";
    summarizeBtn.style.boxShadow = "0 6px 16px rgba(74, 144, 226, 0.3)";
  };

  summarizeBtn.onmouseout = () => {
    summarizeBtn.style.transform = "translateY(0)";
    summarizeBtn.style.boxShadow = "0 4px 12px rgba(74, 144, 226, 0.2)";
  };

  summarizeBtn.onclick = () => {
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
  summaryTooltip.className = "gemini-summary-tooltip";
  Object.assign(summaryTooltip.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#ffffff",
    border: "1px solid rgba(0, 0, 0, 0.1)",
    padding: "24px",
    maxWidth: "600px",
    maxHeight: "400px",
    overflowY: "auto",
    zIndex: "9999",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    fontSize: "16px",
    borderRadius: "12px",
    lineHeight: "1.6",
    fontFamily: "'Inter', sans-serif",
    color: "#1f2937",
    animation: "tooltipAppear 0.3s ease",
    backdropFilter: "blur(8px)",
  });

  const summaryText = document.createElement("div");
  summaryText.innerText = summary;
  summaryText.style.marginBottom = "20px";
  summaryTooltip.appendChild(summaryText);

  const btnContainer = document.createElement("div");
  Object.assign(btnContainer.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  });

  const copyBtn = document.createElement("button");
  copyBtn.innerText = "Copy";
  Object.assign(copyBtn.style, {
    padding: "10px 20px",
    background: "#4A90E2",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  });
  copyBtn.innerHTML = "<span>📋</span> Copy";

  copyBtn.onmouseover = () => {
    copyBtn.style.transform = "translateY(-1px)";
    copyBtn.style.boxShadow = "0 4px 12px rgba(74, 144, 226, 0.2)";
  };

  copyBtn.onmouseout = () => {
    copyBtn.style.transform = "translateY(0)";
    copyBtn.style.boxShadow = "none";
  };

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(summary).then(() => {
      copyBtn.innerHTML = "<span>✓</span> Copied!";
      copyBtn.style.background = "#059669";
      setTimeout(() => {
        copyBtn.innerHTML = "<span>📋</span> Copy";
        copyBtn.style.background = "#4A90E2";
      }, 1500);
    });
  };

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "Close";
  Object.assign(closeBtn.style, {
    padding: "10px 20px",
    background: "#f3f4f6",
    color: "#1f2937",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s ease",
  });

  closeBtn.onmouseover = () => {
    closeBtn.style.background = "#e5e7eb";
  };

  closeBtn.onmouseout = () => {
    closeBtn.style.background = "#f3f4f6";
  };

  closeBtn.onclick = removeSummaryTooltip;

  btnContainer.appendChild(copyBtn);
  btnContainer.appendChild(closeBtn);

  summaryTooltip.appendChild(btnContainer);
  document.body.appendChild(summaryTooltip);
}

function showLoadingTooltip() {
  removeSummaryTooltip();

  summaryTooltip = document.createElement("div");
  summaryTooltip.className = "gemini-summary-tooltip loading";
  Object.assign(summaryTooltip.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#ffffff",
    border: "1px solid rgba(0, 0, 0, 0.1)",
    padding: "32px",
    borderRadius: "12px",
    zIndex: "9999",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    minWidth: "200px",
    animation: "tooltipAppear 0.3s ease",
  });

  const loadingIcon = document.createElement("div");
  Object.assign(loadingIcon.style, {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f4f6",
    borderTop: "3px solid #4A90E2",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  });

  const loadingText = document.createElement("div");
  loadingText.innerText = "Summarizing...";
  Object.assign(loadingText.style, {
    fontSize: "16px",
    color: "#1f2937",
    fontWeight: "500",
  });

  summaryTooltip.appendChild(loadingIcon);
  summaryTooltip.appendChild(loadingText);
  document.body.appendChild(summaryTooltip);
}

function removeSummaryTooltip() {
  if (summaryTooltip) {
    summaryTooltip.remove();
    summaryTooltip = null;
  }
}

// Add keyframes for animations
const style = document.createElement("style");
style.textContent = `
  @keyframes buttonAppear {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes tooltipAppear {
    from {
      opacity: 0;
      transform: translate(-50%, -48%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
