// src/components/InstallPrompt.jsx
import React, { useEffect, useRef } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export default function InstallPrompt() {
  const { showPrompt, isIOS, install, dismiss } = usePWAInstall();
  const promptRef = useRef(null);

  // Accessible Escape key listener
  useEffect(() => {
    if (!showPrompt) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        dismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPrompt, dismiss]);

  if (!showPrompt) return null;

  return (
    <aside
      ref={promptRef}
      role="dialog"
      aria-label="Install SyncCanvas"
      aria-describedby="pwa-install-desc"
      className="fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md w-auto
                 animate-in fade-in slide-in-from-bottom-5 duration-300 motion-reduce:animate-none"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-[#161b22] border border-[#27272a] 
                   p-5 shadow-2xl shadow-purple-950/30 text-white backdrop-blur-xl"
      >
        {/* Subtle accent glow in background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl"
        />

        {/* Header row: Icon, text info, and dismiss X button */}
        <div className="flex items-start gap-3.5">
          {/* SyncCanvas Brand Icon */}
          <div
            aria-hidden="true"
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#0e1116] border border-[#27272a] shrink-0 text-[#9333ea] shadow-inner"
          >
            <svg viewBox="0 0 28 28" width="26" height="26" fill="currentColor">
              <rect x="3" y="3" width="16" height="16" rx="4" opacity="0.5" />
              <rect x="9" y="9" width="16" height="16" rx="4" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-6">
            <h2 className="text-base font-semibold text-white tracking-tight leading-snug">
              Install SyncCanvas
            </h2>
            <p
              id="pwa-install-desc"
              className="mt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed"
            >
              Get a faster, full-screen experience with quick access from your home screen.
            </p>
          </div>

          {/* Top-right close button */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close install prompt"
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Action section: Conditional for iOS Safari vs Standard Install */}
        <div className="mt-4 pt-3 border-t border-[#27272a]/80">
          {isIOS ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-zinc-300 bg-[#0e1116]/80 p-2.5 rounded-xl border border-white/5">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/10 text-purple-400 shrink-0">
                  {/* iOS Share icon */}
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>
                <span className="leading-snug">
                  Tap the <strong className="text-white font-medium">Share</strong> icon, then{" "}
                  <strong className="text-white font-medium">'Add to Home Screen'</strong>.
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={dismiss}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-medium transition shadow-lg shadow-purple-600/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  Got it
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={dismiss}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={install}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-medium transition shadow-lg shadow-purple-600/25 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                Install
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
