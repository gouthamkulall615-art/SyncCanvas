import { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import {
  FiGithub,
  FiTerminal,
  FiDownload,
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiKey,
} from "react-icons/fi";
import { FaGoogle, FaDocker } from "react-icons/fa";

const INTEGRATIONS = [
  {
    id: "google",
    name: "Google OAuth 2.0",
    category: "Identity",
    icon: <FaGoogle className="w-6 h-6 text-red-400" />,
    status: "Live & Connected",
    desc: "Single sign-on using Google OAuth Identity tokens. Instant sign-in without remembering extra passwords.",
    actionText: "Configured",
    snippet: `// Frontend/src/pages/Login.jsx
const loginWithGoogle = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    const res = await api.post("/auth/google", { 
      access_token: tokenResponse.access_token 
    });
  }
});`,
  },
  {
    id: "github",
    name: "GitHub Ecosystem",
    category: "Developer Tools",
    icon: <FiGithub className="w-6 h-6 text-white" />,
    status: "Open Source",
    desc: "Direct repository connection, automated CI/CD checks, and open community issues/discussions.",
    actionText: "View Repository",
    link: "https://github.com/gouthamkulall615-art/SyncCanvas",
    snippet: `git clone https://github.com/gouthamkulall615-art/SyncCanvas.git
cd SyncCanvas
npm install`,
  },
  {
    id: "docker",
    name: "Docker & AWS ECS",
    category: "Deployment",
    icon: <FaDocker className="w-6 h-6 text-blue-400" />,
    status: "Production Ready",
    desc: "Self-host SyncCanvas anywhere using containerized images. Built-in health checks and environment configurations.",
    actionText: "Copy Run Command",
    snippet: `# Run with Docker container
docker build -t syncanvas:latest .
docker run -p 5000:5000 --env-file=.config.env syncanvas:latest`,
  },
  {
    id: "postman",
    name: "Postman Collections",
    category: "API Testing",
    icon: <FiTerminal className="w-6 h-6 text-orange-400" />,
    status: "Available",
    desc: "Exported collections in the repository for validating authentication, PIN verification, and rate limits.",
    actionText: "View Collections",
    snippet: `# Test PIN verification via cURL
curl -X POST http://localhost:5000/api/rooms/<TOKEN>/verify \\
  -H "Content-Type: application/json" \\
  -d '{"pin":"123456"}'`,
  },
  {
    id: "yjs",
    name: "Yjs CRDT Ecosystem",
    category: "Real-time Protocol",
    icon: <FiKey className="w-6 h-6 text-purple-400" />,
    status: "Core Dependency",
    desc: "Compatible with the entire Yjs ecosystem including y-indexeddb, y-webrtc, and custom persistence adapters.",
    actionText: "Inspect Spec",
    snippet: `import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

const ydoc = new Y.Doc();
const provider = new SocketIOProvider(serverUrl, roomToken, ydoc);`,
  },
  {
    id: "export",
    name: "PNG / Canvas Exporter",
    category: "Output & Sharing",
    icon: <FiDownload className="w-6 h-6 text-emerald-400" />,
    status: "Built-in",
    desc: "Export high-DPI raster diagrams directly from the canvas scene graph for presentations and technical specs.",
    actionText: "Ready",
    snippet: `// High-res pixelRatio export
const uri = stageRef.current.toDataURL({ 
  pixelRatio: 2, 
  mimeType: "image/png" 
});`,
  },
];

export default function Integrations() {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PageLayout
      badge="Ecosystem & Tools"
      title="Connect SyncCanvas with Your Workflow"
      subtitle="From OAuth authentication and Dockerized deployments to API suites and developer tools, SyncCanvas integrates smoothly into your stack."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {INTEGRATIONS.map((item) => (
          <div
            key={item.id}
            className="bg-[#13161c]/90 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-all hover:bg-[#161920]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0e1116] border border-zinc-800 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  {item.category}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                {item.name}
              </h3>

              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                {item.desc}
              </p>
            </div>

            <div>
              {/* Snippet box */}
              <div className="relative bg-[#090b0e] border border-zinc-900 rounded-lg p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto mb-4">
                <button
                  onClick={() => handleCopy(item.id, item.snippet)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Copy code"
                >
                  {copiedId === item.id ? (
                    <FiCheck className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <FiCopy className="w-3 h-3" />
                  )}
                </button>
                <pre className="pr-6">{item.snippet}</pre>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {item.status}
                </span>

                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {item.actionText} <FiExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => handleCopy(item.id, item.snippet)}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    {copiedId === item.id ? "Copied!" : "Copy Snippet"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
