import React from "react";

export default function Beams({ lightColor = "#9333ea", rotation = 45 }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Container that rotates the whole beam setup */}
      <div
        className="absolute w-full h-full flex items-center justify-center origin-center"
        style={{ transform: `rotate(${rotation}deg) scale(1.5)` }}
      >
        {/* Massive Soft Glow 1 */}
        <div
          className="absolute w-full h-[300px] blur-[60px] opacity-80"
          style={{
            background: `linear-gradient(to bottom, transparent, ${lightColor}, transparent)`,
            transform: "translateY(-150px)",
          }}
        />

        {/* Massive Soft Glow 2 */}
        <div
          className="absolute w-full h-[300px] blur-[60px] opacity-60"
          style={{
            background: `linear-gradient(to top, transparent, ${lightColor}, transparent)`,
            transform: "translateY(150px) rotate(10deg)",
          }}
        />

        {/* Ultra-Sharp Geometric Line 1 */}
        <div
          className="absolute w-[200%] h-[2px] opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent, ${lightColor}, transparent)`,
            transform: "translateY(-100px)",
          }}
        />

        {/* Ultra-Sharp Geometric Line 2 */}
        <div
          className="absolute w-[200%] h-[2px] opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent, ${lightColor}, transparent)`,
            transform: "translateY(120px) rotate(-15deg)",
          }}
        />
      </div>
    </div>
  );
}
