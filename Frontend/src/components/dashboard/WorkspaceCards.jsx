import React, { useState, useRef } from "react";
import {
  FiLink,
  FiLock,
  FiCopy,
  FiCheck,
  FiArrowRight,
  FiShield,
  FiCpu,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CreateRoomModal from "./CreateRoomModal";
import CodeSlots from "../ReactBits/CodeSlots";

export default function WorkspaceCards() {
  const navigate = useNavigate();

  // The link and the pin are two separate secrets now — the link alone no
  // longer gets anyone into the room.
  const [roomToken, setRoomToken] = useState(null);
  const [roomUrl, setRoomUrl] = useState(null);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null); // { roomName, maxParticipants }
  const [copied, setCopied] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  // Modal states for room customization
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [pin, setPin] = useState("");
  const [joinStatus, setJoinStatus] = useState("idle"); // "idle" | "error" | "success"
  const [joinError, setJoinError] = useState(null);

  const handleCopy = () => {
    if (!roomUrl) return;
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPin = () => {
    if (!generatedPin) return;
    navigator.clipboard.writeText(generatedPin);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  const handleCreateRoomSubmit = async ({ roomName, maxParticipants }) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const response = await api.post("/rooms/create", {
        roomName,
        maxParticipants,
      });
      const { token, pin: newPin, roomName: savedName, maxParticipants: savedMax } = response.data;

      if (!token) {
        console.error(
          "Room creation response is missing a token:",
          response.data,
        );
        setCreateError("Failed to create room: missing token in response.");
        return;
      }

      const fullUrl = `${window.location.origin}/workspace/${token}`;
      setRoomToken(token);
      setRoomUrl(fullUrl);
      if (localStorage.getItem("autoCopyLink") === "true") {
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      setGeneratedPin(newPin);
      setRoomDetails({
        roomName: savedName || roomName,
        maxParticipants: savedMax || maxParticipants,
      });

      // Host created this room, so they can skip the pin gate on this browser
      sessionStorage.setItem(`host:${token}`, "true");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create room:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to create room. Please try again.";
      setCreateError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEnterWorkspace = () => {
    if (!roomToken) return;
    navigate(`/workspace/${roomToken}`);
  };

  const handleJoinSession = async (overridePin) => {
    const fullPin = typeof overridePin === "string" ? overridePin : pin;
    if (fullPin.length !== 6) return;

    try {
      const response = await api.post("/rooms/join-by-pin", { pin: fullPin });
      const { token } = response.data;
      setJoinStatus("success");
      setTimeout(() => {
        navigate(`/workspace/${token}`);
      }, 700);
    } catch (error) {
      setJoinStatus("error");
      const status = error.response?.status;
      if (status === 403) {
        setJoinError(error.response?.data?.error || "Room is full.");
      } else if (status === 429) {
        setJoinError("Too many attempts. Try again in a few minutes.");
      } else {
        setJoinError(error.response?.data?.error || "Invalid PIN.");
      }
      setPin("");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col justify-between min-h-[calc(100vh-100px)]">
      {/* Header Section */}
      <div>
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-3">
            Collaborative Real-time <br />
            Workspace
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-normal leading-relaxed">
            Host a new coding session instantly or enter a room code to join
            active teammates securely.
          </p>
        </div>

        {/* Two-Column Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Host Session Card */}
          <div className="bg-[#0b0f15]/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:border-zinc-700">
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(147,51,234,0.15)]">
                  <FiLink size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Host a New Session
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 leading-relaxed">
                    Generate a shareable, secure URL for real-time multiplayer
                    code editing.
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                  Generated Session URL
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#06080c] border border-zinc-800/90 rounded-xl px-4 py-3 mb-4 shadow-inner">
                <span className="text-sm font-mono text-zinc-300 truncate select-all">
                  {roomUrl ||
                    `${window.location.origin}/workspace/••••••••••••••••••••••`}
                </span>
                {roomUrl && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-zinc-400 hover:text-white transition-colors ml-3 p-1 shrink-0 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg border border-zinc-800 cursor-pointer"
                    title="Copy link"
                  >
                    {copied ? (
                      <FiCheck className="text-emerald-400" size={16} />
                    ) : (
                      <FiCopy size={16} />
                    )}
                  </button>
                )}
              </div>

              {/* PIN is shown and copied separately from the link on purpose —
                  share it through a different channel (verbally, a different
                  chat thread) than the link itself. */}
              {generatedPin && (
                <div className="mb-6">
                  <div className="mb-2">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                      Room PIN — share this separately from the link
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#06080c] border border-purple-500/30 rounded-xl px-4 py-3 shadow-inner">
                    <span className="text-lg font-mono font-bold text-purple-300 tracking-[0.3em] select-all">
                      {generatedPin}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPin}
                      className="text-zinc-400 hover:text-white transition-colors ml-3 p-1 shrink-0 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg border border-zinc-800"
                      title="Copy PIN"
                    >
                      {pinCopied ? (
                        <FiCheck className="text-emerald-400" size={16} />
                      ) : (
                        <FiCopy size={16} />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-2 ml-1">
                    This PIN won't be shown again after you leave this page —
                    copy it now.
                  </p>
                </div>
              )}

              {roomDetails && (
                <div className="mb-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-0.5">
                      Room Name
                    </span>
                    <span className="text-xs font-semibold text-white truncate block">
                      {roomDetails.roomName}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-0.5">
                      Capacity
                    </span>
                    <span className="text-xs font-semibold text-purple-300">
                      Up to {roomDetails.maxParticipants} peers
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!roomUrl ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all duration-200 shadow-[0_0_20px_rgba(147,51,234,0.25)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>+ Generate Room Link</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnterWorkspace}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-[0.99] flex items-center justify-center gap-2 group"
              >
                <span>Enter Workspace</span>
                <FiArrowRight
                  className="transition-transform group-hover:translate-x-1"
                  size={16}
                />
              </button>
            )}
          </div>

          {/* Join Session Card */}
          <div className="bg-[#0b0f15]/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:border-zinc-700">
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <FiLock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Join via Room Code
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 leading-relaxed">
                    Enter the 6-digit numeric PIN provided by the workspace
                    host.
                  </p>
                </div>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                  Workspace PIN
                </span>
                {joinError && (
                  <span className="text-[10px] font-medium text-red-400">
                    {joinError}
                  </span>
                )}
              </div>
              <div className="flex justify-center mb-6">
                <CodeSlots
                  length={6}
                  value={pin}
                  status={joinStatus}
                  onChange={(code) => {
                    setPin(code);
                    setJoinStatus("idle");
                    setJoinError(null);
                  }}
                  onComplete={(code) => {
                    handleJoinSession(code);
                  }}
                  accentColor="#10b981"
                  inkColor="#34d399"
                  slotColor="#06080c"
                  digitColor="#ffffff"
                  dangerColor="#ef4444"
                  slotSize={48}
                  gap={8}
                  radius={12}
                  bounce={0.2}
                  settle={0.3}
                  rise={8}
                  cascade={20}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleJoinSession()}
              disabled={pin.length !== 6 || joinStatus === "success"}
              className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none text-white font-medium text-sm transition-all duration-200 shadow-[0_0_20px_rgba(147,51,234,0.25)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
            >
              <span>
                {joinStatus === "success"
                  ? "Joining Room..."
                  : "Join Active Session"}
              </span>
              <FiArrowRight
                className="transition-transform group-hover:translate-x-1"
                size={16}
              />
            </button>
          </div>
        </div>
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCreateError(null);
        }}
        onSubmit={handleCreateRoomSubmit}
        isSubmitting={isCreating}
        error={createError}
      />
    </div>
  );
}
