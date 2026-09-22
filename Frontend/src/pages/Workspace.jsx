import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import CanvasBoard from "../components/canvas/CanvasBoard";
import CodeSlots from "../components/ReactBits/CodeSlots";
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
    () =>
      localStorage.getItem("userColor") ||
      CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)],
    [],
  );

  const [users, setUsers] = useState([]);
  const [awareness, setAwareness] = useState(null);

  const usersRef = useRef(users);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const isExplicitlyLeavingRef = useRef(false);

  const handleConfirmLeave = () => {
    isExplicitlyLeavingRef.current = true;
    navigate("/dashboard");
  };

  // --- PIN GATE ---
  // The host who just generated this link skips the gate (sessionStorage flag
  // set by WorkspaceCards.jsx at creation time). Everyone else — including
  // the host on a refresh — has to prove they know the pin before we ever
  // open a Yjs/socket connection. This is the check that was missing before:
  // previously the token in the URL was treated as sufficient on its own.
  const [verified, setVerified] = useState(
    () =>
      sessionStorage.getItem(`host:${token}`) === "true" ||
      sessionStorage.getItem(`verified:${token}`) === "true",
  );
  const [pinInput, setPinInput] = useState("");
  const [codeStatus, setCodeStatus] = useState("idle"); // "idle" | "error" | "success"
  const [gateError, setGateError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [roomInfo, setRoomInfo] = useState({ roomName: "", maxParticipants: 6 });
  const [roomNotFound, setRoomNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchRoomInfo = async () => {
      try {
        const res = await api.get(`/rooms/${token}`);
        if (res.data) {
          setRoomInfo({
            roomName: res.data.roomName || "SyncCanvas",
            maxParticipants: res.data.maxParticipants || 6,
          });
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setRoomNotFound(true);
        }
      }
    };
    fetchRoomInfo();
  }, [token]);

  const handleVerifyPin = async (overridePin) => {
    const fullPin = typeof overridePin === "string" ? overridePin : pinInput;
    if (fullPin.length !== 6) return;
    setChecking(true);
    setGateError(null);
    try {
      await api.post(`/rooms/${token}/verify`, { pin: fullPin });
      setCodeStatus("success");
      sessionStorage.setItem(`host:${token}`, "true");
      sessionStorage.setItem(`verified:${token}`, "true");
      setTimeout(() => {
        setVerified(true);
      }, 700);
    } catch (error) {
      setCodeStatus("error");
      const status = error.response?.status;
      if (status === 403) {
        setGateError(error.response?.data?.error || "Room is full.");
      } else if (status === 404) {
        setGateError("This room doesn't exist or has expired.");
      } else if (status === 429) {
        setGateError("Too many attempts. Try again in a few minutes.");
      } else {
        setGateError(error.response?.data?.error || "Incorrect PIN.");
      }
      setPinInput("");
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

    const handleBeforeUnload = (e) => {
      if (isExplicitlyLeavingRef.current) {
        try {
          provider?.awareness?.setLocalStateField("user", null);
        } catch (_) {}
        return;
      }
      // If 2 or more members are collaborating, trigger browser exit confirmation
      if (usersRef.current && usersRef.current.length >= 2) {
        e = e || window.event;
        if (e) {
          e.preventDefault();
          e.returnValue = "You have an active collaboration session. Are you sure you want to leave?";
        }
        return "You have an active collaboration session. Are you sure you want to leave?";
      }
      try {
        provider?.awareness?.setLocalStateField("user", null);
      } catch (_) {}
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.onbeforeunload = handleBeforeUnload;

    return () => {
      clearInterval(heartbeatInterval);
      provider.awareness.off("change", updateUsers);
      provider.awareness.off("update", updateUsers);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.onbeforeunload = null;
      provider.awareness.setLocalStateField("user", null);
      provider.disconnect();
      provider.destroy();
      setUsers([]);
      setAwareness(null);
    };
  }, [user, ydoc, token, userColor, verified]);

  if (!user) return null;

  // --- ROOM NOT FOUND UI ---
  if (roomNotFound) {
    return (
      <main className="h-screen w-full bg-[#0e1116] flex items-center justify-center font-sans">
        <div className="bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
          <h1 className="text-lg font-bold text-white mb-2">Room Not Found</h1>
          <p className="text-sm text-zinc-400 mb-6">
            This workspace does not exist or has expired after 24 hours.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all duration-200"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    );
  }

  // --- PIN GATE UI ---
  if (!verified) {
    return (
      <main className="h-screen w-full bg-[#0e1116] flex items-center justify-center font-sans">
        <div className="bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <h1 className="text-lg font-bold text-white mb-1">
            {roomInfo.roomName ? `Join "${roomInfo.roomName}"` : "Enter Room PIN"}
          </h1>
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
          <div className="flex justify-center mb-6">
            <CodeSlots
              length={6}
              value={pinInput}
              status={codeStatus}
              onChange={(code) => {
                setPinInput(code);
                setCodeStatus("idle");
                setGateError(null);
              }}
              onComplete={(code) => {
                handleVerifyPin(code);
              }}
              accentColor="#9333ea"
              inkColor="#c084fc"
              slotColor="#06080c"
              digitColor="#ffffff"
              dangerColor="#ef4444"
              slotSize={44}
              gap={8}
              radius={12}
              bounce={0.2}
              settle={0.3}
              rise={8}
              cascade={20}
              autoFocus={true}
              caret={false}
            />
          </div>

          <button
            type="button"
            onClick={() => handleVerifyPin()}
            disabled={pinInput.length !== 6 || checking || codeStatus === "success"}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium text-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
          >
            {checking
              ? "Checking..."
              : codeStatus === "success"
                ? "Verified! Entering..."
                : "Enter Workspace"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-[#0e1116] flex overflow-hidden font-sans relative select-none">
      <div className="absolute top-6 left-6 z-50 bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 w-64 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] shrink-0">
            S
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="text-sm font-bold tracking-wide text-white truncate"
              title={roomInfo.roomName || "SyncCanvas"}
            >
              {roomInfo.roomName || "SyncCanvas"}
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
              Room Session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            {users.length} / {roomInfo.maxParticipants} Active Now
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
          onLeave={handleConfirmLeave}
        />
      </section>
    </main>
  );
}
