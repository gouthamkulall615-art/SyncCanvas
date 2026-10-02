import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .config.env if GEMINI_API_KEY is not already in process.env
if (!process.env.GEMINI_API_KEY) {
  dotenv.config({ path: path.resolve(__dirname, "../.config.env") });
}

const DEFAULT_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

export function createGeminiLlm({
  apiKey = process.env.GEMINI_API_KEY,
  modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
  timeout = 60000,
} = {}) {
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Please set it in .config.env or environment variables."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return async function geminiLlm(systemPrompt, userPrompt) {
    const candidateModels = Array.from(new Set([modelName, ...DEFAULT_MODELS]));
    let lastErr;

    for (const currentModel of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel(
            {
              model: currentModel,
              systemInstruction: systemPrompt,
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            },
            { timeout }
          );

          const result = await model.generateContent(userPrompt);
          const response = await result.response;
          return response.text();
        } catch (err) {
          lastErr = err;
          const isTransient =
            err.status === 503 ||
            err.status === 429 ||
            err.message?.includes("503") ||
            err.message?.includes("high demand");

          if (isTransient && attempt === 0) {
            // Wait 1.5s before retry
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }

          // If not transient or second attempt failed, try fallback model
          break;
        }
      }
    }

    console.error("[Gemini Error Full Details]:", {
      message: lastErr.message,
      status: lastErr.status,
      statusText: lastErr.statusText,
      errorDetails: lastErr.errorDetails,
      stack: lastErr.stack,
    });
    throw lastErr;
  };
}
