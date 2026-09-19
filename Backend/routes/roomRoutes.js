import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import Room from "../models/Room.js"; // adjust path to wherever you place the model

const router = express.Router();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

const pinJoinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

const generatePin = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

router.post("/create", async (req, res) => {
  try {
    const token = crypto.randomBytes(24).toString("base64url");
    const pin = generatePin();
    const room = await Room.create({ token, pin });
    res.json({ token: room.token, pin });
  } catch (err) {
    console.error("Room creation failed:", err);
    res.status(500).json({ error: "Failed to create room." });
  }
});

router.get("/:token", async (req, res) => {
  try {
    const room = await Room.findOne({ token: req.params.token });
    if (!room) return res.status(404).json({ error: "Room not found." });
    res.json({ exists: true });
  } catch (err) {
    res.status(500).json({ error: "Lookup failed." });
  }
});

router.post("/:token/verify", async (req, res) => {
  try {
    const { pin } = req.body;
    const room = await Room.findOne({ token: req.params.token });
    if (!room) return res.status(404).json({ error: "Room not found." });

    if (room.lockedUntil && room.lockedUntil > new Date()) {
      return res
        .status(429)
        .json({ error: "Too many attempts. Try again later." });
    }

    if (room.pin !== pin) {
      room.attempts += 1;
      if (room.attempts >= MAX_ATTEMPTS) {
        room.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        room.attempts = 0;
      }
      await room.save();
      return res.status(401).json({ error: "Incorrect PIN." });
    }

    room.attempts = 0;
    room.lockedUntil = null;
    await room.save();
    res.json({ ok: true, token: room.token });
  } catch (err) {
    console.error("Verify failed:", err);
    res.status(500).json({ error: "Verification failed." });
  }
});

router.post("/join-by-pin", pinJoinLimiter, async (req, res) => {
  try {
    const { pin } = req.body;
    const room = await Room.findOne({ pin });
    if (!room) return res.status(401).json({ error: "Invalid PIN." });
    res.json({ token: room.token });
  } catch (err) {
    res.status(500).json({ error: "Join failed." });
  }
});

export default router;
