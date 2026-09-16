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
import { FloatingDock, FloatingDockVertical } from "./FloatingDock";

export default function Toolbars({
  activeTool,
  setActiveTool,
  addRectangle,
  addCircle,
  addDiamond,
  addArchitectureNode,
  setShowClearModal,
}) {
  const drawItems = [
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
  ].map((tool) => ({
    title: tool.id.charAt(0).toUpperCase() + tool.id.slice(1),
    icon: tool.icon,
    isActive: activeTool === tool.id,
    onClick: () => {
      setActiveTool(tool.id);
      if (tool.action) tool.action();
    },
  }));

  const archItems = [
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
  ].map((tool) => ({
    title: tool.id.charAt(0).toUpperCase() + tool.id.slice(1),
    icon: tool.icon,
    isActive: activeTool === tool.id,
    onClick: () => {
      setActiveTool(tool.id);
      if (tool.action) tool.action();
    },
  }));

  return (
    <>
      {/* 1. Top-Center General Drawing Toolbar */}
      <FloatingDock
        items={drawItems}
        className="absolute top-6 left-1/2 -translate-x-1/2 z-50 mx-auto flex h-16 items-end gap-4 rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 px-4 pb-3 shadow-2xl"
      />

      {/* 2. Left-Side Vertical Architecture Toolbar */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2 z-50 flex flex-col items-center">
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 text-center">
          Sys
        </div>
        <FloatingDockVertical
          items={archItems}
          className="flex w-16 flex-col items-end gap-4 rounded-2xl bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 py-4 pr-3 shadow-2xl"
        />
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
