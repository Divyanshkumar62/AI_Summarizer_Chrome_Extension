// Error message constants
const ERROR_MESSAGES = {
  API_KEY_MISSING:
    "❌ Gemini API key not set. Please enter your key in the options page.",
  API_KEY_INVALID:
    "🔐 Your API key is invalid or expired. Please update it in options.",
  RATE_LIMITED: "⏳ You've hit the usage limit. Please wait and try again.",
  NETWORK_ERROR:
    "🚫 Network error occurred. Please check your internet connection or try again later.",
  EMPTY_SUMMARY:
    "⚠️ Summary couldn't be generated. Try selecting more meaningful content or adjusting input.",
  UNKNOWN_ERROR: "❌ An unexpected error occurred. Please try again.",
  GEMINI_ERROR: "🤖 Gemini API error: ",
  INVALID_RESPONSE: "⚠️ Invalid response from Gemini API. Please try again.",
  NO_CONTENT: "⚠️ No content found to summarize. Please select more text.",
};

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 10, // requests per minute
  WINDOW_MS: 60000, // 1 minute
};

// In-memory request tracker
let requestHistory = [];

// Rate limiting function
function isRateLimited() {
  const now = Date.now();
  // Remove requests older than the window
  requestHistory = requestHistory.filter(
    (timestamp) => now - timestamp < RATE_LIMIT.WINDOW_MS
  );

  if (requestHistory.length >= RATE_LIMIT.MAX_REQUESTS) {
    return true;
  }

  requestHistory.push(now);
  return false;
}

// Validate API key format (basic check)
function isValidApiKey(apiKey) {
  return apiKey && typeof apiKey === "string" && apiKey.length > 10;
}

// Sanitize text input to prevent XSS
function sanitizeText(text) {
  if (typeof text !== "string") return "";
  return text.replace(/[<>]/g, "").trim();
}

export async function getGeminiSummary(text, type, apiKey) {
  try {
    console.log("[Summarizer] Starting summarization...", {
      type,
      textLength: text?.length,
    });

    // Input validation
    const sanitizedText = sanitizeText(text);
    if (!sanitizedText || sanitizedText.length < 10) {
      console.warn(
        "[Summarizer] Text too short or empty:",
        sanitizedText?.length
      );
      throw new Error(ERROR_MESSAGES.NO_CONTENT);
    }

    // API key validation
    if (!isValidApiKey(apiKey)) {
      console.warn(
        "[Summarizer] Invalid API key:",
        apiKey ? "Key too short" : "No key provided"
      );
      throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
    }

    // Rate limiting check
    if (isRateLimited()) {
      console.warn("[Summarizer] Rate limit exceeded");
      throw new Error(ERROR_MESSAGES.RATE_LIMITED);
    }

    const promptMap = {
      brief: `Summarize in 3-5 sentences:\n\n${sanitizedText}`,
      detailed: `Give a detailed and brief summary highlighting the important parts:\n\n${sanitizedText}`,
      bullets: `Summarize in 7-10 or more bullet points (start each line with numbers like"(1) "):\n\n${sanitizedText}`,
    };
    const prompt = promptMap[type] || promptMap.brief;

    console.log("[Summarizer] Making API request...");

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

    console.log("[Summarizer] API response status:", response.status);

    // Handle HTTP error responses
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.error("[Summarizer] Authentication error:", response.status);
        throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
      } else if (response.status === 429) {
        console.error("[Summarizer] Rate limit error:", response.status);
        throw new Error(ERROR_MESSAGES.RATE_LIMITED);
      } else {
        console.error("[Summarizer] HTTP error:", response.status);
        throw new Error(
          `${ERROR_MESSAGES.GEMINI_ERROR}HTTP ${response.status}`
        );
      }
    }

    const data = await response.json();
    console.log("[Summarizer] API response data:", data);

    // Handle Gemini API errors
    if (data.error) {
      console.error("[Summarizer] Gemini API error:", data.error);
      throw new Error(
        `${ERROR_MESSAGES.GEMINI_ERROR}${data.error.message || "Unknown error"}`
      );
    }

    // Extract and validate summary
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!summary || summary.trim().length < 15) {
      console.warn("[Summarizer] Empty or too short summary:", summary?.length);
      throw new Error(ERROR_MESSAGES.EMPTY_SUMMARY);
    }

    console.log(
      "[Summarizer] Summary generated successfully, length:",
      summary.trim().length
    );
    return summary.trim();
  } catch (error) {
    console.error("[Summarizer] Detailed error:", error);

    // Re-throw known errors
    if (Object.values(ERROR_MESSAGES).includes(error.message)) {
      throw error;
    }

    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error("[Summarizer] Network error:", error);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    // Handle JSON parsing errors
    if (error.name === "SyntaxError" && error.message.includes("JSON")) {
      console.error("[Summarizer] JSON parsing error:", error);
      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
    }

    // Handle other errors with more context
    console.error("[Summarizer] Unexpected error:", error);
    throw new Error(`${ERROR_MESSAGES.UNKNOWN_ERROR} (${error.message})`);
  }
}
