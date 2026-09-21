import { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import {
  FiGithub,
  FiMessageSquare,
  FiTwitter,
  FiUsers,
  FiHeart,
  FiCode,
  FiCheck,
} from "react-icons/fi";
import { FaDiscord } from "react-icons/fa";

export default function Community() {
  const [joined, setJoined] = useState(false);

  const channels = [
    {
      title: "Discord Community",
      category: "Chat & Voice",
      icon: <FaDiscord className="w-6 h-6 text-[#5865F2]" />,
      desc: "Join fellow software architects, pair-programmers, and whiteboard enthusiasts. Ask questions and share feedback.",
      link: "https://discord.com",
      actionText: "Join Discord",
      members: "1,200+ online",
    },
    {
      title: "GitHub Discussions",
      category: "RFCs & Ideas",
      icon: <FiGithub className="w-6 h-6 text-white" />,
      desc: "Propose new system design nodes, request features, report canvas edge cases, and discuss architectural decisions.",
      link: "https://github.com/gouthamkulall615-art/SyncCanvas/discussions",
      actionText: "Open Discussions",
      members: "Active threads",
    },
    {
      title: "Open Source Contributions",
      category: "Development",
      icon: <FiCode className="w-6 h-6 text-emerald-400" />,
      desc: "Help improve the Yjs sync layer, build new Konva node transformers, or refine responsive mobile whiteboard controls.",
      link: "https://github.com/gouthamkulall615-art/SyncCanvas",
      actionText: "Contribute on GitHub",
      members: "Good First Issues",
    },
    {
      title: "Twitter / X Updates",
      category: "Announcements",
      icon: <FiTwitter className="w-6 h-6 text-sky-400" />,
      desc: "Follow the latest releases, micro-demos of upcoming CRDT features, and tips for designing scalable systems.",
      link: "https://twitter.com",
      actionText: "Follow Updates",
      members: "Weekly releases",
    },
  ];

  return (
    <PageLayout
      badge="Global Community"
      title="Built by Engineers, for Engineers"
      subtitle="SyncCanvas is an open-source movement to make technical whiteboarding fast, collaborative, and accessible to everyone."
    >
      {/* Community Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { label: "Open Source License", value: "MIT" },
          { label: "Active Contributors", value: "100% Free" },
          { label: "Session Conflict Rate", value: "0.0%" },
          { label: "Community Support", value: "24/7 Global" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#14171f]/80 border border-zinc-800 text-center"
          >
            <div className="text-xl md:text-2xl font-bold text-white mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-zinc-400 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {channels.map((chan) => (
          <div
            key={chan.title}
            className="bg-[#14171f]/90 border border-zinc-800/80 rounded-2xl p-6 md:p-8 flex flex-col justify-between hover:border-zinc-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0e1116] border border-zinc-800 flex items-center justify-center">
                  {chan.icon}
                </div>
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {chan.category}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{chan.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {chan.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium">
                {chan.members}
              </span>

              <a
                href={chan.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 text-xs font-semibold transition-all"
              >
                {chan.actionText} →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter / Join Community Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-[#181b24] to-purple-950/40 border border-purple-500/20 rounded-2xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
        <FiHeart className="w-8 h-8 text-purple-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">
          Stay in the loop with SyncCanvas
        </h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
          Get notified when new architecture node packs, spatial audio, or AI
          diagram generators go live.
        </p>

        {joined ? (
          <div className="inline-flex items-center gap-2 text-emerald-400 font-medium text-sm bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-xl">
            <FiCheck className="w-4 h-4" /> You're on the list! Welcome to the
            community.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setJoined(true);
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="engineer@company.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0c10] border border-zinc-800 text-white placeholder-zinc-600 text-sm outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </PageLayout>
  );
}
