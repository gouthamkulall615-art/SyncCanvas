import { useState } from "react";
import Navbar from "../components/dashboard/DashboardNavbar";
import WorkspaceCards from "../components/dashboard/WorkspaceCards";
import GradientWaves from "../components/ReactBits/GradientWaves";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white font-sans flex flex-col overflow-x-hidden">
      {/* Absolute Full-Screen Background Waves Layer */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <GradientWaves
          horizonColor="#050505"
          waveColor="#9333ea"
          crestColor="#e879f9"
          speed={0.3}
          amplitude={2.5}
          waveScale={0.6}
          opacity={0.8}
          mouseInteraction={true}
        />
      </div>

      {/* Foreground UI Layer */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-6">
          <WorkspaceCards
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery("")}
          />
        </main>
      </div>
    </div>
  );
}
