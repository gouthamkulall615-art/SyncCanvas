import { motion, useReducedMotion } from "framer-motion";
import "./MiniCanvasDemo.css";


const RECT = { x: 690, y: 119, w: 130, h: 87 };
const CIRCLE = { cx: 547, cy: 362, r: 40 };

const rectCursorPath = [
  { x: RECT.x, y: RECT.y },
  { x: RECT.x + RECT.w, y: RECT.y },
  { x: RECT.x + RECT.w, y: RECT.y + RECT.h },
  { x: RECT.x, y: RECT.y + RECT.h },
  { x: RECT.x, y: RECT.y },
];

// Roughly evenly spaced points around the circle, starting at the top.
const circleCursorPath = Array.from({ length: 9 }, (_, i) => {
  const angle = -Math.PI / 2 + (i / 8) * Math.PI * 2;
  return {
    x: CIRCLE.cx + Math.cos(angle) * CIRCLE.r,
    y: CIRCLE.cy + Math.sin(angle) * CIRCLE.r,
  };
});

const DRAW_DURATION = 1.8;
const HOLD_DURATION = 1.6;
const CYCLE = DRAW_DURATION + HOLD_DURATION;

function Cursor({ label, color, path, delay, reduceMotion }) {
  if (reduceMotion) {
    const mid = path[Math.floor(path.length / 2)];
    return (
      <g transform={`translate(${mid.x}, ${mid.y})`}>
        <path d="M0 0 L0 12 L4 9 L7 15 L9 14 L6 8 L11 8 Z" fill={color} />
        <foreignObject x="12" y="-4" width="80" height="26">
          <div className="mcd-pill" style={{ background: color }}>
            {label}
          </div>
        </foreignObject>
      </g>
    );
  }

  return (
    <motion.g
      animate={{ x: path.map((p) => p.x), y: path.map((p) => p.y) }}
      transition={{
        duration: DRAW_DURATION,
        delay,
        times: path.map((_, i) => i / (path.length - 1)),
        repeat: Infinity,
        repeatDelay: HOLD_DURATION,
        ease: "easeInOut",
      }}
    >
      <path d="M0 0 L0 12 L4 9 L7 15 L9 14 L6 8 L11 8 Z" fill={color} />
      <foreignObject x="12" y="-4" width="80" height="26">
        <div className="mcd-pill" style={{ background: color }}>
          {label}
        </div>
      </foreignObject>
    </motion.g>
  );
}

export default function MiniCanvasDemo() {
  const reduceMotion = useReducedMotion();

  const rectDraw = reduceMotion
    ? { pathLength: 0.5 }
    : {
        pathLength: [0, 1, 1],
        opacity: [1, 1, 0],
      };

  const circleDraw = reduceMotion
    ? { pathLength: 0.5 }
    : {
        pathLength: [0, 1, 1],
        opacity: [1, 1, 0],
      };

  return (
    <div className="mcd-panel">
      <div className="mcd-dots" aria-hidden="true" />

      {/* Toolbar */}
      <div className="mcd-toolbar" aria-hidden="true">
        <span className="mcd-tool">✦</span>
        <span className="mcd-tool mcd-tool--active">✎</span>
        <span className="mcd-tool">▭</span>
        <span className="mcd-tool">T</span>
        <span className="mcd-tool">🗒</span>
      </div>

      <svg viewBox="0 0 1053 577" className="mcd-svg" aria-hidden="true">
        {/* Sticky note */}
        <g transform="translate(170, 122) rotate(-1)">
          <rect
            width="200"
            height="100"
            rx="10"
            fill="#3a1d5c"
            stroke="#7c3aed"
            strokeWidth="1"
          />
          <text
            x="16"
            y="24"
            fill="#c4b5fd"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.5"
          >
            STICKY NOTE
          </text>
          <text x="16" y="46" fill="#f5f5f5" fontSize="12" fontWeight="600">
            Auth flow sync
          </text>
          <text x="16" y="62" fill="#f5f5f5" fontSize="12" fontWeight="600">
            → token refresh logic
          </text>
          <text x="16" y="86" fill="#a78bfa" fontSize="10">
            Room #28
          </text>
          <circle cx="184" cy="88" r="3" fill="#c4b5fd" />
        </g>

        {/* Node: Client WebSocket */}
        <g transform="translate(270, 262)">
          <rect
            width="156"
            height="52"
            rx="10"
            fill="#14171d"
            stroke="#2a2f3a"
          />
          <circle cx="20" cy="26" r="5" fill="#34d399" />
          <text x="36" y="23" fill="#f5f5f5" fontSize="12" fontWeight="600">
            Client WebSocket
          </text>
          <text x="36" y="38" fill="#8a8f98" fontSize="10">
            Local state emitter
          </text>
        </g>

        {/* Node: Yjs Sync Server */}
        <g transform="translate(686, 262)">
          <rect
            width="156"
            height="52"
            rx="10"
            fill="#14171d"
            stroke="#2a2f3a"
          />
          <circle cx="20" cy="26" r="5" fill="#a855f7" />
          <text x="36" y="23" fill="#f5f5f5" fontSize="12" fontWeight="600">
            Yjs Sync Server
          </text>
          <text x="36" y="38" fill="#8a8f98" fontSize="10">
            CRDT state consensus
          </text>
        </g>

        {/* Dashed connector */}
        <path
          d="M 426 270 Q 556 220 686 280"
          fill="none"
          stroke="#a855f7"
          strokeWidth="1.5"
          strokeDasharray="4 5"
          opacity="0.8"
        />

        {/* Maya draws a rectangle */}
        <motion.rect
          x={RECT.x}
          y={RECT.y}
          width={RECT.w}
          height={RECT.h}
          rx="6"
          fill="none"
          stroke="#a855f7"
          strokeWidth="2"
          animate={rectDraw}
          transition={{
            duration: DRAW_DURATION,
            times: [0, 0.75, 1],
            repeat: Infinity,
            repeatDelay: HOLD_DURATION,
            ease: "easeInOut",
          }}
        />
        <Cursor
          label="Maya"
          color="#a855f7"
          path={rectCursorPath}
          delay={0}
          reduceMotion={reduceMotion}
        />

        {/* Theo draws a circle, offset so the two never sync perfectly */}
        <motion.circle
          cx={CIRCLE.cx}
          cy={CIRCLE.cy}
          r={CIRCLE.r}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          animate={circleDraw}
          transition={{
            duration: DRAW_DURATION,
            times: [0, 0.75, 1],
            repeat: Infinity,
            repeatDelay: HOLD_DURATION,
            delay: 1,
            ease: "easeInOut",
          }}
        />
        <Cursor
          label="Theo"
          color="#3b82f6"
          path={circleCursorPath}
          delay={1}
          reduceMotion={reduceMotion}
        />
      </svg>

      {/* Status bar */}
      <div className="mcd-status">
        <span className="mcd-status-left">
          <span className="mcd-dot" /> Synced with 2 peers (4ms ping)
        </span>
        <span>100% Zoom</span>
      </div>
    </div>
  );
}
