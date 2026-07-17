import { config } from "../config.js";

/** Shape of a single content part returned by the Gemini API. */
interface GeminiPart {
  text: string;
}

/** Shape of a Gemini API candidate response. */
interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
  };
}

/** Top-level Gemini API response envelope. */
interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

/**
 * Calls the Google Gemini 1.5 Flash API with a user prompt and system instruction.
 * Uses native fetch — no external SDK required.
 *
 * @param promptText - The user query or content prompt to generate against.
 * @param systemInstruction - Guiding context instructions that constrain the model's response.
 * @returns The generated Markdown-formatted text response.
 * @throws {Error} If the API key is missing, the request fails, or the response is malformed.
 */
export async function callGemini(
  promptText: string,
  systemInstruction: string,
): Promise<string> {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on this server.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini API request failed with code ${response.status}: ${errorBody}`,
    );
  }

  const data = (await response.json()) as GeminiResponse;
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!resultText) {
    throw new Error(
      "Invalid or empty candidates structure in Gemini API response.",
    );
  }

  return resultText;
}
