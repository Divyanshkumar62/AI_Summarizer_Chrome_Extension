import { showSummaryOverlay } from "./overlay";

function getArticleText(){
    const article = document.querySelector('article');
    if (article) {
        return article.innerText;
    } 

    const paragraphs = Array.from(document.querySelectorAll('p'));
    if(paragraphs.length > 0)
        return paragraphs.map((p) => p.innerText).join('\n');
    // Fallback to the entire body text if no article or paragraphs are found
    const main = document.querySelector('main');
    if (main) {
        return main.innerText;
    }
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if((req.type == "GET_ARTICLE_TEXT")){
        const text = getArticleText();
        sendResponse({ text })
    }
})

chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {

    if (!geminiApiKey) {
      resultDiv.textContent = "No API key set. Click the gear icon to add one.";
      return;
    }

    chrome.runtime.onMessage.addListener(
      async (message, _sender, sendResponse) => {
        if (message.type === "SUMMARIZE_HIGHLIGHT") {
          const text = message.selectedText;
          if (!text || text.length < 20) {
            alert("Please select a longer text snippet.");
            return;
          }
          try {
            const summary = await getGeminiSummary(text, "highlighted", geminiApiKey);
            showSummaryOverlay(summary);
          } catch (err) {
            alert("Failed to summarize: " + err.message);
          }
        }
      }
    );
})
  

async function getGeminiSummary(rawText, type, apiKey) {
  const maxChar = 20000;
  const text =
    rawText.length > maxChar ? rawText.slice(0, maxChar) + "..." : rawText;

  const promptMap = {
    brief: `Summarize in 3-5 sentences:\n\n${text}`,
    detailed: `Give a detailed and brief summary highlighting the important parts:\n\n${text}`,
    bullets: `Summarize in 7-10 or more bullet points (start each line with numbers like"(1) "):\n\n${text}`,
  };

  const prompt = promptMap[type] || promptMap.brief;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error?.message || "Request Failed");
  }

  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No Summary Available."
  );
}