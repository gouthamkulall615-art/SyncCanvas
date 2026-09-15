import { Atom, GitBranch, Radio, Server } from "lucide-react";
import "./SyncEngineSection.css";

const SOURCES = [
  { user: "USER A", label: "Local Vector Doc", meta: "WebRTC / wss:443" },
  { user: "USER B", label: "Browser Konva", meta: "WebRTC / wss:443" },
  { user: "USER C", label: "Web Client", meta: "WebRTC / wss:443" },
];

const STACK = [
  {
    icon: Atom,
    name: "React",
    desc: "Responsive canvas interface",
    color: "#61dafb",
  },
  {
    icon: GitBranch,
    name: "Yjs",
    desc: "Conflict-aware shared state",
    color: "#c084fc",
  },
  {
    icon: Radio,
    name: "Socket.IO",
    desc: "Real-time communication",
    color: "#f5f5f5",
  },
  {
    icon: Server,
    name: "Node.js",
    desc: "Collaboration backend",
    color: "#4ade80",
  },
];

export default function SyncEngineSection() {
  return (
    <section className="ses-section">
      <div className="ses-header">
        <span className="ses-eyebrow">Under the canvas</span>
        <h2 className="ses-heading">
          Real-time collaboration, <br className="ses-break" />
          without the waiting.
        </h2>
        <p className="ses-subheading">
          Every change is synchronized across connected users so everyone stays
          on the same canvas.
        </p>
      </div>

      <div className="ses-panel">
        {/* Source cards */}
        <div className="ses-sources">
          {SOURCES.map((s) => (
            <div className="ses-card" key={s.user}>
              <span className="ses-card-tag">{s.user}</span>
              <span className="ses-card-title">{s.label}</span>
              <span className="ses-card-meta">{s.meta}</span>
            </div>
          ))}
        </div>

        {/* Converging animated connectors */}
        <svg
          className="ses-lines ses-lines--top"
          viewBox="0 0 700 70"
          preserveAspectRatio="none"
        >
          <path className="ses-dash" d="M 90 0 C 200 40, 280 40, 350 70" />
          <path className="ses-dash" d="M 350 0 L 350 70" />
          <path className="ses-dash" d="M 610 0 C 500 40, 420 40, 350 70" />
        </svg>

        {/* Sync engine */}
        <div className="ses-engine">
          <span className="ses-engine-pill">
            <span className="ses-dot" /> Central CRDT broker
          </span>
          <h3 className="ses-engine-title">Sync Engine</h3>
          <p className="ses-engine-desc">
            Coordinates peer updates deterministically without centralized
            bottlenecking.
          </p>
          <div className="ses-engine-tags">
            <span>Yjs CRDT Document</span>
            <span>Socket.IO / WebSockets Engine</span>
            <span>Shared State Consensus</span>
          </div>
        </div>

        {/* Single animated connector down */}
        <svg
          className="ses-lines ses-lines--bottom"
          viewBox="0 0 20 60"
          preserveAspectRatio="none"
        >
          <path className="ses-dash ses-dash--cyan" d="M 10 0 L 10 60" />
        </svg>

        {/* Persistent state */}
        <div className="ses-persist">
          <span className="ses-persist-tag">Durable backend</span>
          <span className="ses-persist-title">Persistent State</span>
          <span className="ses-persist-meta">
            Postgres Snapshot Storage + Redis Ephemeral Buffer
          </span>
        </div>
      </div>

      {/* Tech stack row */}
      <div className="ses-stack">
        {STACK.map(({ icon: Icon, name, desc, color }) => (
          <div className="ses-stack-card" key={name}>
            <span className="ses-stack-icon" style={{ color }}>
              <Icon size={18} strokeWidth={2} />
            </span>
            <span className="ses-stack-name">{name}</span>
            <span className="ses-stack-desc">{desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
