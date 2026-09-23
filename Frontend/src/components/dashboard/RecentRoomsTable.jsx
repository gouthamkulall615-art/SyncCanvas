import React, { useState, useEffect } from "react";
import {
  History,
  Clock,
  Users,
  Trash2,
  DoorOpen,
  ArrowUpRight,
  FolderX,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// Consistent palette based on user name
const AVATAR_PALETTES = [
  { bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-300" },
  { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-300" },
  { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-300" },
  { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300" },
  { bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-300" },
  { bg: "bg-cyan-500/20", border: "border-cyan-500/40", text: "text-cyan-300" },
  { bg: "bg-indigo-500/20", border: "border-indigo-500/40", text: "text-indigo-300" },
];

function getPaletteForName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RecentRoomsTable({ searchQuery = "", onClearSearch }) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [hoveredAvatar, setHoveredAvatar] = useState(null); // { roomId, name }
  const [deletingToken, setDeletingToken] = useState(null);

  // Load rooms from localStorage on mount and sync with backend
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    let localRooms = [];
    try {
      const stored = localStorage.getItem("synccanvas_recent_rooms");
      if (stored) {
        localRooms = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse local recent rooms:", e);
    }

    setRooms(localRooms);

    // Sync with backend if current user name is known
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserName = storedUser.name || storedUser.username;
      if (currentUserName) {
        const res = await api.get(`/rooms/user-recent/${encodeURIComponent(currentUserName)}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Merge backend rooms with local rooms (deduping by token)
          const mergedMap = new Map();
          // First add local rooms
          localRooms.forEach((r) => {
            if (r.token) mergedMap.set(r.token, r);
          });
          // Merge in backend rooms
          res.data.forEach((bRoom) => {
            const existing = mergedMap.get(bRoom.token) || {};
            const participantNames = Array.isArray(bRoom.participants)
              ? bRoom.participants.map((p) => (typeof p === "string" ? p : p.name)).filter(Boolean)
              : [];

            const combinedParticipants = Array.from(
              new Set([...(existing.participants || []), ...participantNames])
            );

            mergedMap.set(bRoom.token, {
              ...existing,
              token: bRoom.token,
              roomName: bRoom.roomName || existing.roomName || "Untitled Room",
              participants: combinedParticipants,
              pin: bRoom.pin || existing.pin,
              enteredAt: bRoom.createdAt || existing.enteredAt || new Date().toISOString(),
            });
          });

          const mergedArray = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.enteredAt || 0) - new Date(a.enteredAt || 0)
          );

          setRooms(mergedArray);
          localStorage.setItem("synccanvas_recent_rooms", JSON.stringify(mergedArray));
        }
      }
    } catch (err) {
      // Backend may be offline or unauthenticated; local cache is already set
    }
  };

  const handleDeleteRoom = async (tokenToDelete, e) => {
    e.stopPropagation();
    setDeletingToken(tokenToDelete);

    // Optimistically remove from state & localStorage
    const updated = rooms.filter((r) => r.token !== tokenToDelete);
    setRooms(updated);
    try {
      localStorage.setItem("synccanvas_recent_rooms", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to update localStorage:", err);
    }

    // Call backend delete
    try {
      await api.delete(`/rooms/${tokenToDelete}`);
    } catch (err) {
      console.error("Backend delete room error:", err);
    } finally {
      setDeletingToken(null);
    }
  };

  const handleEnterRoom = (token) => {
    if (!token) return;
    sessionStorage.setItem(`verified:${token}`, "true");
    navigate(`/workspace/${token}`);
  };

  const cleanQuery = searchQuery.trim().toLowerCase();
  const filteredRooms = rooms.filter((room) => {
    if (!cleanQuery) return true;
    const matchRoomName = (room.roomName || "").toLowerCase().includes(cleanQuery);
    const matchPin = (room.pin || "").toLowerCase().includes(cleanQuery);
    const matchPeople =
      Array.isArray(room.participants) &&
      room.participants.some((p) => {
        const nameStr = typeof p === "string" ? p : p.name || "";
        return nameStr.toLowerCase().includes(cleanQuery);
      });
    return matchRoomName || matchPin || matchPeople;
  });

  if (!rooms || rooms.length === 0) {
    return (
      <div className="w-full mt-4 bg-[#0b0f15]/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 text-center shadow-2xl transition-all duration-300 hover:border-zinc-700/80">
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 shadow-[0_0_15px_rgba(147,51,234,0.1)]">
            <FolderX size={22} />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">No Recently Entered Rooms</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Host a new session or join with a room code above to start collaborating with your team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 bg-[#0b0f15]/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-zinc-700/80">
      {/* Section Header */}
      <div className="px-6 py-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <History size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Recently Entered Rooms
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/50">
                {filteredRooms.length}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Workspaces you or your teammates recently entered
            </p>
          </div>
        </div>

        {cleanQuery && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-purple-500/10 border border-purple-500/25 px-3 py-1 rounded-lg text-xs">
            <span className="text-zinc-400">Filtering:</span>
            <span className="text-purple-300 font-semibold truncate max-w-[120px] sm:max-w-[200px]">
              "{searchQuery}"
            </span>
            <button
              type="button"
              onClick={onClearSearch}
              className="text-zinc-400 hover:text-white ml-1 cursor-pointer font-bold"
              title="Clear search"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {filteredRooms.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-2">
            <FolderX size={18} />
          </div>
          <p className="text-sm text-zinc-300 font-medium">
            No rooms found matching "{searchQuery}"
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Try searching for a different room name or teammate.
          </p>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-3 text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-[#06080c]/50">
                <th className="py-3 px-6 text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400">
                  Room Name
                </th>
                <th className="py-3 px-6 text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400">
                  People
                </th>
                <th className="py-3 px-6 text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400">
                  Entered
                </th>
                <th className="py-3 px-6 text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400">
                  Time
                </th>
                <th className="py-3 px-6 text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredRooms.map((room) => {
              const participants = Array.isArray(room.participants) ? room.participants : [];
              const enteredCount = participants.length > 0 ? participants.length : 1;

              return (
                <tr
                  key={room.token}
                  onClick={() => handleEnterRoom(room.token)}
                  className="group hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  {/* Room Name */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-purple-400 shrink-0 group-hover:border-purple-500/40 group-hover:text-purple-300 transition-colors">
                        <DoorOpen size={16} />
                      </div>
                      <div className="truncate max-w-[200px] sm:max-w-xs">
                        <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors block truncate">
                          {room.roomName || "Untitled Workspace"}
                        </span>
                        {room.pin && (
                          <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                            PIN: <span className="text-purple-300/90 tracking-wider">{room.pin}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* People (Avatars with Capital Letter & Full Name Tooltip) */}
                  <td className="py-4 px-6">
                    <div className="flex items-center -space-x-2 relative">
                      {participants.length > 0 ? (
                        participants.map((personName, idx) => {
                          const nameStr = typeof personName === "string" ? personName : personName.name || "Peer";
                          const capitalLetter = nameStr.trim().charAt(0).toUpperCase() || "P";
                          const palette = getPaletteForName(nameStr);
                          const isHovered =
                            hoveredAvatar?.roomId === room.token && hoveredAvatar?.name === nameStr;

                          return (
                            <div
                              key={idx}
                              className="relative"
                              onMouseEnter={(e) => {
                                e.stopPropagation();
                                setHoveredAvatar({ roomId: room.token, name: nameStr });
                              }}
                              onMouseLeave={() => setHoveredAvatar(null)}
                            >
                              <div
                                className={`w-8 h-8 rounded-full ${palette.bg} ${palette.border} border flex items-center justify-center ${palette.text} font-bold text-xs shadow-md transition-transform hover:scale-115 hover:z-20 cursor-default select-none`}
                                title={nameStr}
                              >
                                {capitalLetter}
                              </div>

                              {/* Tooltip on hover showing full real name */}
                              {isHovered && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-lg border border-zinc-700/80 shadow-xl whitespace-nowrap z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                  {nameStr}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-700/80" />
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-zinc-400 italic">No members</div>
                      )}
                    </div>
                  </td>

                  {/* Number of People Entered (NOT max capacity) */}
                  <td className="py-4 px-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300">
                      <Users size={13} className="text-zinc-400" />
                      <span>
                        {enteredCount} {enteredCount === 1 ? "entered" : "entered"}
                      </span>
                    </div>
                  </td>

                  {/* Time */}
                  <td className="py-4 px-6">
                    <div
                      className="flex items-center gap-1.5 text-xs text-zinc-400"
                      title={room.enteredAt ? new Date(room.enteredAt).toLocaleString() : ""}
                    >
                      <Clock size={13} className="text-zinc-400" />
                      <span>{formatRelativeTime(room.enteredAt)}</span>
                    </div>
                  </td>

                  {/* Actions (Enter button + Bin icon to delete) */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleEnterRoom(room.token)}
                        className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-purple-600/20 text-zinc-400 hover:text-purple-300 border border-zinc-800 hover:border-purple-500/40 transition-all cursor-pointer"
                        title="Enter workspace"
                      >
                        <ArrowUpRight size={16} />
                      </button>

                      <button
                        type="button"
                        disabled={deletingToken === room.token}
                        onClick={(e) => handleDeleteRoom(room.token, e)}
                        className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 transition-all cursor-pointer disabled:opacity-50"
                        title="Delete from recent rooms"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
