import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import CanvasBoard from "../components/CanvasBoard";

const CURSOR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export default function Workspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("pin");

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const userColor = useMemo(
    () => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)],
    [],
  );

  const [users, setUsers] = useState([]);
  const [awareness, setAwareness] = useState(null);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const shapesMap = useMemo(() => ydoc.getMap("shapes"), [ydoc]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !roomId) return;

    const myUsername = user.name || user.username || "Peer";

    const provider = new SocketIOProvider(
      "http://localhost:5000",
      roomId,
      ydoc,
      { autoConnect: true },
    );

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().entries());
      setUsers(
        states
          .filter(([, state]) => state?.user?.username)
          .map(([clientId, state]) => ({ clientId, ...state.user })),
      );
    };

    // Initialize local state
    provider.awareness.setLocalStateField("user", {
      username: myUsername,
      color: userColor,
      cursor: null,
    });

    updateUsers();
    provider.awareness.on("change", updateUsers);

    // FIXED HEARTBEAT: Instead of overwriting local state,
    // we safely touch a dummy timestamp field to keep the connection alive.
    const heartbeatInterval = setInterval(() => {
      provider.awareness.setLocalStateField("lastActive", Date.now());
    }, 15000);

    setAwareness(provider.awareness);

    const handleBeforeUnload = () =>
      provider.awareness.setLocalStateField("user", null);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      provider.awareness.off("change", updateUsers);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      provider.awareness.setLocalStateField("user", null);
      provider.disconnect();
      provider.destroy();
      setUsers([]);
      setAwareness(null);
    };
  }, [user, ydoc, roomId, userColor]);

  if (!user) return null;

  return (
    <main className="h-screen w-full bg-[#0e1116] flex overflow-hidden font-sans relative select-none">
      <div className="absolute top-6 left-6 z-50 bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 w-60 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]">
            S
          </div>
          <h1 className="text-sm font-bold tracking-wide text-white">
            SyncCanvas
          </h1>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            {users.length} Active Now
          </span>
        </div>

        <div className="flex items-center -space-x-2 pl-1">
          {users.map((u) => (
            <div
              key={u.clientId}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#1a1d24] shadow-sm"
              style={{ backgroundColor: u.color }}
              title={u.username}
            >
              {u.username.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      <section className="flex-1 w-full h-full relative">
        <CanvasBoard shapesMap={shapesMap} awareness={awareness} />
      </section>
    </main>
  );
}
