let summarizeBtn = null;
let summaryTooltip = null;

// Error message constants
const ERROR_MESSAGES = {
  SELECTION_TOO_SHORT: "⚠️ Please select more text to summarize.",
  NETWORK_ERROR:
    "🚫 Network error occurred. Please check your internet connection.",
  UNKNOWN_ERROR: "❌ An unexpected error occurred. Please try again.",
};

// Safe text content assignment (XSS protection)
function setTextContent(element, text) {
  if (element && typeof text === "string") {
    element.textContent = text;
  }
}

// Sanitize text input
function sanitizeText(text) {
  if (typeof text !== "string") return "";
  return text.replace(/[<>]/g, "").trim();
}

// Ensure element is within viewport
function ensureInViewport(element, rect) {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  let top = rect.top + window.scrollY - 50;
  let left = rect.left + window.scrollX;

  // Adjust if too close to top
  if (top < 10) {
    top = rect.bottom + window.scrollY + 10;
  }

  // Adjust if too close to bottom
  if (top + element.offsetHeight > window.scrollY + viewport.height - 10) {
    top = rect.top + window.scrollY - element.offsetHeight - 10;
  }

  // Adjust if too close to left
  if (left < 10) {
    left = 10;
  }

  // Adjust if too close to right
  if (left + element.offsetWidth > viewport.width - 10) {
    left = viewport.width - element.offsetWidth - 10;
  }

  return { top, left };
}

function getArticleText() {
  try {
    const article = document.querySelector("article");
    if (article) return sanitizeText(article.innerText);

    const paragraphs = Array.from(document.querySelectorAll("p"));
    if (paragraphs.length > 0) {
      const text = paragraphs.map((p) => sanitizeText(p.innerText)).join("\n");
      return text.length > 10 ? text : "";
    }

    const main = document.querySelector("main");
    if (main) return sanitizeText(main.innerText);

    const bodyText = sanitizeText(document.body.innerText);
    return bodyText.length > 10 ? bodyText : "";
  } catch (error) {
    console.error("[Content] Error extracting article text:", error);
    return "";
  }
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  try {
    // console.log("[Content Script] Message received:", req);

    if (req.type === "GET_ARTICLE_TEXT") {
      const text = getArticleText();
      sendResponse({ text });
      return true;
    }

    if (req.type === "show-summary-tooltip") {
      showSummaryTooltip(req.summary);
    }
  } catch (error) {
    console.error("[Content] Message listener error:", error);
    sendResponse({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
  }
});

document.addEventListener("mouseup", (e) => {
  try {
    if (e.target === summarizeBtn) {
      return;
    }

    const selectedText = window.getSelection()?.toString()?.trim();
    if (selectedText && selectedText.length >= 10) {
      // console.log("[Content Script] Text selected--", selectedText);
      const range = window.getSelection().getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showSummarizeButton(rect, selectedText);
    } else {
      removeSummarizeButton();
    }
  } catch (error) {
    console.error("[Content] Mouseup error:", error);
    removeSummarizeButton();
  }
});

function showSummarizeButton(rect, selectedText) {
  try {
    removeSummarizeButton();

    summarizeBtn = document.createElement("button");
    summarizeBtn.className = "gemini-summarize-btn";
    setTextContent(summarizeBtn, "✨ Summarize");

    Object.assign(summarizeBtn.style, {
      position: "absolute",
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

    // Position the button within viewport
    const position = ensureInViewport(summarizeBtn, rect);
    summarizeBtn.style.top = `${position.top}px`;
    summarizeBtn.style.left = `${position.left}px`;

    summarizeBtn.onmouseover = () => {
      summarizeBtn.style.transform = "translateY(-1px)";
      summarizeBtn.style.boxShadow = "0 6px 16px rgba(74, 144, 226, 0.3)";
    };

    summarizeBtn.onmouseout = () => {
      summarizeBtn.style.transform = "translateY(0)";
      summarizeBtn.style.boxShadow = "0 4px 12px rgba(74, 144, 226, 0.2)";
    };

    summarizeBtn.onclick = () => {
      try {
        showLoadingTooltip();

        chrome.runtime.sendMessage(
          {
            type: "summarize-selection",
            text: selectedText,
            showTooltip: true,
          },
          (response) => {
            try {
              if (chrome.runtime.lastError) {
                console.error(
                  "[Content Script] Error sending message:",
                  chrome.runtime.lastError.message
                );
                showSummaryTooltip(
                  "❌ Error: " + chrome.runtime.lastError.message
                );
                return;
              }

              // console.log("[Content Script] Got response from background:", response);

              if (response) {
                showSummaryTooltip(response);
              } else {
                showSummaryTooltip(ERROR_MESSAGES.UNKNOWN_ERROR);
              }
            } catch (error) {
              console.error("[Content] Response handling error:", error);
              showSummaryTooltip(ERROR_MESSAGES.UNKNOWN_ERROR);
            }
          }
        );

        removeSummarizeButton();
      } catch (error) {
        console.error("[Content] Summarize button click error:", error);
        showSummaryTooltip(ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    };

    document.body.appendChild(summarizeBtn);
  } catch (error) {
    console.error("[Content] Error showing summarize button:", error);
  }
}

function removeSummarizeButton() {
  try {
    if (summarizeBtn) {
      summarizeBtn.remove();
      summarizeBtn = null;
    }
  } catch (error) {
    console.error("[Content] Error removing summarize button:", error);
  }
}

function showSummaryTooltip(summary) {
  try {
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
    setTextContent(summaryText, summary);
    summaryText.style.marginBottom = "20px";
    summaryTooltip.appendChild(summaryText);

    const btnContainer = document.createElement("div");
    Object.assign(btnContainer.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
    });

    const copyBtn = document.createElement("button");
    setTextContent(copyBtn, "📋 Copy");
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

    copyBtn.onmouseover = () => {
      copyBtn.style.transform = "translateY(-1px)";
      copyBtn.style.boxShadow = "0 4px 12px rgba(74, 144, 226, 0.2)";
    };

    copyBtn.onmouseout = () => {
      copyBtn.style.transform = "translateY(0)";
      copyBtn.style.boxShadow = "none";
    };

    copyBtn.onclick = () => {
      try {
        navigator.clipboard
          .writeText(summary)
          .then(() => {
            setTextContent(copyBtn, "✓ Copied!");
            copyBtn.style.background = "#059669";
            setTimeout(() => {
              setTextContent(copyBtn, "📋 Copy");
              copyBtn.style.background = "#4A90E2";
            }, 1500);
          })
          .catch((error) => {
            console.error("[Content] Copy failed:", error);
            setTextContent(copyBtn, "Failed");
            setTimeout(() => {
              setTextContent(copyBtn, "📋 Copy");
            }, 1500);
          });
      } catch (error) {
        console.error("[Content] Copy button error:", error);
      }
    };

    const closeBtn = document.createElement("button");
    setTextContent(closeBtn, "Close");
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
  } catch (error) {
    console.error("[Content] Error showing summary tooltip:", error);
  }
}

function showLoadingTooltip() {
  try {
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
    setTextContent(loadingText, "Summarizing...");
    Object.assign(loadingText.style, {
      fontSize: "16px",
      color: "#1f2937",
      fontWeight: "500",
    });

    summaryTooltip.appendChild(loadingIcon);
    summaryTooltip.appendChild(loadingText);
    document.body.appendChild(summaryTooltip);
  } catch (error) {
    console.error("[Content] Error showing loading tooltip:", error);
  }
}

function removeSummaryTooltip() {
  try {
    if (summaryTooltip) {
      summaryTooltip.remove();
      summaryTooltip = null;
    }
  } catch (error) {
    console.error("[Content] Error removing summary tooltip:", error);
  }
}

// Add keyframes for animations
try {
  const style = document.createElement("style");
  setTextContent(
    style,
    `
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
  `
  );
  document.head.appendChild(style);
} catch (error) {
  console.error("[Content] Error adding styles:", error);
}
