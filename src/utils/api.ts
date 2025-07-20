// API Types
export interface SummarizeRequest {
  text: string;
  summaryType: "brief" | "detailed" | "bullets";
  apiKey: string;
}

export interface SummarizeResponse {
  summary: string;
  error?: string;
}

// Error message constants
export const API_ERROR_MESSAGES = {
  API_KEY_MISSING: "❌ API key missing. Please enter it in the options page.",
  TEXT_TOO_SHORT:
    "⚠️ Please select more text to summarize (at least 10 characters).",
  INVALID_INPUT: "⚠️ Invalid input provided. Please try again.",
  UNKNOWN_ERROR: "❌ An unexpected error occurred. Please try again.",
};

// Validate input text
export function validateInput(text: string): string | null {
  if (!text || typeof text !== "string") {
    return API_ERROR_MESSAGES.INVALID_INPUT;
  }

  if (text.trim().length < 10) {
    return API_ERROR_MESSAGES.TEXT_TOO_SHORT;
  }

  return null;
}

// Get Gemini API summary
export async function getGeminiSummary(
  text: string,
  summaryType: string,
  apiKey: string,
  retryCount: number = 0
): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error(API_ERROR_MESSAGES.API_KEY_MISSING);
    }

    console.log("[API] Starting summarization request:", {
      textLength: text.length,
      summaryType,
      apiKeyPrefix: apiKey.substring(0, 10) + "...",
      retryCount,
    });

    const validationError = validateInput(text);
    if (validationError) {
      throw new Error(validationError);
    }

    // Limit text length to prevent 503 errors - more conservative approach
    const maxTextLength = 8000; // Reduced to prevent 503 errors
    if (text.length > maxTextLength) {
      console.log(
        `[API] Text too long (${text.length}), truncating to ${maxTextLength} characters`
      );
      text =
        text.substring(0, maxTextLength) +
        "\n\n[Content truncated due to length]";
    }

    const prompt = getPromptForSummaryType(text, summaryType);
    console.log("[API] Generated prompt length:", prompt.length);

    // Reduced delay for better performance
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
              maxOutputTokens: 600, // Optimized for faster responses
          },
        }),
          signal: controller.signal,
      }
    );

      clearTimeout(timeoutId);

      console.log(
        "[API] Response status:",
        response.status,
        response.statusText
      );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[API] Gemini API error:", errorData);

      if (response.status === 400) {
        throw new Error("❌ Invalid API key or request format.");
      } else if (response.status === 429) {
        throw new Error("⚠️ Rate limit exceeded. Please try again later.");
      } else if (response.status === 403) {
        throw new Error(
          "❌ API key is invalid or has insufficient permissions."
        );
      } else if (response.status === 503) {
          // Retry 503 errors up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // 1s, 2s, 4s, 8s max
          console.log(
              `[API] 503 error, retrying in ${delay}ms... (attempt ${
              retryCount + 1
            })`
          );
            await new Promise((resolve) => setTimeout(resolve, delay));
          return getGeminiSummary(text, summaryType, apiKey, retryCount + 1);
        }
        throw new Error(
            "⚠️ Gemini API is temporarily busy. Please try again in a moment or select a smaller text portion."
        );
      } else {
        throw new Error(
          `❌ API request failed (${response.status}). Please try again.`
        );
      }
    }

    const data = await response.json();
    console.log("[API] Response data received:", !!data);

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("❌ No response from AI service.");
    }

    const summary = data.candidates[0].content.parts[0].text.trim();

    if (!summary) {
      throw new Error("❌ Empty response from AI service.");
    }

    console.log(
      "[API] Summary generated successfully, length:",
      summary.length
    );
    return summary;
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new Error("⚠️ Request timed out. Please try again.");
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error("[API] Error in getGeminiSummary:", error);

    // Provide more user-friendly error messages
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "⚠️ Network error. Please check your internet connection and try again."
      );
    }

    // If it's already a formatted error message, pass it through
    if (
      error.message &&
      (error.message.includes("❌") || error.message.includes("⚠️"))
    ) {
    throw error;
    }

    // Generic error fallback
    throw new Error(
      "⚠️ Unable to generate summary. Please try again in a moment."
    );
  }
}

// Test API key validity
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    console.log("[API] Testing API key validity...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello",
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
      }
    );

    console.log("[API] Test response status:", response.status);

    if (response.status === 200) {
      console.log("[API] API key is valid");
      return true;
    } else if (response.status === 403) {
      console.log("[API] API key is invalid");
      return false;
    } else {
      console.log("[API] API key test failed with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("[API] Error testing API key:", error);
    return false;
  }
}

// Get appropriate prompt based on summary type
function getPromptForSummaryType(text: string, summaryType: string): string {
  const baseText = `Please provide a comprehensive overview of the following content: "${text}"`;

  switch (summaryType) {
    case "brief":
      return `${baseText}\n\nProvide a clear and concise overview covering the main topic, key points, and purpose of this content in 3-4 sentences.`;
    case "detailed":
      return `${baseText}\n\nProvide a comprehensive analysis covering the main points, key insights, important details, and overall significance.`;
    case "bullets":
      return `${baseText}\n\nProvide a structured summary with clear headings and bullet points. Use **Heading:** format for main sections and * **Label:** Description format for bullet points. Format it like this:\n\n**Main Topic:**\n* **Key Point:** Description of the key point\n* **Another Point:** Description of another point\n\n**Important Details:**\n* **Detail 1:** Description of detail 1\n* **Detail 2:** Description of detail 2`;
    default:
      return `${baseText}\n\nProvide a clear and concise overview covering the main topic and key points.`;
  }
}
