document.getElementById("summarize").addEventListener("click", () => {
    const resultDiv = document.getElementById("result");
    const summaryType = document.getElementById("summary-type").value
    
    resultDiv.innerHTML =  `<div class="loader"></div>`

    chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
        if(!geminiApiKey){
            resultDiv.textContent = "No API key set. Click the gear icon to add one."
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          chrome.tabs.sendMessage(
            tab.id,
            { type: "GET_ARTICLE_TEXT" },
            async ({ text }) => {
              if(!text){
                resultDiv.textContent = "Couldn't extract Text from this page";
                return;
              }

              try {
                const summary = await getGeminiSummary(text, summaryType, geminiApiKey);

                resultDiv.textContent = summary;
              } catch (error){
                resultDiv.textContent = "Gemini Error: " + error.message
              }
            }
          );
        });
    }); 
})

async function getGeminiSummary(rawText, type, apiKey){
    const maxChar = 20000;
    const text = rawText.length > maxChar ? rawText.slice(0, maxChar) + "..." : rawText;

    const promptMap = {
        brief: `Summarize in 3-5 sentences:\n\n${text}`,
        detailed: `Give a detailed and brief summary highlighting the important parts:\n\n${text}`,
        bullets: `Summarize in 7-10 or more bullet points (start each line with numbers like"(1) "):\n\n${text}`,
    }

    const prompt = promptMap[type] || promptMap.brief;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
        }),
      }
    );
    if(!res.ok){
        const { error } = await res.json();
        throw new Error(error?.message || "Request Failed")
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No Summary Available."
}

document.getElementById("copy-btn").addEventListener("click", () => {
    const txt = document.getElementById("result").innerText;
    if(!txt)
        return;

    navigator.clipboard.writeText(txt).then(() => {
        const btn = document.getElementById("copy-btn");
        const old = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = old), 2000)
    })
})