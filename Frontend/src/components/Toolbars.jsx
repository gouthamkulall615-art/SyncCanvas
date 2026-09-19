import { useState } from "react";
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
  FiGrid,
  FiX,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { LuHand, LuDiamond } from "react-icons/lu";
import { FloatingDock, FloatingDockVertical } from "./FloatingDock";

export default function Toolbars({
  activeTool,
  setActiveTool,
  addRectangle,
  addCircle,
  addDiamond,
  addArchitectureNode,
  setShowClearModal,
  theme,
  onToggleTheme,
}) {
  // Controls the mobile-only architecture drawer (there's no left column on
  // small screens, so these tools live behind a toggle instead).
  const [archOpen, setArchOpen] = useState(false);

  const drawTools = [
    { id: "select", icon: <FiMousePointer size="100%" /> },
    { id: "pan", icon: <LuHand size="100%" /> },
    { id: "arrow", icon: <FiArrowUpRight size="100%" /> },
    { id: "rect", icon: <FiSquare size="100%" />, action: addRectangle },
    { id: "circle", icon: <FiCircle size="100%" />, action: addCircle },
    { id: "diamond", icon: <LuDiamond size="100%" />, action: addDiamond },
    { id: "pen", icon: <FiPenTool size="100%" /> },
    { id: "highlighter", icon: <FiEdit3 size="100%" /> },
    {
      id: "text",
      icon: (
        <span className="text-[13px] font-bold font-serif leading-none tracking-tighter">
          Aa
        </span>
      ),
    },
  ];

  const archTools = [
    {
      id: "server",
      icon: <FiServer size="100%" />,
      action: () => addArchitectureNode("server"),
    },
    {
      id: "database",
      icon: <FiDatabase size="100%" />,
      action: () => addArchitectureNode("database"),
    },
    {
      id: "client",
      icon: <FiUser size="100%" />,
      action: () => addArchitectureNode("client"),
    },
    {
      id: "cloud",
      icon: <FiCloud size="100%" />,
      action: () => addArchitectureNode("cloud"),
    },
    {
      id: "queue",
      icon: <FiLayers size="100%" />,
      action: () => addArchitectureNode("queue"),
    },
    {
      id: "worker",
      icon: <FiCpu size="100%" />,
      action: () => addArchitectureNode("worker"),
    },
    {
      id: "internet",
      icon: <FiGlobe size="100%" />,
      action: () => addArchitectureNode("internet"),
    },
    {
      id: "mobile",
      icon: <FiSmartphone size="100%" />,
      action: () => addArchitectureNode("mobile"),
    },
    {
      id: "auth",
      icon: <FiLock size="100%" />,
      action: () => addArchitectureNode("auth"),
    },
  ];

  const toDockItem = (tool) => ({
    title: tool.id.charAt(0).toUpperCase() + tool.id.slice(1),
    icon: tool.icon,
    isActive: activeTool === tool.id,
    onClick: () => {
      setActiveTool(tool.id);
      if (tool.action) tool.action();
    },
  });

  const drawItems = drawTools.map(toDockItem);
  const archItems = archTools.map(toDockItem);

  return (
    <>
      {/* =========================================================
          DESKTOP (md and up) — unchanged from before
      ========================================================= */}
      <FloatingDock
        items={drawItems}
        className="hidden md:flex absolute top-6 left-1/2 -translate-x-1/2 z-50 mx-auto h-16 items-end gap-4 rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 px-4 pb-2 shadow-2xl"
      />

      {/* Pinned between the header card (~top-48) and the zoom bar
          (~bottom-28), then centered WITHIN that gap via flexbox — not
          centered on the full viewport, which is what let this dock drift
          up into the header card on tall screens. Adjust top-48/bottom-28
          if the header card or zoom bar's own height ever changes. */}
      <div className="hidden md:flex absolute left-6 top-48 bottom-28 z-40 flex-col items-center justify-center">
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 text-center">
          Sys
        </div>
        <FloatingDockVertical
          items={archItems}
          className="flex w-16 flex-col items-end gap-4 rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 py-4 pr-2 shadow-2xl"
        />
      </div>

      {/* Theme toggle + Clear Canvas — icon-only circles on mobile, full pill on desktop */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          title={
            theme === "dark"
              ? "Switch canvas to light"
              : "Switch canvas to dark"
          }
          className="flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 rounded-full md:rounded-xl bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 text-zinc-300 hover:text-white shadow-xl transition-all"
        >
          {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>

        <button
          onClick={() => setShowClearModal(true)}
          title="Clear Canvas"
          className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto rounded-full md:rounded-xl md:px-4 md:py-2 bg-[#1a1d24]/95 backdrop-blur-md border border-red-900/50 text-red-400 shadow-xl transition-all hover:bg-red-500/10 hover:border-red-500/80"
        >
          <FiTrash2 size={16} />
          <span className="hidden md:inline text-xs font-semibold tracking-wide uppercase">
            Clear Canvas
          </span>
        </button>
      </div>

      {/* =========================================================
          MOBILE (below md)
      ========================================================= */}

      {/* Backdrop for the architecture drawer */}
      {archOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setArchOpen(false)}
        />
      )}

      {/* Architecture drawer — slides up above the bottom dock */}
      {archOpen && (
        <div className="md:hidden fixed bottom-24 inset-x-4 z-50 rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Architecture
            </span>
            <button
              onClick={() => setArchOpen(false)}
              className="text-zinc-500 hover:text-white"
            >
              <FiX size={16} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {archTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  if (tool.action) tool.action();
                  setArchOpen(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-[9px] font-medium transition-colors ${activeTool === tool.id
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                    : "bg-zinc-800/50 text-zinc-400 border border-transparent"
                  }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  {tool.icon}
                </span>
                {tool.id.charAt(0).toUpperCase() + tool.id.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom dock — draw tools + a toggle for the architecture drawer */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-50">
        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 px-2 py-2 shadow-2xl">
          {drawTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                if (tool.action) tool.action();
              }}
              className={`flex-none flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${activeTool === tool.id
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                  : "text-zinc-400 border border-transparent"
                }`}
            >
              <span className="w-[18px] h-[18px] flex items-center justify-center">
                {tool.icon}
              </span>
            </button>
          ))}

          <div className="w-px h-6 bg-zinc-800 mx-1 flex-none" />

          <button
            onClick={() => setArchOpen((v) => !v)}
            title="Architecture tools"
            className={`flex-none flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${archOpen
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                : "text-zinc-400 border border-transparent"
              }`}
          >
            <FiGrid size={18} />
          </button>
        </div>
      </div>
    </>
  );
}