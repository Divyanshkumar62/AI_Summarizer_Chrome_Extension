
export function showSummaryOverlay(summaryText) {
  const host = document.createElement("div");
  host.id = "ai-summary-overlay";
  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
      <style>
        .summary-box {
          position: fixed;
          top: 100px;
          right: 30px;
          width: 300px;
          padding: 15px;
          background: white;
          color: black;
          font-size: 14px;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
          border-radius: 8px;
          z-index: 999999;
        }
        .close-btn {
          float: right;
          cursor: pointer;
          font-weight: bold;
        }
      </style>
      <div class="summary-box">
        <div class="close-btn" id="close">×</div>
        <div>${summaryText}</div>
      </div>
    `;

  document.body.appendChild(host);
  shadow.querySelector("#close").addEventListener("click", () => {
    host.remove();
  });
}
