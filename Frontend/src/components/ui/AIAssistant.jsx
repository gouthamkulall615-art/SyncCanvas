import { useState } from "react";
import { TbRobot } from "react-icons/tb";
import { FiX, FiClock } from "react-icons/fi";

/**
 * Floating AI Assistant.
 * Currently displaying an 'Under Process' status UI when clicked,
 * with no prompt textarea or placeholder active.
 */
export default function AIAssistant({ onGenerate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute z-50 bottom-6 right-6 md:bottom-6 md:right-6 flex flex-col items-end gap-3 select-none">
      {open && (
        <div className="w-[300px] sm:w-[340px] rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-purple-500/30 shadow-2xl shadow-purple-900/30 p-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
                <TbRobot size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight block">
                  AI Assistant
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Under Process
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800/60"
              title="Close"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="rounded-xl bg-[#0b0d13]/80 border border-zinc-800/80 p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-2.5">
              <FiClock size={20} className="animate-pulse" />
            </div>
            <h4 className="text-xs font-semibold text-zinc-200 mb-1">
              Service Currently Under Process
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              We are currently upgrading the AI canvas generation system for higher reliability. Prompt generation is temporarily paused and will be back shortly!
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-medium transition-all text-center"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        title="AI Assistant (Under Process)"
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl ${
          open
            ? "bg-purple-600 text-white ring-4 ring-purple-500/20"
            : "bg-[#1a1d24]/95 backdrop-blur-md border border-purple-500/40 text-purple-400 hover:text-white hover:border-purple-500/70"
        }`}
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
        )}
        <TbRobot size={22} className="relative" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-[#1a1d24] shadow" />
      </button>
    </div>
  );
}
