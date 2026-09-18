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
import api from "../api/axios";

export default function WorkspaceCards() {
  const navigate = useNavigate();
  const [roomUrl, setRoomUrl] = useState(
    `${window.location.origin}/workspace?pin=######`,
  );
  const [copied, setCopied] = useState(false);
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const pinRefs = useRef([]);

  const handleCopy = async () => {
    let finalUrl = roomUrl;

    if (roomUrl.includes("######")) {
      try {
        const response = await api.post("/rooms/create");
        const { pin } = response.data;
        finalUrl = `${window.location.origin}/workspace?pin=${pin}`;
        setRoomUrl(finalUrl);
      } catch (error) {
        console.error("Failed to create room for copy:", error);
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Fallback for older mobile browsers
      const textArea = document.createElement("textarea");
      textArea.value = finalUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const response = await api.post("/rooms/create");
      const { pin } = response.data;
      const finalUrl = `${window.location.origin}/workspace?pin=${pin}`;

      setRoomUrl(finalUrl);

      try {
        await navigator.clipboard.writeText(finalUrl);
      } catch (copyErr) {
        console.error("Auto-copy prevented by browser", copyErr);
      }

      // Navigate to the live workspace
      navigate(`/workspace?pin=${pin}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newPin = [...pin];
      digits.forEach((digit, i) => {
        newPin[i] = digit;
      });
      setPin(newPin);
      const nextIndex = Math.min(digits.length, 5);
      pinRefs.current[nextIndex]?.focus();
    }
  };

  const handleJoinSession = async () => {
    const fullPin = pin.join("");
    if (fullPin.length === 6) {
      try {
        await api.post("/rooms/verify", { pin: fullPin });
        navigate(`/workspace?pin=${fullPin}`);
      } catch (error) {
        console.error("Invalid PIN or unauthorized:", error);
        setPin(["", "", "", "", "", ""]);
      }
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
              <div className="flex items-center justify-between bg-[#06080c] border border-zinc-800/90 rounded-xl px-4 py-3 mb-6 shadow-inner">
                <span className="text-sm font-mono text-zinc-300 truncate select-all">
                  {roomUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-zinc-400 hover:text-white transition-colors ml-3 p-1 shrink-0 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg border border-zinc-800"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <FiCheck className="text-emerald-400" size={16} />
                  ) : (
                    <FiCopy size={16} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateLink}
              className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all duration-200 shadow-[0_0_20px_rgba(147,51,234,0.25)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>+ Generate Room Link</span>
            </button>
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

              <div className="mb-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                  Workspace PIN
                </span>
              </div>
              <div
                className="grid grid-cols-6 gap-2 sm:gap-3 mb-6"
                onPaste={handlePinPaste}
              >
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (pinRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    placeholder="•"
                    className={`w-full h-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold rounded-xl bg-[#06080c] border transition-all duration-150 text-white placeholder-zinc-700 outline-none ${
                      digit
                        ? "border-purple-500 ring-1 ring-purple-500/40 bg-purple-950/10"
                        : "border-zinc-800 focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleJoinSession}
              disabled={pin.join("").length !== 6}
              className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none text-white font-medium text-sm transition-all duration-200 shadow-[0_0_20px_rgba(147,51,234,0.25)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Join Active Session</span>
              <FiArrowRight
                className="transition-transform group-hover:translate-x-1"
                size={16}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
