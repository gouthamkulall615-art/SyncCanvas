import { useNavigate } from "react-router-dom";
import ShapeGrid from "../components/ShapeGrid";
import Navbar from "../components/LandingNavbar";
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-[#0e1116] text-white overflow-hidden flex flex-col items-center justify-start pt-32 font-sans">
      <Navbar />
      {/* Background Animated Purple Grid Layer */}
      <div className="absolute inset-0 z-0 opacity-40">
        <ShapeGrid
          speed={0.4}
          squareSize={40}
          direction="diagonal"
          borderColor="#4c1d95"
          hoverFillColor="#581c87"
          shape="square"
          hoverTrailAmount={2}
        />
      </div>

      {/* Hero Content Layer */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        {/* Top Feature Pill */}
        <div className="mb-8 px-4 py-1.5 rounded-full border border-purple-500/20 bg-[#1a1d24]/90 backdrop-blur-md text-sm text-purple-300 flex items-center gap-2 shadow-sm cursor-default">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          <span>Real-time collaborative workspace</span>
        </div>

        {/* Clean, Solid Text Headline (No AI Gradients) */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white leading-[1.1]">
          Collaborate on a Whiteboard, <br />
          <span className="text-purple-400">Together in Real-Time.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl font-normal leading-relaxed">
          Sketch ideas, draw diagrams, and brainstorm with your team instantly.
          Powered by low-latency CRDT sync so everyone stays on the exact same
          page.
        </p>

        {/* Action Buttons (Subdued, Clean Glow) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/workspace?pin=12345")}
            className="px-6 py-3.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-500 transition-all shadow-[0_4px_20px_rgba(147,51,234,0.2)]"
          >
            Launch Workspace
          </button>
          <button className="px-6 py-3.5 bg-[#1a1d24] border border-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-800 hover:text-white transition-colors">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
