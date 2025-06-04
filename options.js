document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key");
  const saveButton = document.getElementById("save-button");
  const successMessage = document.getElementById("success-message");


  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (geminiApiKey) {
      apiKeyInput.value = geminiApiKey;
    }
  });

  // Save key
  saveButton.addEventListener("click", () => {
    const newKey = apiKeyInput.value.trim();
    if (newKey) {
      chrome.storage.sync.set({ geminiApiKey: newKey }, () => {
        successMessage.style.display = "block";
        setTimeout(() => {
          window.close()
        }, 1500);
      });
    }
  });
});
