import { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Transformer,
  Group,
  Path,
  Text,
  Label,
  Tag,
  Line,
  RegularPolygon,
} from "react-konva";
import {
  FiMousePointer,
  FiSquare,
  FiCircle,
  FiTrash2,
  FiMoreVertical,
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
} from "react-icons/fi";
import { LuHand, LuDiamond } from "react-icons/lu";
import { ArchitectureNode } from "./ArchitectureNodes";
import "./CanvasBoard.css";

let idCounter = 0;
const nextId = () => `shape-${Date.now()}-${idCounter++}`;

export default function CanvasBoard({ shapesMap, awareness }) {
  const [shapes, setShapes] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [drawingShapeId, setDrawingShapeId] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);

  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [editingTextId]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!shapesMap) return;
    const syncFromMap = () => {
      const arr = [];
      shapesMap.forEach((value, key) => arr.push({ ...value, id: key }));
      setShapes(arr);
    };
    syncFromMap();
    shapesMap.observe(syncFromMap);
    return () => shapesMap.unobserve(syncFromMap);
  }, [shapesMap]);

  useEffect(() => {
    if (!awareness) return;
    const updateCursors = () => {
      const states = Array.from(awareness.getStates().entries());
      const localClientId = awareness.doc.clientID;
      const others = states
        .filter(
          ([clientId, state]) =>
            String(clientId) !== String(localClientId) && state?.user?.cursor,
        )
        .map(([clientId, state]) => ({ clientId, ...state.user }));
      setRemoteUsers(others);
    };
    awareness.on("change", updateCursors);
    return () => awareness.off("change", updateCursors);
  }, [awareness]);

  useEffect(() => {
    if (!transformerRef.current) return;
    const stage = stageRef.current;
    const selectedNode = selectedId ? stage.findOne(`#${selectedId}`) : null;
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
    } else {
      transformerRef.current.nodes([]);
    }
    transformerRef.current.getLayer().batchDraw();
  }, [selectedId, shapes]);

  const handleStageMouseDown = (e) => {
    if (activeTool === "pan") return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (activeTool === "select") {
      if (e.target === stage) setSelectedId(null);
      return;
    }

    if (activeTool === "pen" || activeTool === "highlighter") {
      setIsDrawing(true);
      setSelectedId(null);
      const id = nextId();
      shapesMap.set(id, {
        type: "line",
        points: [pos.x, pos.y],
        fill: "transparent",
        stroke: activeTool === "highlighter" ? "#f59e0b" : "#ffffff",
        strokeWidth: activeTool === "highlighter" ? 14 : 3,
        opacity: activeTool === "highlighter" ? 0.4 : 1,
        dash: [],
      });
      setDrawingShapeId(id);
    }

    if (activeTool === "text") {
      const id = nextId();
      shapesMap.set(id, {
        type: "text",
        x: pos.x,
        y: pos.y,
        text: "",
        fill: "#ffffff",
        fontSize: 24,
      });
      setSelectedId(id);
      setEditingTextId(id);
      setActiveTool("select");
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (awareness) {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const state = awareness.getLocalState();
      if (state?.user && point) {
        awareness.setLocalStateField("user", {
          ...state.user,
          cursor: { x: point.x, y: point.y },
        });
      }
    }

    if (!isDrawing || (activeTool !== "pen" && activeTool !== "highlighter"))
      return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const existing = shapesMap.get(drawingShapeId);

    if (existing && existing.type === "line") {
      shapesMap.set(drawingShapeId, {
        ...existing,
        points: [...existing.points, point.x, point.y],
      });
    }
  };

  const handleStageMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setDrawingShapeId(null);
    }
  };

  const handleMouseLeave = () => {
    if (isDrawing) setIsDrawing(false);
    if (!awareness) return;
    const state = awareness.getLocalState();
    if (state?.user)
      awareness.setLocalStateField("user", { ...state.user, cursor: null });
  };

  const addRectangle = () => {
    const id = nextId();
    shapesMap.set(id, {
      type: "rect",
      x: 300,
      y: 200,
      width: 120,
      height: 120,
      fill: "#20456b",
      stroke: "#5ca4f8",
      strokeWidth: 2,
      dash: [],
    });
    setSelectedId(id);
    setActiveTool("select");
  };

  const addCircle = () => {
    const id = nextId();
    shapesMap.set(id, {
      type: "circle",
      x: 450,
      y: 250,
      radius: 60,
      fill: "#63292b",
      stroke: "#ff8a8a",
      strokeWidth: 2,
      dash: [],
    });
    setSelectedId(id);
    setActiveTool("select");
  };

  const addDiamond = () => {
    const id = nextId();
    shapesMap.set(id, {
      type: "diamond",
      x: 500,
      y: 300,
      radius: 70,
      fill: "#523a10",
      stroke: "#e67e22",
      strokeWidth: 2,
      dash: [],
    });
    setSelectedId(id);
    setActiveTool("select");
  };

  const addArchitectureNode = (nodeType) => {
    const id = nextId();
    shapesMap.set(id, {
      type: nodeType,
      x: 350,
      y: 250,
      fill: "#262627",
      stroke: "#5ca4f8",
      strokeWidth: 2,
      dash: [],
      scaleX: 3,
      scaleY: 3,
    });
    setSelectedId(id);
    setActiveTool("select");
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    shapesMap.delete(selectedId);
    setSelectedId(null);
  };

  const confirmClearCanvas = () => {
    const keys = Array.from(shapesMap.keys());
    keys.forEach((key) => shapesMap.delete(key));
    setSelectedId(null);
    setShowClearModal(false);
  };

  const updateShapeProperty = (property, value) => {
    if (!selectedId) return;
    const existing = shapesMap.get(selectedId);
    if (existing) {
      shapesMap.set(selectedId, { ...existing, [property]: value });
    }
  };

  const updateShapePosition = (id, x, y) => {
    const existing = shapesMap.get(id);
    if (existing) shapesMap.set(id, { ...existing, x, y });
  };

  const updateShapeTransform = (id, node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const existing = shapesMap.get(id);
    if (!existing) return;

    if (existing.type === "rect") {
      shapesMap.set(id, {
        ...existing,
        x: node.x(),
        y: node.y(),
        width: Math.max(20, node.width() * scaleX),
        height: Math.max(20, node.height() * scaleY),
      });
    } else if (existing.type === "circle" || existing.type === "diamond") {
      shapesMap.set(id, {
        ...existing,
        x: node.x(),
        y: node.y(),
        radius: Math.max(10, node.radius() * scaleX),
      });
    } else {
      node.scaleX(scaleX);
      node.scaleY(scaleY);
      shapesMap.set(id, {
        ...existing,
        x: node.x(),
        y: node.y(),
        scaleX,
        scaleY,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  return (
    <div className="canvas-board relative w-full h-full overflow-hidden">
      {/* Custom Clear Canvas Modal Overlay */}
      {showClearModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0e1116]/60 backdrop-blur-sm">
          <div className="bg-[#1a1d24] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-white text-lg font-semibold mb-2">
              Clear Canvas
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              Are you sure you want to clear the entire canvas for everyone?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearCanvas}
                className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 1. Top-Center General Drawing Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 rounded-xl px-1.5 py-1.5 flex items-center gap-0.5 shadow-2xl">
        {[
          { id: "select", icon: <FiMousePointer size={18} /> },
          { id: "pan", icon: <LuHand size={18} /> },
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
          {
            id: "server",
            icon: <FiServer size={18} />,
            action: () => addArchitectureNode("server"),
          },
          {
            id: "database",
            icon: <FiDatabase size={18} />,
            action: () => addArchitectureNode("database"),
          },
          {
            id: "client",
            icon: <FiUser size={18} />,
            action: () => addArchitectureNode("client"),
          },
          {
            id: "cloud",
            icon: <FiCloud size={18} />,
            action: () => addArchitectureNode("cloud"),
          },

          {
            id: "queue",
            icon: <FiLayers size={18} />,
            action: () => addArchitectureNode("queue"),
          },
          {
            id: "worker",
            icon: <FiCpu size={18} />,
            action: () => addArchitectureNode("worker"),
          },
          {
            id: "internet",
            icon: <FiGlobe size={18} />,
            action: () => addArchitectureNode("internet"),
          },
          {
            id: "mobile",
            icon: <FiSmartphone size={18} />,
            action: () => addArchitectureNode("mobile"),
          },
          {
            id: "auth",
            icon: <FiLock size={18} />,
            action: () => addArchitectureNode("auth"),
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

      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setShowClearModal(true)}
          className="px-4 py-2 bg-[#1a1d24]/95 backdrop-blur-md border border-red-900/50 text-red-400 text-xs font-semibold tracking-wide uppercase rounded-xl hover:bg-red-500/10 hover:border-red-500/80 transition-all shadow-xl flex items-center gap-2"
        >
          <FiTrash2 size={14} />
          Clear Canvas
        </button>
      </div>

      {editingTextId && shapesMap.get(editingTextId) && (
        <textarea
          ref={textareaRef}
          value={shapesMap.get(editingTextId).text}
          onChange={(e) => {
            const existing = shapesMap.get(editingTextId);
            if (existing) {
              shapesMap.set(editingTextId, {
                ...existing,
                text: e.target.value,
              });
            }
          }}
          onBlur={() => {
            const existing = shapesMap.get(editingTextId);
            if (existing && !existing.text.trim()) {
              shapesMap.delete(editingTextId);
            }
            setEditingTextId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.target.blur();
            }
          }}
          style={{
            position: "absolute",
            top: `${shapesMap.get(editingTextId).y}px`,
            left: `${shapesMap.get(editingTextId).x}px`,
            background: "transparent",
            color: shapesMap.get(editingTextId).fill,
            fontSize: `${shapesMap.get(editingTextId).fontSize}px`,
            fontFamily: "sans-serif",
            fontWeight: "bold",
            border: "1px dashed #4b5563",
            outline: "none",
            resize: "none",
            minHeight: "40px",
            minWidth: "150px",
            overflow: "hidden",
            whiteSpace: "pre",
            zIndex: 100,
          }}
        />
      )}

      {selectedId && (
        <div className="absolute right-6 top-24 z-50 bg-[#232329]/95 backdrop-blur-md border border-zinc-800/80 rounded-xl p-4 w-64 shadow-2xl text-white">
          <div className="space-y-6">
            {/* STROKE COLOR */}
            <div>
              <p className="text-[11px] text-zinc-300 mb-2.5">Stroke</p>
              <div className="flex gap-2 items-center">
                {["#e9e9e7", "#ff8a8a", "#6bcf70", "#5ca4f8", "#e67e22"].map(
                  (color) => {
                    const currentShape = shapes.find(
                      (s) => s.id === selectedId,
                    );
                    const isActive =
                      currentShape?.stroke === color ||
                      (currentShape?.type === "line" &&
                        currentShape?.fill === color);

                    return (
                      <button
                        key={color}
                        onClick={() => {
                          if (currentShape?.type === "line")
                            updateShapeProperty("fill", color);
                          updateShapeProperty("stroke", color);
                        }}
                        className={`w-7 h-7 rounded-md transition-all flex items-center justify-center ${
                          isActive
                            ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#232329]"
                            : "hover:bg-white/10"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-md"
                          style={{ backgroundColor: color }}
                        />
                      </button>
                    );
                  },
                )}
                <div className="w-px h-5 bg-zinc-700 mx-1"></div>
                <button
                  onClick={() => updateShapeProperty("stroke", "transparent")}
                  className={`w-7 h-7 rounded-md border border-zinc-700 flex items-center justify-center relative overflow-hidden ${
                    shapes.find((s) => s.id === selectedId)?.stroke ===
                    "transparent"
                      ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#232329]"
                      : ""
                  }`}
                >
                  <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#fff_2px,#fff_4px)]"></div>
                </button>
              </div>
            </div>

            {/* BACKGROUND COLOR (Hide for lines/text) */}
            {shapes.find((s) => s.id === selectedId)?.type !== "line" &&
              shapes.find((s) => s.id === selectedId)?.type !== "text" && (
                <div>
                  <p className="text-[11px] text-zinc-300 mb-2.5">Background</p>
                  <div className="flex gap-2 items-center">
                    {[
                      "#262627",
                      "#63292b",
                      "#1d4924",
                      "#20456b",
                      "#523a10",
                    ].map((color) => {
                      const isActive =
                        shapes.find((s) => s.id === selectedId)?.fill === color;
                      return (
                        <button
                          key={color}
                          onClick={() => updateShapeProperty("fill", color)}
                          className={`w-7 h-7 rounded-md transition-all flex items-center justify-center ${
                            isActive
                              ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#232329]"
                              : "hover:bg-white/10"
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-md"
                            style={{ backgroundColor: color }}
                          />
                        </button>
                      );
                    })}
                    <div className="w-px h-5 bg-zinc-700 mx-1"></div>
                    <button
                      onClick={() => updateShapeProperty("fill", "transparent")}
                      className={`w-7 h-7 rounded-md border border-zinc-700 flex items-center justify-center relative overflow-hidden ${
                        shapes.find((s) => s.id === selectedId)?.fill ===
                        "transparent"
                          ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#232329]"
                          : ""
                      }`}
                    >
                      <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#fff_2px,#fff_4px)]"></div>
                    </button>
                  </div>
                </div>
              )}

            {/* STROKE WIDTH */}
            <div>
              <p className="text-[11px] text-zinc-300 mb-2.5">Stroke width</p>
              <div className="flex gap-2">
                {[
                  { width: 2, label: "Thin", ui: "h-[2px]" },
                  { width: 4, label: "Bold", ui: "h-[4px]" },
                  { width: 6, label: "Extra Bold", ui: "h-[6px]" },
                ].map((style) => {
                  const isActive =
                    (shapes.find((s) => s.id === selectedId)?.strokeWidth ||
                      2) === style.width;
                  return (
                    <button
                      key={style.width}
                      onClick={() =>
                        updateShapeProperty("strokeWidth", style.width)
                      }
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-indigo-500/30 text-indigo-200"
                          : "bg-zinc-800/50 hover:bg-zinc-700/50 text-white"
                      }`}
                    >
                      <div
                        className={`w-4 bg-current rounded-full ${style.ui}`}
                      ></div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STROKE STYLE */}
            <div>
              <p className="text-[11px] text-zinc-300 mb-2.5">Stroke style</p>
              <div className="flex gap-2">
                {[
                  { dash: [], label: "Solid", ui: "border-solid" },
                  { dash: [10, 8], label: "Dashed", ui: "border-dashed" },
                  { dash: [2, 6], label: "Dotted", ui: "border-dotted" },
                ].map((style, idx) => {
                  const currentDash =
                    shapes.find((s) => s.id === selectedId)?.dash || [];
                  const isActive =
                    JSON.stringify(currentDash) === JSON.stringify(style.dash);
                  return (
                    <button
                      key={idx}
                      onClick={() => updateShapeProperty("dash", style.dash)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-indigo-500/30 text-indigo-200"
                          : "bg-zinc-800/50 hover:bg-zinc-700/50 text-white"
                      }`}
                    >
                      <div
                        className={`w-5 border-t-2 border-current ${style.ui}`}
                      ></div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 mt-2">
              <button
                onClick={deleteSelected}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Delete
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`canvas-container relative w-full h-full ${
          activeTool === "pan"
            ? "cursor-grab"
            : activeTool === "pen" ||
                activeTool === "highlighter" ||
                activeTool === "text"
              ? "cursor-crosshair"
              : "cursor-default"
        }`}
        onMouseLeave={handleMouseLeave}
      >
        {size.width > 0 && (
          <Stage
            ref={stageRef}
            width={size.width}
            height={size.height}
            draggable={activeTool === "pan"}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleStageMouseUp}
          >
            <Layer>
              {shapes.map((shape) => {
                const commonProps = {
                  id: shape.id,
                  x: shape.x,
                  y: shape.y,
                  fill: shape.fill,
                  stroke:
                    shape.stroke ||
                    (shape.type === "line" ? "#ffffff" : "transparent"),
                  strokeWidth: shape.strokeWidth || 2,
                  dash: shape.dash || [],
                  draggable: activeTool === "select",
                  scaleX: shape.scaleX || 1,
                  scaleY: shape.scaleY || 1,
                  onClick: () => {
                    if (activeTool === "select") setSelectedId(shape.id);
                  },
                  onTap: () => {
                    if (activeTool === "select") setSelectedId(shape.id);
                  },
                  onDragEnd: (e) =>
                    updateShapePosition(shape.id, e.target.x(), e.target.y()),
                  onTransformEnd: (e) =>
                    updateShapeTransform(shape.id, e.target),
                };

                switch (shape.type) {
                  case "server":
                  case "database":
                  case "client":
                  case "cloud":
                  case "queue":
                  case "worker":
                  case "internet":
                  case "mobile":
                  case "auth":
                    return (
                      <ArchitectureNode
                        key={shape.id}
                        shape={shape}
                        commonProps={commonProps}
                      />
                    );
                  case "rect":
                    return (
                      <Rect
                        key={shape.id}
                        {...commonProps}
                        width={shape.width}
                        height={shape.height}
                        cornerRadius={4}
                      />
                    );
                  case "circle":
                    return (
                      <Circle
                        key={shape.id}
                        {...commonProps}
                        radius={shape.radius}
                      />
                    );
                  case "diamond":
                    return (
                      <RegularPolygon
                        key={shape.id}
                        {...commonProps}
                        sides={4}
                        radius={shape.radius}
                      />
                    );
                  case "text":
                    return (
                      <Text
                        key={shape.id}
                        {...commonProps}
                        text={shape.text}
                        fontSize={shape.fontSize}
                        fill={shape.fill}
                        fontFamily="sans-serif"
                        fontStyle="bold"
                        opacity={editingTextId === shape.id ? 0 : 1}
                        onDblClick={() => setEditingTextId(shape.id)}
                        onDblTap={() => setEditingTextId(shape.id)}
                      />
                    );
                  case "line":
                    return (
                      <Line
                        key={shape.id}
                        {...commonProps}
                        points={shape.points}
                        stroke={shape.stroke}
                        strokeWidth={shape.strokeWidth}
                        opacity={shape.opacity}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        fillEnabled={false}
                      />
                    );
                  default:
                    return null;
                }
              })}

              <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                anchorSize={10}
                anchorCornerRadius={5}
                anchorStroke="#3b82f6"
                anchorFill="#ffffff"
                borderStroke="#3b82f6"
                borderStrokeWidth={1.5}
                keepRatio={false}
                boundBoxFunc={(oldBox, newBox) =>
                  newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
                }
                onDblClick={() => {
                  const shape = shapes.find((s) => s.id === selectedId);
                  if (shape?.type === "text") setEditingTextId(selectedId);
                }}
                onDblTap={() => {
                  const shape = shapes.find((s) => s.id === selectedId);
                  if (shape?.type === "text") setEditingTextId(selectedId);
                }}
              />

              {remoteUsers.map((u) => (
                <Group key={u.clientId} x={u.cursor.x} y={u.cursor.y}>
                  <Path
                    data="M5.65376 21.0846L1.51408 1.83151C1.29524 0.813636 2.37894 -0.0152912 3.32746 0.446824L21.3653 9.23961C22.3783 9.73351 22.3023 11.2057 21.2384 11.6027L14.0722 14.2755C13.8262 14.3673 13.626 14.5428 13.5042 14.7744L10.3707 20.7388C9.88298 21.667 8.52041 21.7828 7.89246 20.9501Z"
                    fill={u.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    scale={{ x: 0.7, y: 0.7 }}
                  />
                  <Label x={15} y={15}>
                    <Tag
                      fill={u.color}
                      cornerRadius={4}
                      shadowColor="black"
                      shadowBlur={4}
                      shadowOpacity={0.2}
                    />
                    <Text
                      text={u.username}
                      fill="#fff"
                      padding={4}
                      fontSize={11}
                      fontStyle="bold"
                    />
                  </Label>
                </Group>
              ))}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}
