import React, { useState, useEffect } from "react";
import { FiX, FiUsers, FiLayers, FiAlertCircle, FiLoader } from "react-icons/fi";

export default function CreateRoomModal({ isOpen, onClose, onSubmit, isSubmitting, error }) {
  const [roomName, setRoomName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setRoomName("");
      setMaxParticipants(6);
      setLocalError("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = roomName.trim();

    if (!trimmed) {
      setLocalError("Room name is required.");
      return;
    }

    if (trimmed.length > 40) {
      setLocalError("Room name cannot exceed 40 characters.");
      return;
    }

    const participants = Number(maxParticipants);
    if (!Number.isInteger(participants) || participants < 2 || participants > 6) {
      setLocalError("Max participants must be between 2 and 6.");
      return;
    }

    setLocalError("");
    onSubmit({ roomName: trimmed, maxParticipants: participants });
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-md bg-[#0e1219] border border-zinc-800/90 rounded-2xl p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-room-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 transition-colors disabled:opacity-40"
          title="Close modal"
        >
          <FiX size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(147,51,234,0.2)]">
            <FiLayers size={20} />
          </div>
          <div>
            <h2 id="create-room-title" className="text-lg font-bold text-white tracking-tight">
              Customize New Room
            </h2>
            <p className="text-xs text-zinc-400">
              Set session details before generating your room link
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {displayError && (
          <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3 mb-4">
            <FiAlertCircle className="shrink-0" size={16} />
            <span>{displayError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Name Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="room-name" className="text-xs font-semibold text-zinc-300">
                Room Name <span className="text-purple-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-500">
                {roomName.length}/40
              </span>
            </div>
            <input
              id="room-name"
              type="text"
              autoFocus
              maxLength={40}
              placeholder="e.g. Auth Flow Design"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                if (localError) setLocalError("");
              }}
              disabled={isSubmitting}
              className="w-full bg-[#06080c] border border-zinc-800 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all"
            />
          </div>

          {/* Max Participants Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="max-participants" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <FiUsers size={13} className="text-purple-400" />
                Max Participants <span className="text-purple-400">*</span>
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">2 to 6</span>
            </div>
            <input
              id="max-participants"
              type="number"
              min={2}
              max={6}
              value={maxParticipants}
              onChange={(e) => {
                setMaxParticipants(e.target.value);
                if (localError) setLocalError("");
              }}
              disabled={isSubmitting}
              className="w-full bg-[#06080c] border border-zinc-800 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all"
            />
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Once capacity is reached, new joins are automatically blocked.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !roomName.trim()}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.45)] transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin" size={14} />
                  <span>Creating Room...</span>
                </>
              ) : (
                <span>Create & Generate Link</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
