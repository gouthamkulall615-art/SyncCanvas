import { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import { FiThumbsUp, FiCheckCircle, FiClock, FiCompass } from "react-icons/fi";

const INITIAL_ROADMAP = [
  {
    id: "pdf-export",
    column: "In Progress",
    title: "Multi-Page PDF & Vector SVG Export",
    desc: "Export architectural diagrams into scalable vector SVGs or print-ready multi-page PDFs with transparent backgrounds.",
    votes: 84,
    tags: ["Export", "Canvas"],
  },
  {
    id: "audio-chat",
    column: "In Progress",
    title: "In-Canvas Spatial Audio & WebRTC Rooms",
    desc: "Talk with collaborators directly inside the room session using lightweight peer-to-peer WebRTC audio.",
    votes: 112,
    tags: ["Collaboration", "Audio"],
  },
  {
    id: "ai-diagrams",
    column: "Planned",
    title: "AI Prompt to Architecture Diagram",
    desc: "Describe a cloud topology (e.g. 'Load balanced Express cluster with MongoDB & WebSockets') and generate instant nodes and arrows.",
    votes: 156,
    tags: ["AI", "Architecture"],
  },
  {
    id: "infinite-history",
    column: "Planned",
    title: "Time-Travel Session Replay & S3 Backups",
    desc: "Save snapshots to S3 or MongoDB and scrub backward through the timeline to see how a diagram evolved over time.",
    votes: 95,
    tags: ["Persistence", "CRDT"],
  },
  {
    id: "templates",
    column: "Under Review",
    title: "System Design Template Library",
    desc: "Pre-built templates for Kubernetes clusters, microservices, OAuth authentication flows, and event-driven architectures.",
    votes: 73,
    tags: ["Templates", "UI"],
  },
  {
    id: "markdown-notes",
    column: "Under Review",
    title: "Sticky Markdown Notes & Code Blocks",
    desc: "Add rich-text syntax-highlighted code snippets and markdown checklists alongside architecture nodes.",
    votes: 61,
    tags: ["Notes", "Editor"],
  },
];

export default function Roadmap() {
  const [items, setItems] = useState(INITIAL_ROADMAP);
  const [votedIds, setVotedIds] = useState(new Set());

  const handleVote = (id) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const hasVoted = votedIds.has(id);
          return {
            ...item,
            votes: hasVoted ? item.votes - 1 : item.votes + 1,
          };
        }
        return item;
      }),
    );

    setVotedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns = [
    {
      name: "In Progress",
      icon: <FiClock className="w-4 h-4 text-purple-400" />,
      badgeClass: "bg-purple-950/40 text-purple-300 border-purple-500/30",
    },
    {
      name: "Planned",
      icon: <FiCompass className="w-4 h-4 text-blue-400" />,
      badgeClass: "bg-blue-950/40 text-blue-300 border-blue-500/30",
    },
    {
      name: "Under Review",
      icon: <FiCheckCircle className="w-4 h-4 text-zinc-400" />,
      badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
    },
  ];

  return (
    <PageLayout
      badge="Public Roadmap"
      title="Where SyncCanvas Is Heading Next"
      subtitle="Community-driven roadmap for our collaborative engine. Upvote features you want to see built or pitch your ideas."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {columns.map((col) => {
          const colItems = items.filter((item) => item.column === col.name);
          return (
            <div key={col.name} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 px-1">
                <div className="flex items-center gap-2 font-semibold text-sm text-zinc-200">
                  {col.icon}
                  <span>{col.name}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 font-mono">
                  {colItems.length}
                </span>
              </div>

              <div className="space-y-4">
                {colItems.map((card) => {
                  const hasVoted = votedIds.has(card.id);
                  return (
                    <div
                      key={card.id}
                      className="bg-[#14171f]/90 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800/70 text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <h4 className="text-base font-bold text-white mb-2 leading-snug">
                          {card.title}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                          {card.desc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-medium">
                          {card.votes} community votes
                        </span>

                        <button
                          onClick={() => handleVote(card.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            hasVoted
                              ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                              : "bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700"
                          }`}
                        >
                          <FiThumbsUp
                            className={`w-3.5 h-3.5 ${hasVoted ? "fill-white" : ""}`}
                          />
                          <span>{hasVoted ? "Upvoted" : "Upvote"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
