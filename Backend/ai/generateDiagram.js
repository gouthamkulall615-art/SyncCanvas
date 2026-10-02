import { diagramSchema } from "./diagramSchema.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./systemPrompt.js";

// Pull the JSON object out of the text even if the model adds fences or chatter.
function extractJson(text) {
  const cleaned = String(text).replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object found");
  return cleaned.slice(start, end + 1);
}

/**
 * llm: async (systemPrompt: string, userPrompt: string) => string
 *   Wrap Gemini / Claude / any provider in this one function shape.
 *   That keeps the provider swappable with a config change.
 *
 * Returns { ok: true, diagram } or { ok: false, error }.
 * If ok is false, refund the user's credit.
 */
export async function generateDiagram(llm, userText) {
  const basePrompt = buildUserPrompt(userText);
  let prompt = basePrompt;
  let lastError = "unknown error";

  for (let attempt = 0; attempt < 2; attempt++) {
    let raw;
    try {
      raw = await llm(SYSTEM_PROMPT, prompt);
    } catch (e) {
      return { ok: false, error: `LLM call failed: ${e.message}` };
    }

    try {
      const parsed = JSON.parse(extractJson(raw));
      const result = diagramSchema.safeParse(parsed);
      if (result.success) return { ok: true, diagram: result.data };

      lastError = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
    } catch (e) {
      lastError = `Invalid JSON: ${e.message}`;
    }

    // One repair retry: tell the model exactly what was wrong.
    prompt = `${basePrompt}\n\nYour previous answer was rejected: ${lastError}\nReturn the corrected JSON object only.`;
  }

  return { ok: false, error: lastError };
}
