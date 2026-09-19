import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },

  pin: { type: String, required: true, index: true },

  attempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expires: 0 },
  },
});

export default mongoose.model("Room", roomSchema);
