import { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import { FiTag, FiCalendar, FiShield, FiZap, FiLayout } from "react-icons/fi";

const RELEASES = [
  {
    version: "v1.2.0",
    date: "Current Release",
    tag: "Security",
    title: "Dual-Key Gatekeeper & Memory Awareness Protocol",
    description:
      "Major security upgrade preventing premature WebSocket state leakage, adding brute-force defense, and inspecting live participant counts straight from RAM.",
    changes: [
      {
        type: "Security",
        text: "Pre-socket HTTP PIN gate prevents Yjs document leakage prior to authentication.",
      },
      {
        type: "Security",
        text: "5-attempt room lockout (10-minute cooldown) plus IP rate limiter on join-by-pin.",
      },
      {
        type: "Performance",
        text: "Live active user count reads directly from YSocketIO awareness instead of leaky database counters.",
      },
      {
        type: "UI",
        text: "Added 6-digit numeric input with auto-focus advancing and backspace backtracking.",
      },
    ],
  },
  {
    version: "v1.1.0",
    date: "Previous Release",
    tag: "Features",
    title: "Microservices Architecture Nodes & Smart Arrow Docking",
    description:
      "Introduced specialized system modeling nodes and dynamic connector arrows that follow moving shapes across the canvas.",
    changes: [
      {
        type: "Features",
        text: "Added 10 pre-styled architecture nodes: Server, Database, Client, Cloud, Queue, Worker, Mobile, and more.",
      },
      {
        type: "Features",
        text: "Dynamic arrow endpoints calculate intersection angles to stay docked on moving parent nodes.",
      },
      {
        type: "UI",
        text: "Integrated floating macOS-style action dock with spring magnification physics.",
      },
      {
        type: "Canvas",
        text: "Normalized Transformer scale factors to prevent stroke distortion during node resizing.",
      },
    ],
  },
  {
    version: "v1.0.0",
    date: "Initial Launch",
    tag: "Launch",
    title: "Core Real-Time Yjs Canvas & Google OAuth Launch",
    description:
      "Initial production release of SyncCanvas featuring conflict-free real-time whiteboard sync and Google authentication.",
    changes: [
      {
        type: "Core",
        text: "Yjs CRDT map integration with SocketIOProvider for deterministic multi-client convergence.",
      },
      {
        type: "Canvas",
        text: "Retained-mode 2D scene graph powered by Konva with pan, zoom, pen, and shape tools.",
      },
      {
        type: "Auth",
        text: "Dual authentication support: native email/password with bcrypt and Google OAuth 2.0.",
      },
      {
        type: "Database",
        text: "MongoDB Atlas setup with automated 24-hour TTL expiration on ephemeral room records.",
      },
    ],
  },
];

export default function Changelog() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filterOptions = ["All", "Security", "Features", "Core"];

  const filteredReleases = RELEASES.filter((rel) => {
    if (activeFilter === "All") return true;
    return (
      rel.tag.toLowerCase() === activeFilter.toLowerCase() ||
      rel.changes.some((c) => c.type.toLowerCase() === activeFilter.toLowerCase())
    );
  });

  return (
    <PageLayout
      badge="Release History"
      title="Continuous Improvements & Updates"
      subtitle="Track the architectural enhancements, performance optimizations, and new tools delivered to SyncCanvas."
    >
      {/* Category Filter Pills */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {filterOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setActiveFilter(opt)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeFilter === opt
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "bg-[#161920] text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="space-y-12 max-w-4xl mx-auto">
        {filteredReleases.map((rel) => (
          <div
            key={rel.version}
            className="relative pl-8 md:pl-10 border-l border-zinc-800"
          >
            {/* Timeline Dot */}
            <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-[#0e1116] border-2 border-purple-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            </div>

            <div className="bg-[#14171e]/90 border border-zinc-800/90 rounded-2xl p-6 md:p-8 hover:border-zinc-700 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white font-mono">
                    {rel.version}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 font-medium">
                    {rel.tag}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                  <FiCalendar className="w-3.5 h-3.5" />
                  <span>{rel.date}</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-zinc-100 mb-2">
                {rel.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {rel.description}
              </p>

              <div className="space-y-2.5 pt-4 border-t border-zinc-800/80">
                {rel.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-zinc-300"
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 mt-0.5 ${
                        change.type === "Security"
                          ? "bg-amber-950/40 text-amber-300 border border-amber-500/30"
                          : change.type === "Performance"
                            ? "bg-blue-950/40 text-blue-300 border border-blue-500/30"
                            : "bg-purple-950/40 text-purple-300 border border-purple-500/30"
                      }`}
                    >
                      {change.type}
                    </span>
                    <span className="leading-relaxed">{change.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
