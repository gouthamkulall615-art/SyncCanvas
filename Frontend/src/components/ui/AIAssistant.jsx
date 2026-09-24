import { useState, useRef, useEffect } from "react";
import { TbRobot } from "react-icons/tb";
import { FiSend, FiX, FiLoader } from "react-icons/fi";

/**
 * Floating AI assistant. Purely the interaction shell for now:
 * - collapsed: a round glowing robot button
 * - expanded: a small panel with a textarea + send button
 *
 * `onGenerate` is where the real Gemini call plugs in later — it's called
 * with the raw prompt string and is expected to return a Promise. Until
 * that's wired up, it defaults to a stub that just logs and resolves, so
 * the whole interaction (open → type → submit → loading → close) is
 * already testable end-to-end.
 */
export default function AIAssistant({
  onGenerate = async (prompt) => {
    console.log("AI prompt submitted (no handler wired yet):", prompt);
  },
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Small delay so the expand animation has started before we steal focus.
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
      setError("Something went wrong. Try again.");
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
    <div className="absolute z-50 bottom-6 right-6 md:bottom-6 md:right-6 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[320px] sm:w-[380px] rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-purple-500/30 shadow-2xl shadow-purple-900/20 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <TbRobot size={16} />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                AI Assistant
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors p-1"
              title="Close"
            >
              <FiX size={16} />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Describe what to build — e.g. "a secure auth flow with JWT and refresh tokens""
            rows={3}
            className="w-full resize-none rounded-xl bg-[#06080c] border border-zinc-800 focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/40 text-sm text-white placeholder-zinc-600 px-3 py-2.5 outline-none transition-colors disabled:opacity-50"
          />

          {error && (
            <p className="text-[11px] text-red-400 mt-2 ml-1">{error}</p>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-zinc-600 font-mono">
              Enter to generate · Shift+Enter for a new line
            </span>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || loading}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-medium px-3.5 py-2 transition-all"
            >
              {loading ? (
                <FiLoader size={13} className="animate-spin" />
              ) : (
                <FiSend size={13} />
              )}
              {loading ? "Building..." : "Generate"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        title="AI Assistant"
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl ${
          open
            ? "bg-purple-600 text-white"
            : "bg-[#1a1d24]/95 backdrop-blur-md border border-purple-500/40 text-purple-400 hover:text-white hover:border-purple-500/70"
        }`}
      >
        {/* Idle glow pulse — only when collapsed, so it doesn't fight the
            panel's own presence once open. */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
        )}
        <TbRobot size={22} className="relative" />
      </button>
    </div>
  );
}
