import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#0a071b] text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting and purple/indigo mesh glows */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-purple-700/30 rounded-full blur-[140px] pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-indigo-900/35 rounded-full blur-[140px] pointer-events-none -ml-20 -mb-20" />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#4c1d95]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Central Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-[480px] bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-[32px] p-8 sm:p-14 flex flex-col items-center text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* 404 Heading */}
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-white mb-3">
          404
        </h1>

        {/* Subtitle */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-zinc-300/80 text-sm sm:text-[15px] font-normal leading-relaxed max-w-[320px] mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        {/* Go Home Pill Button */}
        <Link
          to="/"
          className="inline-flex items-center justify-center px-8 py-2.5 rounded-full border border-purple-500/60 bg-white/[0.04] hover:bg-purple-600/20 text-white font-medium text-sm transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_28px_rgba(168,85,247,0.45)] hover:border-purple-400"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
