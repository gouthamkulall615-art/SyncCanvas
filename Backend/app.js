import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { removeAwarenessStates } from "y-protocols/awareness";
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

// Real-time peer presence & immediate leave synchronization
ysocketio.nsp.on("connection", (socket) => {
  const roomToken = socket.nsp.name.replace(/\/yjs\|/, "");

  socket.on("client-presence", ({ username, clientId }) => {
    socket.data.username = username;
    socket.data.clientId = clientId;
    socket.data.roomToken = roomToken;
    socket.broadcast.emit("peer-presence-join", { username, clientId });
  });

  const handlePeerLeave = () => {
    const { username, clientId } = socket.data || {};
    if (clientId) {
      try {
        const doc = ysocketio.documents.get(roomToken);
        if (doc && doc.awareness) {
          removeAwarenessStates(doc.awareness, [clientId], "disconnect");
        }
      } catch (err) {
        console.error("Error removing awareness state:", err);
      }
    }
    if (username) {
      socket.broadcast.emit("peer-presence-leave", { username, clientId });
    }
  };

  socket.on("client-leave", handlePeerLeave);
  socket.on("disconnect", handlePeerLeave);
});

// 2. Basic Connection Logging (Optional, just for your terminal)
io.on("connection", (socket) => {
  console.log("Socket connected successfully", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
  });
});

export { app, httpServer, ysocketio };
