import { useState, useRef, useEffect } from "react";
import { TbRobot } from "react-icons/tb";
import { HiSparkles } from "react-icons/hi2";
import { FiSend, FiX, FiLoader } from "react-icons/fi";

const QUICK_PROMPTS = [
  "Microservices architecture with API gateway",
  "User authentication flow with database & token service",
  "Event-driven pub/sub queue pipeline",
];

/**
 * Floating AI Assistant (Syncy).
 * - collapsed: a round glowing robot button positioned neatly above the zoom controls
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
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Small delay so the expand animation has started before focusing
      const t = setTimeout(() => textareaRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onGenerate(trimmed);
      setPrompt("");
      setOpen(false);
    } catch (err) {
      console.error("AI generation failed:", err);
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
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
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
                <TbRobot size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight block">
                  Syncy
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready
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
            <span className="text-[10px] text-zinc-500 font-mono">
              Enter to generate · Shift+Enter newline
            </span>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || loading}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-medium px-3.5 py-2 transition-all cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
            >
              {loading ? (
                <FiLoader size={13} className="animate-spin" />
              ) : (
                <FiSend size={13} />
              )}
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        title="Syncy"
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl cursor-pointer ${
          open
            ? "bg-purple-600 text-white ring-4 ring-purple-500/20"
            : "bg-[#1a1d24]/95 backdrop-blur-md border border-purple-500/40 text-purple-400 hover:text-white hover:border-purple-500/70"
        }`}
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
        )}
        <TbRobot size={22} className="relative" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#1a1d24] shadow" />
      </button>
    </div>
  );
}
