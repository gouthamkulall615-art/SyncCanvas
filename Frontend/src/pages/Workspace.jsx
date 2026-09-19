import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import CanvasBoard from "../components/canvas/CanvasBoard";
import api from "../api/axios";

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
  const { token } = useParams();

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

  // --- PIN GATE ---
  // The host who just generated this link skips the gate (sessionStorage flag
  // set by WorkspaceCards.jsx at creation time). Everyone else — including
  // the host on a refresh — has to prove they know the pin before we ever
  // open a Yjs/socket connection. This is the check that was missing before:
  // previously the token in the URL was treated as sufficient on its own.
  const [verified, setVerified] = useState(
    () => sessionStorage.getItem(`host:${token}`) === "true",
  );
  const [pinInput, setPinInput] = useState(["", "", "", "", "", ""]);
  const [gateError, setGateError] = useState(null);
  const [checking, setChecking] = useState(false);

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...pinInput];
    next[index] = value.slice(-1);
    setPinInput(next);
    setGateError(null);
    if (value && index < 5) {
      document.getElementById(`gate-pin-${index + 1}`)?.focus();
    }
  };

  const handleGateKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pinInput[index] && index > 0) {
      document.getElementById(`gate-pin-${index - 1}`)?.focus();
    }
  };

  const handleVerifyPin = async () => {
    const fullPin = pinInput.join("");
    if (fullPin.length !== 6) return;
    setChecking(true);
    setGateError(null);
    try {
      await api.post(`/rooms/${token}/verify`, { pin: fullPin });
      sessionStorage.setItem(`host:${token}`, "true");
      setVerified(true);
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        setGateError("This room doesn't exist or has expired.");
      } else if (status === 429) {
        setGateError("Too many attempts. Try again in a few minutes.");
      } else {
        setGateError("Incorrect PIN.");
      }
      setPinInput(["", "", "", "", "", ""]);
      document.getElementById("gate-pin-0")?.focus();
    } finally {
      setChecking(false);
    }
  };

  const ydoc = useMemo(() => new Y.Doc(), []);
  const shapesMap = useMemo(() => ydoc.getMap("shapes"), [ydoc]);

  const undoManager = useMemo(() => new Y.UndoManager(shapesMap), [shapesMap]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    // Only open the collaboration session once the pin has actually been
    // verified (or the host flag was already set) — this is the gate that
    // was missing before.
    if (!user || !token || !verified) return;

    const myUsername = user.name || user.username || "Peer";

    const backendUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : "http://localhost:5000";

    // The token is now what identifies the Yjs/socket room, in place of the
    // old pin — a nice side effect of this change is that the room name
    // peers actually connect to is the long opaque token, not the guessable
    // 6-digit pin.
    const provider = new SocketIOProvider(backendUrl, token, ydoc, {
      autoConnect: true,
    });

    const updateUsers = () => {
      // 1. Grab everyone currently in the Yjs network
      const states = Array.from(provider.awareness.getStates().entries());

      // 2. Filter out ONLY the remote users (ignoring our own network echo)
      const remoteUsers = states
        .filter(
          ([clientId, state]) =>
            clientId !== provider.awareness.clientID && state?.user?.username,
        )
        .map(([clientId, state]) => ({ clientId, ...state.user }));

      // 3. Optimistic UI: Always hardcode our own local profile at the start of the array
      setUsers([
        {
          clientId: provider.awareness.clientID || "local",
          username: myUsername,
          color: userColor,
        },
        ...remoteUsers,
      ]);
    };

    const injectPresence = () => {
      const currentState = provider.awareness.getLocalState();
      provider.awareness.setLocalStateField("user", {
        username: myUsername,
        color: userColor,
        cursor: currentState?.user?.cursor || null,
      });
    };

    injectPresence();
    updateUsers();

    // Listen for both network changes and awareness updates
    provider.awareness.on("change", updateUsers);
    provider.awareness.on("update", updateUsers);

    const heartbeatInterval = setInterval(injectPresence, 10000);

    setAwareness(provider.awareness);

    const handleBeforeUnload = () =>
      provider.awareness.setLocalStateField("user", null);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      provider.awareness.off("change", updateUsers);
      provider.awareness.off("update", updateUsers);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      provider.awareness.setLocalStateField("user", null);
      provider.disconnect();
      provider.destroy();
      setUsers([]);
      setAwareness(null);
    };
  }, [user, ydoc, token, userColor, verified]);

  if (!user) return null;

  // --- PIN GATE UI ---
  if (!verified) {
    return (
      <main className="h-screen w-full bg-[#0e1116] flex items-center justify-center font-sans">
        <div className="bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <h1 className="text-lg font-bold text-white mb-1">Enter Room PIN</h1>
          <p className="text-sm text-zinc-400 mb-6">
            This workspace is protected. Enter the 6-digit PIN the host shared
            with you.
          </p>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500">
              PIN
            </span>
            {gateError && (
              <span className="text-[10px] font-medium text-red-400">
                {gateError}
              </span>
            )}
          </div>
          <div className="grid grid-cols-6 gap-2 mb-6">
            {pinInput.map((digit, index) => (
              <input
                key={index}
                id={`gate-pin-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleGateKeyDown(index, e)}
                placeholder="•"
                className={`w-full h-12 text-center text-lg font-mono font-bold rounded-xl bg-[#06080c] border transition-all duration-150 text-white placeholder-zinc-700 outline-none ${
                  gateError
                    ? "border-red-500/70 ring-1 ring-red-500/30"
                    : digit
                      ? "border-purple-500 ring-1 ring-purple-500/40 bg-purple-950/10"
                      : "border-zinc-800 focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/40"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleVerifyPin}
            disabled={pinInput.join("").length !== 6 || checking}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium text-sm transition-all duration-200"
          >
            {checking ? "Checking..." : "Enter Workspace"}
          </button>
        </div>
      </main>
    );
  }

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
        <CanvasBoard
          shapesMap={shapesMap}
          awareness={awareness}
          undoManager={undoManager}
        />
      </section>
    </main>
  );
}
