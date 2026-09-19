import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import ShapeGrid from "../components/ReactBits/ShapeGrid";
import Navbar from "../components/landing/LandingNavbar";
import MiniCanvasDemo from "../components/landing/MiniCanvasDemo";
import WavyRibbon from "../components/ReactBits/WavyRibbon";
import CollaborativeSection from "../components/landing/CollaborativeSection";
import SyncEngineSection from "../components/landing/SyncEngineSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  const navigate = useNavigate();
  // 1. Create a reference for the section you want to scroll to
  const howItWorksRef = useRef(null);

  const handleLaunch = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/dashboard" : "/register");
  };

  // 2. Create the scroll handler with smooth behavior
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0e1116] text-white overflow-hidden flex flex-col items-center justify-start pt-32 font-sans">
      <Navbar />

      {/* Background Animated Purple Grid Layer */}
      <div
        className="absolute inset-0 z-0 opacity-40"
        style={{
          maskImage: "linear-gradient(to bottom, black 55%, transparent 95%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 55%, transparent 95%)",
        }}
      >
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
          <span>Live now. Draw with anyone, instantly.</span>
        </div>

        <h1 className="mb-6 text-white leading-[1.05]">
          <span className="block text-2xl md:text-3xl font-medium text-zinc-400 mb-2 tracking-tight">
            This is SyncCanvas.
          </span>
          <span className="block text-5xl md:text-7xl font-bold tracking-tight text-purple-400">
            One canvas. Everyone's hands on it.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl font-normal leading-relaxed">
          Sketch ideas or map out a system with your team, all on one canvas,
          all at once. No exporting, no waiting for someone to catch up.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLaunch}
            className="px-6 py-3.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-500 transition-all shadow-[0_4px_20px_rgba(147,51,234,0.2)]"
          >
            Open a canvas
          </button>

          {/* 3. Attach the scroll handler to the button */}
          <button
            onClick={scrollToHowItWorks}
            className="px-6 py-3.5 bg-[#1a1d24] border border-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-800 hover:text-white transition-colors"
          >
            See how it works
          </button>
        </div>
      </div>

      {/* Live mini-canvas demo */}
      <div className="relative z-10 w-full max-w-5xl px-6 mt-20 mb-16 md:mb-20">
        <MiniCanvasDemo />
        <p className="text-lg md:text-xl text-zinc-400 text-center max-w-xl mx-auto mt-8">
          Sketch freely. Map out systems. Watch it happen together.
        </p>
      </div>

      {/* Wavy Ribbon */}
      <div className="relative z-10 w-full pointer-events-none">
        <div className="block md:hidden">
          <WavyRibbon
            text="Real-Time Collaboration  ✦  Sub-Millisecond Sync  ✦  CRDT Powered  ✦  "
            shape="wave"
            curviness={20}
            ribbonColor="#9333ea"
            ribbonWidth={110}
            color="#ffffff"
            speed={45}
          />
        </div>
        <div className="hidden md:block">
          <WavyRibbon
            text="Real-Time Collaboration  ✦  Sub-Millisecond Sync  ✦  CRDT Powered  ✦  "
            shape="wave"
            curviness={30}
            ribbonColor="#9333ea"
            ribbonWidth={70}
            color="#ffffff"
            speed={60}
          />
        </div>
      </div>

      {/* Collaborative Features Section */}
      <div className="relative z-10 w-full mt-10 md:mt-16">
        <CollaborativeSection />
      </div>

      {/* Sync Engine Architecture Section */}
      <div className="relative z-10 w-full mt-10 md:mt-16">
        <SyncEngineSection />
      </div>

      {/* 4. Attach the ref to the target section wrapper */}
      <div
        ref={howItWorksRef}
        className="relative z-10 w-full mt-10 md:mt-16 mb-20 scroll-mt-24"
      >
        <HowItWorksSection />
      </div>

      <div className="relative z-10 w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
}
