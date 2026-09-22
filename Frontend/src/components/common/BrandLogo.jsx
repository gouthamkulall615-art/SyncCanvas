import React from "react";

export default function BrandLogo({
  size = 28,
  textSize = "text-xl",
  className = "",
}) {
  return (
    <div
      className={`flex items-center gap-3 text-white font-bold tracking-tight select-none ${textSize} ${className}`}
    >
      <span className="relative flex items-center justify-center text-[#9333ea] shrink-0">
        <svg viewBox="0 0 28 28" width={size} height={size} fill="currentColor">
          <rect x="3" y="3" width="16" height="16" rx="4" opacity="0.5" />
          <rect x="9" y="9" width="16" height="16" rx="4" />
        </svg>
      </span>
      <span>SyncCanvas</span>
    </div>
  );
}
