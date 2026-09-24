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
      fontSize: { type: SchemaType.NUMBER, description: "Font size" },
      points: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.NUMBER },
        description: "Line points [x1,y1,x2,y2,...]",
      },
    },
    required: ["type"],
  },
};

// ---------------------------------------------------------------------------
// System instruction with few-shot examples
// ---------------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `You are SyncCanvas AI — a design assistant that turns natural-language
descriptions into arrays of canvas shape objects. The frontend renders
these shapes with Konva (react-konva).

RULES:
- Return ONLY a JSON array of shape objects. No markdown, no commentary.
- Every object MUST have a "type" field. Valid types:
  Primitives: rect, circle, diamond, text, line, arrow
  Architecture nodes: server, database, client, cloud, queue, worker, internet, mobile, auth
- Use sensible x/y positions to lay shapes out so they don't overlap.
  Start near x:100, y:100 and space elements ~160px apart.
- Use dark-theme-friendly colours (dark fills, bright strokes).
- For "text" shapes always include: type, x, y, text, fill, fontSize.
- For "rect" shapes always include: type, x, y, width, height, fill, stroke, strokeWidth, dash.
- For "circle" shapes always include: type, x, y, radius, fill, stroke, strokeWidth, dash.
- For "diamond" shapes always include: type, x, y, radius, fill, stroke, strokeWidth, dash.
- For architecture nodes (server, database, client, cloud, queue, worker, internet, mobile, auth)
  always include: type, x, y, fill, stroke, strokeWidth, dash, scaleX, scaleY.
  Recommended scaleX/scaleY: 3.

FEW-SHOT EXAMPLES:

Prompt: "A login form with a submit button"
Response:
[
  {"type":"text","x":200,"y":80,"text":"Login Form","fill":"#ffffff","fontSize":28},
  {"type":"rect","x":150,"y":130,"width":200,"height":40,"fill":"#1a2332","stroke":"#5ca4f8","strokeWidth":2,"dash":[]},
  {"type":"text","x":160,"y":140,"text":"Username","fill":"#8899aa","fontSize":14},
  {"type":"rect","x":150,"y":190,"width":200,"height":40,"fill":"#1a2332","stroke":"#5ca4f8","strokeWidth":2,"dash":[]},
  {"type":"text","x":160,"y":200,"text":"Password","fill":"#8899aa","fontSize":14},
  {"type":"rect","x":150,"y":260,"width":200,"height":44,"fill":"#7c3aed","stroke":"#a78bfa","strokeWidth":2,"dash":[]},
  {"type":"text","x":215,"y":272,"text":"Submit","fill":"#ffffff","fontSize":16}
]

Prompt: "A microservices architecture with a client, API server, database, and auth service"
Response:
[
  {"type":"client","x":100,"y":200,"fill":"#262627","stroke":"#5ca4f8","strokeWidth":2,"dash":[],"scaleX":3,"scaleY":3},
  {"type":"text","x":80,"y":300,"text":"Client App","fill":"#ffffff","fontSize":16},
  {"type":"server","x":350,"y":200,"fill":"#262627","stroke":"#5ca4f8","strokeWidth":2,"dash":[],"scaleX":3,"scaleY":3},
  {"type":"text","x":330,"y":300,"text":"API Server","fill":"#ffffff","fontSize":16},
  {"type":"database","x":600,"y":200,"fill":"#262627","stroke":"#10b981","strokeWidth":2,"dash":[],"scaleX":3,"scaleY":3},
  {"type":"text","x":585,"y":300,"text":"Database","fill":"#ffffff","fontSize":16},
  {"type":"auth","x":350,"y":400,"fill":"#262627","stroke":"#f59e0b","strokeWidth":2,"dash":[],"scaleX":3,"scaleY":3},
  {"type":"text","x":330,"y":500,"text":"Auth Service","fill":"#ffffff","fontSize":16}
]

Prompt: "Three colored circles in a row"
Response:
[
  {"type":"circle","x":150,"y":200,"radius":50,"fill":"#3b1d6e","stroke":"#8b5cf6","strokeWidth":2,"dash":[]},
  {"type":"circle","x":310,"y":200,"radius":50,"fill":"#1e3a2f","stroke":"#10b981","strokeWidth":2,"dash":[]},
  {"type":"circle","x":470,"y":200,"radius":50,"fill":"#3b1520","stroke":"#ef4444","strokeWidth":2,"dash":[]}
]

Prompt: "A simple flowchart with start, process, and end"
Response:
[
  {"type":"circle","x":250,"y":100,"radius":40,"fill":"#1e3a2f","stroke":"#10b981","strokeWidth":2,"dash":[]},
  {"type":"text","x":228,"y":92,"text":"Start","fill":"#ffffff","fontSize":16},
  {"type":"rect","x":190,"y":200,"width":120,"height":60,"fill":"#20456b","stroke":"#5ca4f8","strokeWidth":2,"dash":[]},
  {"type":"text","x":215,"y":220,"text":"Process","fill":"#ffffff","fontSize":16},
  {"type":"circle","x":250,"y":360,"radius":40,"fill":"#3b1520","stroke":"#ef4444","strokeWidth":2,"dash":[]},
  {"type":"text","x":235,"y":352,"text":"End","fill":"#ffffff","fontSize":16}
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
    model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
      },
    });
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

  const result = await geminiModel.generateContent(userMessage);
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

    // 2. Call Gemini with one retry on validation failure
    let shapes;
    try {
      shapes = await callGeminiAndValidate(prompt.trim());
    } catch (firstError) {
      if (firstError.isValidationError) {
        // Retry once — send Gemini its own broken output + the error
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
          return res.status(500).json({
            error:
              "AI generation failed after retry. Your credits have been refunded.",
            details: secondError?.message || String(secondError),
          });
        }
      } else {
        // Non-validation error (network, JSON parse, etc.) — refund if spent
        if (!isAdmin) {
          await refundCredits(userId, CREDIT_COST);
        }
        console.error("AI generation failed:", firstError);
        return res.status(500).json({
          error:
            "AI generation failed. Your credits have been refunded.",
          details: firstError?.message || String(firstError),
        });
      }
    }

    // 3. Return the validated shapes
    return res.status(200).json({ shapes });
  } catch (err) {
    console.error("Unexpected error in /api/ai/generate:", err);
    return res
      .status(500)
      .json({ error: "Internal server error.", details: err.message });
  }
});

export default router;
