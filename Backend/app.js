import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://sync-canvas-three.vercel.app"],
    credentials: true,
  }),
);
app.use(express.static("public"));
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// 1. Initialize Yjs
// This single block replaces all manual room joining, peer tracking, and code syncing.
const ysocketio = new YSocketIO(io);
ysocketio.initialize();

// 2. Basic Connection Logging (Optional, just for your terminal)
io.on("connection", (socket) => {
  console.log("Socket connected successfully", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
  });
});

export { app, httpServer };
