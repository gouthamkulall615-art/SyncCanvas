import {
  FiMousePointer,
  FiSquare,
  FiCircle,
  FiTrash2,
  FiPenTool,
  FiEdit3,
  FiServer,
  FiDatabase,
  FiUser,
  FiCloud,
  FiLayers,
  FiCpu,
  FiGlobe,
  FiSmartphone,
  FiLock,
  FiArrowUpRight,
} from "react-icons/fi";
import { LuHand, LuDiamond } from "react-icons/lu";

export default function Toolbars({
  activeTool,
  setActiveTool,
  addRectangle,
  addCircle,
  addDiamond,
  addArchitectureNode,
  setShowClearModal,
}) {
  return (
    <>
      {/* 1. Top-Center General Drawing Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 rounded-xl px-1.5 py-1.5 flex items-center gap-0.5 shadow-2xl">
        {[
          { id: "select", icon: <FiMousePointer size={18} /> },
          { id: "pan", icon: <LuHand size={18} /> },
          { id: "arrow", icon: <FiArrowUpRight size={18} /> },
          { id: "rect", icon: <FiSquare size={18} />, action: addRectangle },
          { id: "circle", icon: <FiCircle size={18} />, action: addCircle },
          { id: "diamond", icon: <LuDiamond size={18} />, action: addDiamond },
          { id: "pen", icon: <FiPenTool size={18} /> },
          { id: "highlighter", icon: <FiEdit3 size={18} /> },
          {
            id: "text",
            icon: (
              <span className="text-[13px] font-bold font-serif leading-none tracking-tighter">
                Aa
              </span>
            ),
          },
        ].map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                if (tool.action) tool.action();
              }}
              className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent"
              }`}
              title={tool.id.charAt(0).toUpperCase() + tool.id.slice(1)}
            >
              {tool.icon}
            </button>
          );
        })}
      </div>

      {/* 2. Left-Side Vertical Architecture Toolbar */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2 z-50 bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 rounded-xl p-1.5 flex flex-col items-center gap-1 shadow-2xl">
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 mt-2 text-center">
          Sys
        </div>
        {[
          { id: "server", icon: <FiServer size={18} />, action: () => addArchitectureNode("server") },
          { id: "database", icon: <FiDatabase size={18} />, action: () => addArchitectureNode("database") },
          { id: "client", icon: <FiUser size={18} />, action: () => addArchitectureNode("client") },
          { id: "cloud", icon: <FiCloud size={18} />, action: () => addArchitectureNode("cloud") },
          { id: "queue", icon: <FiLayers size={18} />, action: () => addArchitectureNode("queue") },
          { id: "worker", icon: <FiCpu size={18} />, action: () => addArchitectureNode("worker") },
          { id: "internet", icon: <FiGlobe size={18} />, action: () => addArchitectureNode("internet") },
          { id: "mobile", icon: <FiSmartphone size={18} />, action: () => addArchitectureNode("mobile") },
          { id: "auth", icon: <FiLock size={18} />, action: () => addArchitectureNode("auth") },
        ].map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                if (tool.action) tool.action();
              }}
              className={`p-3 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent"
              }`}
              title={tool.id.charAt(0).toUpperCase() + tool.id.slice(1)}
            >
              {tool.icon}
            </button>
          );
        })}
      </div>

      {/* 3. Top-Right Global Actions */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setShowClearModal(true)}
          className="px-4 py-2 bg-[#1a1d24]/95 backdrop-blur-md border border-red-900/50 text-red-400 text-xs font-semibold tracking-wide uppercase rounded-xl hover:bg-red-500/10 hover:border-red-500/80 transition-all shadow-xl flex items-center gap-2"
        >
          <FiTrash2 size={14} />
          Clear Canvas
        </button>
      </div>
    </>
  );
}