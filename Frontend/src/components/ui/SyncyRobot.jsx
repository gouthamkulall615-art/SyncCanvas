import { useState, useEffect, useRef } from "react";
import "./SyncyRobot.css";

/**
 * Syncy - The Interactive AI Mascot
 * - Eyes follow the user's mouse cursor across the canvas / screen
 * - Periodic natural blinking and expressive reactions on hover
 * - Floating levitation animation with reactive shadow
 * - Scalable vector artwork modeled after the 3D bot console assistant
 */
export default function SyncyRobot({
  size = 56,
  className = "",
  interactive = true,
  floating = true,
  state = "idle", // 'idle' | 'thinking' | 'happy'
  showBadge = false,
  badgeText = "Syncy",
  onClick,
}) {
  const robotRef = useRef(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState({ rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  // Periodic natural blinking
  useEffect(() => {
    let blinkTimeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
      const nextDelay = 3200 + Math.random() * 3000;
      blinkTimeout = setTimeout(triggerBlink, nextDelay);
    };

    blinkTimeout = setTimeout(triggerBlink, 2500);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Mouse tracking: eyes track pointer and head subtly tilts
  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e) => {
      if (!robotRef.current) return;
      const rect = robotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy) || 1;

      // Maximum eye pupil travel in SVG units (clamped smoothly)
      const maxEyeTravel = 6.5;
      const factor = Math.min(dist / 300, 1);
      const eyeX = (dx / dist) * maxEyeTravel * factor;
      const eyeY = (dy / dist) * (maxEyeTravel * 0.8) * factor;

      // 3D head tilt
      const maxTilt = 9;
      const tiltX = -Math.max(-maxTilt, Math.min(maxTilt, (dy / window.innerHeight) * maxTilt * 2));
      const tiltY = Math.max(-maxTilt, Math.min(maxTilt, (dx / window.innerWidth) * maxTilt * 2));

      setEyeOffset({ x: eyeX, y: eyeY });
      setHeadTilt({ rx: tiltX, ry: tiltY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive]);

  const isThinking = state === "thinking";
  const isHappy = isHovered || state === "happy";

  return (
    <div
      ref={robotRef}
      className={`syncy-container ${floating ? "syncy-floating" : ""} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        "--syncy-tilt-x": `${headTilt.rx}deg`,
        "--syncy-tilt-y": `${headTilt.ry}deg`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="syncy-head-wrapper">
        <svg
          viewBox="0 0 200 200"
          className="syncy-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Ambient drop shadow */}
            <filter id="syncyShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.35" />
            </filter>
            {/* Visor Gradient: deep reflective black/navy */}
            <radialGradient id="syncyVisor" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1e222d" />
              <stop offset="60%" stopColor="#0b0d13" />
              <stop offset="100%" stopColor="#040508" />
            </radialGradient>

            {/* White Helmet Gradient: glossy clean pearl white */}
            <linearGradient id="syncyHelmet" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Headset Gradient */}
            <linearGradient id="syncyHeadset" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Visor Glass Highlight Reflection */}
            <linearGradient id="visorReflection" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Group with 3D Parallax tilt */}
          <g className="syncy-tilt-group" filter="url(#syncyShadow)">
            {/* 1. Overhead Headset Arch */}
            <path
              d="M 28 86 A 74 74 0 0 1 172 86"
              fill="none"
              stroke="url(#syncyHeadset)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* Top Headset inner rim highlight */}
            <path
              d="M 40 76 A 66 66 0 0 1 160 76"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* 2. Main Robot Head Shell (Glossy white dome) */}
            <ellipse cx="100" cy="98" rx="68" ry="58" fill="url(#syncyHelmet)" />

            {/* Top head sheen */}
            <ellipse cx="100" cy="54" rx="42" ry="12" fill="#ffffff" opacity="0.6" />

            {/* 3. Dark Glossy Visor (Screen) */}
            <rect
              x="44"
              y="60"
              width="112"
              height="74"
              rx="34"
              fill="url(#syncyVisor)"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Visor reflection highlight overlay */}
            <path
              d="M 48 86 C 48 70, 60 62, 80 62 L 120 62 C 140 62, 152 70, 152 86 C 130 74, 70 74, 48 86 Z"
              fill="url(#visorReflection)"
            />

            {/* 4. Left Earphone Cushion and Outer Shell */}
            <rect x="15" y="68" width="16" height="38" rx="8" fill="#1e293b" />
            <rect x="11" y="70" width="14" height="34" rx="7" fill="url(#syncyHeadset)" />
            {/* Earphone highlight */}
            <line x1="15" y1="74" x2="15" y2="98" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

            {/* 5. Right Earphone and Mic Boom */}
            <rect x="169" y="68" width="16" height="38" rx="8" fill="#1e293b" />
            <rect x="175" y="70" width="14" height="34" rx="7" fill="url(#syncyHeadset)" />
            <line x1="181" y1="74" x2="181" y2="98" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

            {/* Microphone Boom Arm curving to mouth */}
            <path
              d="M 179 96 C 182 128, 168 144, 138 147"
              fill="none"
              stroke="#1e293b"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Microphone capsule */}
            <rect
              x="128"
              y="142"
              width="14"
              height="9"
              rx="4.5"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Mic tip indicator light */}
            <circle cx="132" cy="146.5" r="1.5" fill="#38bdf8" />

            {/* 6. Dynamic Eyes & Mouth inside Visor */}
            <g
              className={`syncy-eyes ${isBlinking ? "syncy-blinking" : ""} ${
                isThinking ? "syncy-thinking" : ""
              }`}
              transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}
            >
              {isHappy ? (
                /* Joyful Crescent Eyes on Hover */
                <>
                  <path
                    d="M 68 95 C 68 85, 84 85, 84 95"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 116 95 C 116 85, 132 85, 132 95"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                /* Round Expressive Eyes */
                <>
                  {/* Left Eye */}
                  <ellipse
                    cx="76"
                    cy="93"
                    rx="9.5"
                    ry="10.5"
                    fill="#38bdf8"
                  />
                  {/* Left Eye Pupil highlight */}
                  <circle cx="79" cy="90" r="3" fill="#ffffff" opacity="0.9" />

                  {/* Right Eye */}
                  <ellipse
                    cx="124"
                    cy="93"
                    rx="9.5"
                    ry="10.5"
                    fill="#38bdf8"
                  />
                  {/* Right Eye Pupil highlight */}
                  <circle cx="127" cy="90" r="3" fill="#ffffff" opacity="0.9" />
                </>
              )}

              {/* Smile */}
              <path
                d={
                  isHappy
                    ? "M 91 109 Q 100 120 109 109"
                    : "M 92 110 Q 100 117 108 110"
                }
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </g>
          </g>
        </svg>

        {/* Soft ground shadow */}
        <div className="syncy-ground-shadow" />
      </div>

      {showBadge && (
        <span className="syncy-badge">
          {badgeText}
        </span>
      )}
    </div>
  );
}
