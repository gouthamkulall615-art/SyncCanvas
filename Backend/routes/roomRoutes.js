import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import Room from "../models/Room.js";
import { ysocketio } from "../app.js";

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

const getActiveParticipantCount = (token) => {
  try {
    const doc = ysocketio?.documents?.get(token);
    if (!doc || !doc.awareness) return 0;
    const states = Array.from(doc.awareness.getStates().values());
    const activeUsers = states.filter((state) => state?.user?.username);
    return activeUsers.length;
  } catch (err) {
    console.error("Error getting active participants:", err);
    return 0;
  }
};

router.post("/create", async (req, res) => {
  try {
    let { roomName, maxParticipants } = req.body;

    if (typeof roomName !== "string" || !roomName.trim()) {
      return res.status(400).json({ error: "Room name is required." });
    }
    roomName = roomName.trim();
    if (roomName.length > 40) {
      return res
        .status(400)
        .json({ error: "Room name cannot exceed 40 characters." });
    }

    maxParticipants = Number(maxParticipants);
    if (
      !Number.isInteger(maxParticipants) ||
      maxParticipants < 2 ||
      maxParticipants > 20
    ) {
      return res
        .status(400)
        .json({ error: "Max participants must be an integer between 2 and 20." });
    }

    const token = crypto.randomBytes(24).toString("base64url");
    const pin = generatePin();
    const room = await Room.create({
      token,
      pin,
      roomName,
      maxParticipants,
    });

    res.json({
      token: room.token,
      pin,
      roomName: room.roomName,
      maxParticipants: room.maxParticipants,
    });
  } catch (err) {
    console.error("Room creation failed:", err);
    res.status(500).json({ error: "Failed to create room." });
  }
});

router.get("/:token", async (req, res) => {
  try {
    const room = await Room.findOne({ token: req.params.token });
    if (!room) return res.status(404).json({ error: "Room not found." });
    res.json({
      exists: true,
      roomName: room.roomName,
      maxParticipants: room.maxParticipants,
    });
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

    const activeCount = getActiveParticipantCount(room.token);
    if (activeCount >= room.maxParticipants) {
      return res.status(403).json({
        error: `Room is full (${activeCount}/${room.maxParticipants})`,
      });
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

    const activeCount = getActiveParticipantCount(room.token);
    if (activeCount >= room.maxParticipants) {
      return res.status(403).json({
        error: `Room is full (${activeCount}/${room.maxParticipants})`,
      });
    }

    res.json({ token: room.token });
  } catch (err) {
    res.status(500).json({ error: "Join failed." });
  }
});

export default router;
