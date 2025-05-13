export async function getGeminiSummary(text, type, apiKey) {

    const promptMap = {
      brief: `Summarize in 3-5 sentences:\n\n${text}`,
      detailed: `Give a detailed and brief summary highlighting the important parts:\n\n${text}`,
      bullets: `Summarize in 7-10 or more bullet points (start each line with numbers like"(1) "):\n\n${text}`,
    };
    const prompt = promptMap[type] || promptMap.brief;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();

  if (data.candidates?.[0]?.content?.parts?.[0]?.text)
    return data.candidates[0].content.parts[0].text;

  throw new Error(data.error?.message || "Unknown Gemini Error");
}
