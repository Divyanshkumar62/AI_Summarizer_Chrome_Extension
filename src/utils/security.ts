// Security utilities for API key management and validation

// API key validation patterns
export const API_KEY_PATTERNS = {
  GEMINI: /^AIza[0-9-Za-z-_]{10,}$/, // Very flexible Gemini API key pattern
};

// API key validation function
export function validateApiKey(
  apiKey: string,
  type: "gemini" = "gemini"
): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  const trimmedKey = apiKey.trim();

  if (trimmedKey.length === 0) {
    return false;
  }

  switch (type) {
    case "gemini": {
      // Very lenient validation - just check if it's a reasonable length and starts with AIza
      return trimmedKey.length >= 10 && trimmedKey.startsWith("AIza");
    }
    default:
      return false;
  }
}

// Sanitize API key for logging (show only first and last 4 characters)
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return "INVALID";
  }

  const first = apiKey.substring(0, 4);
  const last = apiKey.substring(apiKey.length - 4);
  return `${first}...${last}`;
}

// Simple encryption for API key storage (basic obfuscation)
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return "";

  try {
    // Simple base64coding with a salt
    const salt = "SmartDigest_";
    const encoded = btoa(salt + apiKey);
    return encoded;
  } catch (error) {
    console.error("[Security] Encryption failed:", error);
    return "";
  }
}

// Decrypt API key from storage
export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return "";
  try {
    const decoded = atob(encryptedKey);
    const salt = "SmartDigest_";

    if (decoded.startsWith(salt)) {
      return decoded.substring(salt.length);
    }

    return "";
  } catch (error) {
    console.error("[Security] Decryption failed:", error);
    return "";
  }
}

// Secure API key storage
export async function storeApiKeySecurely(apiKey: string): Promise<void> {
  try {
    // Basic validation - just ensure it's a non-empty string
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      throw new Error("API key is required");
    }

    const encryptedKey = encryptApiKey(apiKey);
    await chrome.storage.sync.set({
      geminiApiKey: encryptedKey,
      apiKeyLastUpdated: Date.now(),
    });

    console.log("[Security] API key stored securely");
  } catch (error) {
    console.error("[Security] Failed to store API key:", error);
    throw error;
  }
}

// Retrieve API key securely
export async function retrieveApiKeySecurely(): Promise<string> {
  try {
    const { geminiApiKey } = await chrome.storage.sync.get(["geminiApiKey"]);

    if (!geminiApiKey) {
      return "";
    }

    const decryptedKey = decryptApiKey(geminiApiKey);

    return decryptedKey;
  } catch (error) {
    console.error("[Security] Failed to retrieve API key:", error);
    return "";
  }
}

// Clear API key from storage
export async function clearApiKey(): Promise<void> {
  try {
    await chrome.storage.sync.remove(["geminiApiKey", "apiKeyLastUpdated"]);
    console.log("[Security] API key cleared from storage");
  } catch (error) {
    console.error("[Security] Failed to clear API key:", error);
    throw error;
  }
}

// Check if API key exists and is valid
export async function hasValidApiKey(): Promise<boolean> {
  try {
    const apiKey = await retrieveApiKeySecurely();
    return validateApiKey(apiKey);
  } catch (error) {
    console.error("[Security] Error checking API key validity:", error);
    return false;
  }
}

// Input sanitization for user inputs
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol
    .trim();
}

// Validate and sanitize text for summarization
export function validateSummarizationText(text: string): {
  isValid: boolean;
  sanitizedText: string;
  error?: string;
} {
  if (!text || typeof text !== "string") {
    return {
      isValid: false,
      sanitizedText: "",
      error: "Invalid input provided",
    };
  }

  const sanitized = sanitizeInput(text);

  if (sanitized.length < 10) {
    return {
      isValid: false,
      sanitizedText: sanitized,
      error: "Text must be at least 10 characters long",
    };
  }

  if (sanitized.length > 50000) {
    return {
      isValid: false,
      sanitizedText: sanitized,
      error: "Text is too long (maximum 50,000 characters)",
    };
  }

  return {
    isValid: true,
    sanitizedText: sanitized,
  };
}

// Content Security Policy validation
export function validateCSP(csp: string): boolean {
  const allowedDirectives = [
    "script-src",
    "object-src",
    "style-src",
    "img-src",
    "connect-src",
  ];

  const directives = csp.split(";").map((d) => d.trim());

  for (const directive of directives) {
    const [name] = directive.split(" ");
    if (name && !allowedDirectives.includes(name)) {
      return false;
    }
  }

  return true;
}

// Secure random string generation
export function generateSecureId(length: number = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

// Rate limiting identifier generation
export function generateRateLimitId(userId?: string): string {
  const timestamp = Math.floor(Date.now() / 60000); // 1 minute windows
  return userId ? `${userId}_${timestamp}` : `anonymous_${timestamp}`;
}
