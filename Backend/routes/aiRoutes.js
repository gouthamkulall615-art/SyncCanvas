import express from "express";
import rateLimit from "express-rate-limit";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import { protect } from "../middlewares/authMiddleware.js";
import {
  spendCredits,
  refundCredits,
  InsufficientCreditsError,
} from "../utils/credits.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CREDIT_COST = 10; // credits consumed per generation

// Rate limiters — express-rate-limit defaults to keying by IP (req.ip).
// Since protect runs first, we dispatch to a more generous limit for admins during testing.
const userAiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Try again in a few minutes." },
});

const adminAiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // generous limit for testing (60 req / 10 min)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Try again in a few minutes." },
});

const aiLimiter = (req, res, next) => {
  if (req.user?.role === "admin") {
    return adminAiLimiter(req, res, next);
  }
  return userAiLimiter(req, res, next);
};

// ---------------------------------------------------------------------------
// Shape types recognised by CanvasBoard
// ---------------------------------------------------------------------------
const PRIMITIVE_TYPES = ["rect", "circle", "diamond", "text", "line", "arrow"];
const ARCHITECTURE_TYPES = [
  "server",
  "database",
  "client",
  "cloud",
  "queue",
  "worker",
  "internet",
  "mobile",
  "auth",
];
const ALL_SHAPE_TYPES = [...PRIMITIVE_TYPES, ...ARCHITECTURE_TYPES];

// ---------------------------------------------------------------------------
// Zod validation schema — mirrors exactly what shapesMap expects
// ---------------------------------------------------------------------------
const shapeSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(ALL_SHAPE_TYPES),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    radius: z.number().optional(),
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional(),
    dash: z.array(z.number()).optional(),
    scaleX: z.number().optional(),
    scaleY: z.number().optional(),
    opacity: z.number().optional(),
    // text-specific
    label: z.string().optional(),
    text: z.string().optional(),
    fontSize: z.number().optional(),
    // line-specific
    points: z.array(z.number()).optional(),
    // arrow-specific
    startId: z.string().optional(),
    endId: z.string().nullable().optional(),
    endX: z.number().optional(),
    endY: z.number().optional(),
  })
  .passthrough();

const shapesArraySchema = z.array(shapeSchema).min(1).max(50);

// ---------------------------------------------------------------------------
// Gemini response schema (for structured output)
// ---------------------------------------------------------------------------
const geminiResponseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      type: {
        type: SchemaType.STRING,
        enum: ALL_SHAPE_TYPES,
        description: "Shape type",
      },
      x: { type: SchemaType.NUMBER, description: "X position" },
      y: { type: SchemaType.NUMBER, description: "Y position" },
      width: { type: SchemaType.NUMBER, description: "Width (rect only)" },
      height: { type: SchemaType.NUMBER, description: "Height (rect only)" },
      radius: {
        type: SchemaType.NUMBER,
        description: "Radius (circle/diamond only)",
      },
      fill: { type: SchemaType.STRING, description: "Fill colour hex" },
      stroke: { type: SchemaType.STRING, description: "Stroke colour hex" },
      strokeWidth: { type: SchemaType.NUMBER, description: "Stroke width" },
      dash: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.NUMBER },
        description: "Dash pattern",
      },
      scaleX: { type: SchemaType.NUMBER, description: "X scale factor" },
      scaleY: { type: SchemaType.NUMBER, description: "Y scale factor" },
      opacity: { type: SchemaType.NUMBER, description: "Opacity 0-1" },
      text: { type: SchemaType.STRING, description: "Text content" },
      label: { type: SchemaType.STRING, description: "Label for architecture node" },
      fontSize: { type: SchemaType.NUMBER, description: "Font size" },
      points: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.NUMBER },
        description: "Line points [x1,y1,x2,y2,...]",
      },
      id: {
        type: SchemaType.STRING,
        description: "Identifier for shape referencing in connections",
      },
      startId: {
        type: SchemaType.STRING,
        description: "ID of source node for arrow connection",
      },
      endId: {
        type: SchemaType.STRING,
        description: "ID of target node for arrow connection",
      },
    },
    required: ["type"],
  },
};

// ---------------------------------------------------------------------------
// System instruction with few-shot examples
// ---------------------------------------------------------------------------
// System instruction with one concise few-shot example
// ---------------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `You are SyncCanvas AI — a design assistant that converts natural-language descriptions into arrays of Konva canvas shape objects.

RULES:
- Return ONLY a JSON array of shape objects. No markdown, no commentary.
- Every object MUST have a "type" field. Valid types:
  Primitives: rect, circle, diamond, text, line, arrow
  Architecture nodes: server, database, client, cloud, queue, worker, internet, mobile, auth
- Layout: Start near x:100, y:100. Space elements ~180px apart to prevent overlap.
- Theme: Dark fills with bright, contrasting strokes (e.g., #5ca4f8, #10b981, #f59e0b).
- Shapes must include appropriate fields:
  * rect: type, x, y, width, height, fill, stroke, strokeWidth, dash
  * circle/diamond: type, x, y, radius, fill, stroke, strokeWidth, dash
  * text: type, x, y, text, fill, fontSize
  * architecture nodes: id, type, x, y, label, fill, stroke, strokeWidth, dash, scaleX:3, scaleY:3
  * arrow: type, startId, endId, stroke, strokeWidth
- Connections: Give every connected node an "id" (e.g. "client", "auth", "db"). Always connect related nodes logically using arrows with "startId" and "endId".

EXAMPLE:
Prompt: "Client sending requests to auth service and database"
Response:
[
  {"id":"client","type":"client","x":120,"y":200,"label":"Client / User","fill":"#262627","stroke":"#5ca4f8","strokeWidth":2,"dash":[],"scaleX":3,"scaleY":3},
  {"id":"auth","type":"auth","x":340,"y":200,"label":"Auth Service","fill":"#262627","stroke":"#f59e0b","strokeWidth":2,"dash":[],"scaleX":3,"scaleY":3},
  {"id":"db","type":"database","x":560,"y":200,"label":"User Database","fill":"#262627","stroke":"#10b981","strokeWidth":2,"dash":[],"scaleX":3,"scaleY":3},
  {"type":"arrow","startId":"client","endId":"auth","stroke":"#5ca4f8","strokeWidth":2},
  {"type":"arrow","startId":"auth","endId":"db","stroke":"#f59e0b","strokeWidth":2}
]`;

// ---------------------------------------------------------------------------
// Gemini client (lazy-initialised)
// ---------------------------------------------------------------------------
let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      throw new Error(
        "GEMINI_API_KEY is not set or is still the placeholder (set GEMINI_API_KEY in Render dashboard under Environment Variables)",
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel(
      {
        model: "gemini-3.8-flash",
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: "application/json",
        },
      },
      { timeout: 40000 },
    );
  }
  return model;
}

// ---------------------------------------------------------------------------
// Helper: call Gemini and validate
// ---------------------------------------------------------------------------
async function callGeminiAndValidate(prompt, retryContext = null) {
  const geminiModel = getModel();

  const userMessage = retryContext
    ? `The previous response had validation errors. Here is the broken output:\n\n${retryContext.brokenOutput}\n\nValidation error:\n${retryContext.validationError}\n\nPlease fix ONLY the validation issues and return a corrected JSON array of shapes for this original prompt: "${prompt}"`
    : prompt;

  console.log("[AI] Calling Gemini model: gemini-3.5-flash-lite");
  const startTime = Date.now();
  const result = await geminiModel.generateContent(userMessage);
  console.log(`[AI] Gemini responded in ${Date.now() - startTime}ms`);
  const responseText = result.response.text();

  // Parse the JSON
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${responseText.slice(0, 200)}`);
  }

  // Validate with Zod
  const validation = shapesArraySchema.safeParse(parsed);
  if (!validation.success) {
    const errorMessage = validation.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw {
      isValidationError: true,
      brokenOutput: responseText,
      validationError: errorMessage,
    };
  }

  return validation.data;
}

// ---------------------------------------------------------------------------
// POST /api/ai/generate
// ---------------------------------------------------------------------------
router.post("/generate", protect, aiLimiter, async (req, res) => {
  console.log("[AI] Request received", new Date().toISOString());
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "A prompt is required." });
    }

    if (prompt.length > 2000) {
      return res
        .status(400)
        .json({ error: "Prompt must be under 2000 characters." });
    }

    // 1. Spend credits BEFORE calling Gemini (admins bypass credit deduction)
    const userId = req.user._id;
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin) {
      try {
        await spendCredits(userId, CREDIT_COST);
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          return res.status(402).json({
            error: "Insufficient credits.",
            required: CREDIT_COST,
            available: err.available,
          });
        }
        throw err;
      }
    }

    const isTimeoutError = (err) =>
      err?.name === "AbortError" ||
      err?.name === "TimeoutError" ||
      /abort|timeout/i.test(err?.message || "");

    // 2. Call Gemini with one retry on validation failure
    let shapes;
    try {
      shapes = await callGeminiAndValidate(prompt.trim());
    } catch (firstError) {
      if (firstError.isValidationError) {
        // Retry once only for schema validation errors
        try {
          shapes = await callGeminiAndValidate(prompt.trim(), {
            brokenOutput: firstError.brokenOutput,
            validationError: firstError.validationError,
          });
        } catch (secondError) {
          // Both attempts failed — refund credits if spent
          if (!isAdmin) {
            await refundCredits(userId, CREDIT_COST);
          }
          console.error("AI generation failed after retry:", secondError);
          const isTimeout = isTimeoutError(secondError);
          return res.status(isTimeout ? 504 : 500).json({
            error: isTimeout
              ? "AI generation timed out after retry. Your credits have been refunded."
              : "AI generation failed after retry. Your credits have been refunded.",
          });
        }
      } else {
        // Non-validation error (timeout, network, parse error) — do NOT retry, refund credits immediately
        if (!isAdmin) {
          await refundCredits(userId, CREDIT_COST);
        }
        console.error("AI generation failed:", firstError);
        const isTimeout = isTimeoutError(firstError);
        return res.status(isTimeout ? 504 : 500).json({
          error: isTimeout
            ? "AI generation timed out. Your credits have been refunded."
            : "AI generation failed. Your credits have been refunded.",
        });
      }
    }

    // 3. Return the validated shapes
    return res.status(200).json({ shapes });
  } catch (err) {
    console.error("Unexpected error in /api/ai/generate:", err);
    return res
      .status(500)
      .json({ error: "Internal server error." });
  }
});

export default router;
