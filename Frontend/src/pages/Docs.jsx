import { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import {
  FiBookOpen,
  FiTerminal,
  FiCommand,
  FiServer,
  FiCheck,
  FiCopy,
} from "react-icons/fi";

const DOCS_SECTIONS = [
  {
    id: "quickstart",
    title: "Quick Start Guide",
    icon: <FiBookOpen className="w-4 h-4" />,
    content: (
      <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
        <p>
          SyncCanvas is designed to require zero installation for team members.
          A host creates a room session and shares the link along with a 6-digit
          PIN.
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#090c10] border border-zinc-800">
            <h4 className="font-bold text-white mb-1">
              1. Create a Workspace Session
            </h4>
            <p className="text-zinc-400 text-xs">
              From your Dashboard, click "Create Room". Choose a title (e.g.
              "Auth Service Architecture") and set participant limits (2 to 20
              seats).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#090c10] border border-zinc-800">
            <h4 className="font-bold text-white mb-1">
              2. Share the 6-Digit PIN
            </h4>
            <p className="text-zinc-400 text-xs">
              The URL contains a 24-byte secure session token. Guests will be
              prompted with the PIN gatekeeper modal before any socket connection
              is opened.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#090c10] border border-zinc-800">
            <h4 className="font-bold text-white mb-1">
              3. Draw & Model in Real-Time
            </h4>
            <p className="text-zinc-400 text-xs">
              Drop architecture nodes, draw connector lines, add notes, and watch
              live collaborator cursors with sub-millisecond CRDT updates.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    icon: <FiCommand className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400 mb-4">
          Navigate and manipulate diagrams at speed using canvas hotkeys:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: "V", action: "Select / Pointer Tool" },
            { key: "H", action: "Pan Hand Tool (Hold to Drag)" },
            { key: "R", action: "Draw Rectangle Node" },
            { key: "O", action: "Draw Circle Node" },
            { key: "P", action: "Pen / Freehand Stroke" },
            { key: "T", action: "Text Box Overlay" },
            { key: "Delete / Backspace", action: "Delete Selected Node" },
            { key: "Ctrl / Cmd + Z", action: "Undo Local Action" },
            { key: "Ctrl / Cmd + Scroll", action: "Zoom into Cursor Point" },
            { key: "Space + Drag", action: "Pan Canvas Quickly" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-[#090c10] border border-zinc-800/80"
            >
              <span className="text-xs text-zinc-300">{item.action}</span>
              <kbd className="px-2 py-1 rounded bg-[#161920] border border-zinc-700 text-zinc-300 font-mono text-[11px]">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "deployment",
    title: "Self-Hosting & Docker",
    icon: <FiTerminal className="w-4 h-4" />,
    content: (
      <div className="space-y-5 text-sm text-zinc-300 leading-relaxed">
        <p>
          SyncCanvas can be self-hosted on your own AWS EC2, VPS, or internal
          Kubernetes cluster using standard environment variables:
        </p>

        <div className="p-4 rounded-xl bg-[#090c10] border border-zinc-800 font-mono text-xs">
          <div className="text-zinc-500 mb-2">// Backend .config.env</div>
          <div className="text-purple-300">PORT=5000</div>
          <div className="text-purple-300">MONGO_URL=mongodb+srv://...</div>
          <div className="text-purple-300">JWT_SECRET=your_super_secret_jwt_key</div>
          <div className="text-purple-300">CLIENT_URL=http://localhost:5173</div>
        </div>

        <p className="text-xs text-zinc-400">
          Run both the Express server and YSocketIO sync server in a single
          container:
        </p>

        <div className="p-3 rounded-lg bg-[#090c10] border border-zinc-800 font-mono text-xs text-emerald-400">
          docker compose up --build -d
        </div>
      </div>
    ),
  },
  {
    id: "nodes",
    title: "System Design Nodes",
    icon: <FiServer className="w-4 h-4" />,
    content: (
      <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
        <p>
          SyncCanvas includes specialized vector microservice nodes designed for
          technical interviews and architectural reviews:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "API Server", color: "#20456b" },
            { name: "Database", color: "#523a10" },
            { name: "Cloud Bucket", color: "#1e3a8a" },
            { name: "Message Queue", color: "#374151" },
            { name: "Async Worker", color: "#3f3f46" },
            { name: "Web Client", color: "#1e293b" },
            { name: "Mobile App", color: "#0f172a" },
            { name: "Internet / CDN", color: "#1e1b4b" },
          ].map((node) => (
            <div
              key={node.name}
              className="p-3 rounded-xl border border-zinc-800 flex items-center justify-between"
              style={{ backgroundColor: node.color }}
            >
              <span className="text-xs font-semibold text-white">
                {node.name}
              </span>
              <span className="w-2 h-2 rounded-full bg-white/40" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function Docs() {
  const [activeTab, setActiveTab] = useState(DOCS_SECTIONS[0].id);
  const activeSection = DOCS_SECTIONS.find((s) => s.id === activeTab);

  return (
    <PageLayout
      badge="Developer Documentation"
      title="Guides, Controls & Specifications"
      subtitle="Comprehensive documentation for users, technical interviewers, and engineers self-hosting SyncCanvas."
    >
      <div className="flex flex-col md:flex-row gap-8 mb-16">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {DOCS_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === sec.id
                  ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  : "bg-[#13161c] text-zinc-400 hover:text-white hover:bg-[#181b22] border border-zinc-800/80"
              }`}
            >
              {sec.icon}
              <span>{sec.title}</span>
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="flex-1 bg-[#14171f]/90 border border-zinc-800/80 rounded-2xl p-6 md:p-8 min-h-[420px]">
          <div className="border-b border-zinc-800/80 pb-4 mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {activeSection.title}
            </h3>
            <span className="text-xs font-mono text-purple-400">
              Docs / {activeSection.id}
            </span>
          </div>

          <div>{activeSection.content}</div>
        </div>
      </div>
    </PageLayout>
  );
}
