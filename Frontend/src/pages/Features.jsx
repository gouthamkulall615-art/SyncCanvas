import { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import { Link } from "react-router-dom";
import {
  FiZap,
  FiShield,
  FiCpu,
  FiUsers,
  FiLayers,
  FiCheckCircle,
  FiServer,
  FiDatabase,
  FiCloud,
  FiActivity,
} from "react-icons/fi";

const FEATURES_DATA = [
  {
    id: "crdt",
    title: "Yjs CRDT Real-Time Sync",
    badge: "Core Engine",
    icon: <FiZap className="w-6 h-6 text-purple-400" />,
    shortDesc:
      "Deterministic Conflict-Free Replicated Data Types resolve concurrent edits instantly without a locking coordinator.",
    bullets: [
      "Sub-millisecond local updates with binary state vectors",
      "Zero merge conflicts even under high network latency",
      "Seamless auto-reconnection and state convergence",
    ],
    highlight: "CRDT Math",
  },
  {
    id: "konva",
    title: "Retained-Mode 2D Canvas",
    badge: "Rendering",
    icon: <FiCpu className="w-6 h-6 text-blue-400" />,
    shortDesc:
      "Powered by Konva for smooth 60fps pan, zoom, freehand drawing, and bounding box shape transformations.",
    bullets: [
      "Hardware-accelerated HTML5 canvas rendering",
      "Color-keyed offscreen hit detection buffer",
      "Smooth pinch-to-zoom and pivot math navigation",
    ],
    highlight: "60 FPS",
  },
  {
    id: "arch",
    title: "Architecture Nodes & Dynamic Arrows",
    badge: "System Design",
    icon: <FiLayers className="w-6 h-6 text-emerald-400" />,
    shortDesc:
      "Drop microservice components directly onto the board and connect them with intelligent dynamic arrows.",
    bullets: [
      "Pre-styled Server, Database, Queue, Cloud, and Client nodes",
      "Smart connector arrows that follow docked nodes when moved",
      "Custom stroke colors, opacity, and typography controls",
    ],
    highlight: "Smart Docking",
  },
  {
    id: "security",
    title: "Dual-Key Room Security",
    badge: "Security",
    icon: <FiShield className="w-6 h-6 text-amber-400" />,
    shortDesc:
      "24-byte cryptographically secure room tokens paired with 6-digit PIN verification and automated rate limiting.",
    bullets: [
      "No WebSocket handshake until HTTP PIN verification clears",
      "5-attempt brute-force protection with 10-minute lockout",
      "24-hour automatic TTL purge on MongoDB session records",
    ],
    highlight: "Zero Leakage",
  },
  {
    id: "presence",
    title: "Live Multiplayer Presence",
    badge: "Collaboration",
    icon: <FiUsers className="w-6 h-6 text-pink-400" />,
    shortDesc:
      "See where teammates are looking and drawing with smooth color-coded cursor tracking and active user badges.",
    bullets: [
      "Episodic awareness protocol with heartbeat timeouts",
      "Real-time user count evaluated straight from memory",
      "Distinct cursor colors with nametag badges",
    ],
    highlight: "Awareness",
  },
  {
    id: "tools",
    title: "Creative Freehand & Focus Tools",
    badge: "Whiteboarding",
    icon: <FiActivity className="w-6 h-6 text-cyan-400" />,
    shortDesc:
      "Pen tools, highlighters, native text editing overlays, and dark/light mode toggle designed for modern work.",
    bullets: [
      "Non-distorting vector transformation normalization",
      "Scoped undo/redo via Y.UndoManager for local edits only",
      "Exportable canvas states with one-click snapshot options",
    ],
    highlight: "Full Toolkit",
  },
];

export default function Features() {
  const [selectedFeature, setSelectedFeature] = useState(FEATURES_DATA[0]);

  return (
    <PageLayout
      badge="Product Capabilities"
      title="Engineered for Real-Time System Design"
      subtitle="Everything you need to sketch architectures, run brainstorming sessions, and build diagrams alongside your team without lag or conflicts."
    >
      {/* Interactive Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {FEATURES_DATA.map((feat) => {
          const isSelected = selectedFeature.id === feat.id;
          return (
            <div
              key={feat.id}
              onClick={() => setSelectedFeature(feat)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-[#1a1d24] border-purple-500/80 shadow-[0_0_30px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30"
                  : "bg-[#13161c]/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-[#181b22]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0e1116] border border-zinc-800 flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <span className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  {feat.shortDesc}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-medium">
                <span>{feat.highlight}</span>
                <span className="text-purple-400 flex items-center gap-1">
                  {isSelected ? "Active Preview" : "Explore →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Interactive Details Card */}
      <div className="bg-[#1a1d24]/95 border border-zinc-800 rounded-2xl p-8 mb-16 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[100px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2 block">
              Feature Spotlight • {selectedFeature.badge}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {selectedFeature.title}
            </h2>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6">
              {selectedFeature.shortDesc}
            </p>

            <div className="space-y-3">
              {selectedFeature.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <FiCheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Visual Sandbox Widget */}
          <div className="w-full lg:w-96 bg-[#0e1116] border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Live Simulation
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="h-44 bg-[#14171f] rounded-lg border border-dashed border-zinc-800 relative flex items-center justify-center overflow-hidden p-4">
              {selectedFeature.id === "arch" && (
                <div className="flex items-center gap-6">
                  <div className="px-3 py-2 rounded-lg bg-[#20456b] border border-blue-400/50 text-blue-200 text-xs flex items-center gap-1.5 shadow-lg">
                    <FiServer className="w-3.5 h-3.5" /> API Gateway
                  </div>
                  <div className="text-zinc-600 text-sm">──►</div>
                  <div className="px-3 py-2 rounded-lg bg-[#523a10] border border-amber-400/50 text-amber-200 text-xs flex items-center gap-1.5 shadow-lg">
                    <FiDatabase className="w-3.5 h-3.5" /> Database
                  </div>
                </div>
              )}
              {selectedFeature.id === "crdt" && (
                <div className="text-center font-mono text-xs space-y-2">
                  <div className="text-purple-300 bg-purple-950/40 px-3 py-1 rounded border border-purple-500/30">
                    Peer A: updateVector(doc, 0x9F4A)
                  </div>
                  <div className="text-zinc-500">↕ Synchronized ↕</div>
                  <div className="text-emerald-300 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-500/30">
                    Peer B: Lamport Merge (Zero Conflict)
                  </div>
                </div>
              )}
              {selectedFeature.id === "security" && (
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FiShield className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-zinc-300 font-mono">
                    Token: 24-byte base64url
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    PIN Gate: Passed • Socket Allowed
                  </div>
                </div>
              )}
              {selectedFeature.id !== "arch" &&
                selectedFeature.id !== "crdt" &&
                selectedFeature.id !== "security" && (
                  <div className="text-center space-y-2">
                    <div className="inline-block p-3 rounded-full bg-purple-500/10 text-purple-400">
                      {selectedFeature.icon}
                    </div>
                    <div className="text-xs text-zinc-300 font-medium">
                      {selectedFeature.title} Active
                    </div>
                  </div>
                )}
            </div>

            <Link
              to="/dashboard"
              className="w-full text-center py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Try This Feature Live →
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
