import { useState, useRef, useEffect } from "react";
import { HiSparkles } from "react-icons/hi2";
import { FiSend, FiX } from "react-icons/fi";
import LatticeLoader from "./LatticeLoader";
import SyncyRobot from "./SyncyRobot";

const QUICK_PROMPTS = [
  "Microservices architecture with API gateway",
  "User authentication flow with database & token service",
  "Event-driven pub/sub queue pipeline",
];

/**
 * Floating AI Assistant (Syncy).
 * - collapsed: an animated, eye-tracking Syncy robot mascot that floats above the controls
 * - expanded: prompt textarea to describe architecture/canvas shapes + send button
 */
export default function AIAssistant({
  onGenerate = async (prompt) => {
    console.log("AI prompt submitted:", prompt);
  },
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaderStatus, setLoaderStatus] = useState("working");
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const timerTimeoutRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Small delay so the expand animation has started before focusing
      const t = setTimeout(() => textareaRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setLoaderStatus("working");
    setError(null);
    try {
      await onGenerate(trimmed);
      setLoaderStatus("done");
      timerTimeoutRef.current = setTimeout(() => {
        setPrompt("");
        setOpen(false);
        setLoading(false);
        setLoaderStatus("working");
      }, 1000);
    } catch (err) {
      console.error("AI generation failed:", err);
      setError(err?.message || "Something went wrong. Try again.");
      setLoaderStatus("error");
      timerTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        setLoaderStatus("working");
      }, 1800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="absolute z-50 bottom-[148px] right-4 md:bottom-6 md:right-6 flex flex-col items-end gap-3 select-none">
      {open && (
        <div className="w-[310px] sm:w-[360px] max-h-[calc(100vh-170px)] overflow-y-auto rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-purple-500/30 shadow-2xl shadow-purple-900/30 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <SyncyRobot size={38} floating={false} state={loading ? "thinking" : "idle"} />
              <div>
                <span className="text-sm font-bold text-white tracking-tight block">
                  Syncy
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
                    loading ? "text-purple-400" : "text-emerald-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      loading ? "bg-purple-400 animate-ping" : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  {loading ? "Thinking..." : "Ready"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer"
              title="Close"
            >
              <FiX size={16} />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={'Ask Syncy to build — e.g. "a microservices payment architecture"'}
            rows={3}
            className="w-full resize-none rounded-xl bg-[#0b0d13] border border-zinc-800/90 focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/40 text-xs sm:text-sm text-white placeholder-zinc-500 p-3 outline-none transition-colors disabled:opacity-50 select-text"
          />

          {/* Quick Suggestions */}
          <div className="mt-2.5 flex flex-col gap-1.5">
            <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
              <HiSparkles size={12} className="text-purple-400" />
              Quick Prompts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(qp)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/20 text-purple-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 leading-snug">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[130px] sm:max-w-none">
              Enter to generate · Shift+Enter newline
            </span>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || loading}
              className={`shrink-0 flex items-center justify-center gap-1.5 rounded-xl text-white text-xs font-medium px-3.5 py-2 transition-all shadow-lg ${
                loading
                  ? "bg-purple-600/90 cursor-wait shadow-purple-900/30"
                  : !prompt.trim()
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500 cursor-pointer shadow-purple-900/20"
              }`}
            >
              {loading ? (
                <LatticeLoader
                  status={loaderStatus}
                  label="Thinking"
                  doneLabel="Done in"
                  errorLabel="Failed after"
                  pattern="orbit"
                  grid={3}
                  shape="round"
                  doneColor="#22c55e"
                  errorColor="#ef4444"
                  cellSize={6}
                  gap={2}
                  fontSize={14}
                  step={90}
                  idleOpacity={0.15}
                  glow={false}
                  glowColor=""
                  showTimer
                  color="#f5f5f5"
                />
              ) : (
                <>
                  <FiSend size={13} />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating Syncy Trigger Button with Eye Tracking & Float */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Syncy - AI Canvas Assistant"
        className={`group relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
          open
            ? "bg-purple-600/30 backdrop-blur-xl border-2 border-purple-500/80 ring-4 ring-purple-500/25"
            : "bg-[#12141c]/95 backdrop-blur-xl border-2 border-purple-500/50 hover:border-purple-400 hover:shadow-[0_0_24px_rgba(168,85,247,0.45)] hover:scale-105"
        }`}
      >
        <SyncyRobot
          size={52}
          floating={!open}
          state={loading ? "thinking" : "idle"}
          showBadge={!open}
          badgeText="Syncy"
        />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#12141c] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
      </button>
    </div>
  );
}
