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
  Arrow,
  RegularPolygon,
} from "react-konva";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { ArchitectureNode } from "./ArchitectureNodes";
import Toolbars from "./Toolbars";
import PropertiesPanel from "./PropertiesPanel";
import "./CanvasBoard.css";

let idCounter = 0;
const nextId = () => `shape-${Date.now()}-${idCounter++}`;

const CANVAS_THEMES = {
  dark: {
    background: "#0e1116",
    dot: "rgba(255,255,255,0.08)",
    penStroke: "#ffffff",
    textFill: "#ffffff",
  },
  light: {
    background: "#f5f6f8",
    dot: "rgba(15,23,42,0.10)",
    penStroke: "#111827",
    textFill: "#111827",
  },
};

export default function CanvasBoard({ shapesMap, awareness, undoManager }) {
  const navigate = useNavigate();
  const [shapes, setShapes] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [drawingShapeId, setDrawingShapeId] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);

  // Modals state
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [theme, setTheme] = useState("dark");
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const themeConfig = CANVAS_THEMES[theme];

  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const stageTransformRef = useRef({ scale: 1, position: { x: 0, y: 0 } });
  const touchGestureRef = useRef(null);

  const [size, setSize] = useState({ width: 0, height: 0 });

  const setStageTransform = (scale, position) => {
    stageTransformRef.current = { scale, position };
    setStageScale(scale);
    setStagePos(position);
  };

  const getRelativePointerPosition = (stage) => {
    const pointer = stage.getPointerPosition();
    const scale = stage.scaleX();
    const position = stage.position();
    return {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };
  };

  const getViewportCenter = () => {
    return {
      x: (-stagePos.x + size.width / 2) / stageScale,
      y: (-stagePos.y + size.height / 2) / stageScale,
    };
  };

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
    const selectedShape = shapes.find((s) => s.id === selectedId);

    if (
      selectedNode &&
      selectedShape &&
      selectedShape.type !== "arrow" &&
      selectedShape.type !== "line"
    ) {
      transformerRef.current.nodes([selectedNode]);
    } else {
      transformerRef.current.nodes([]);
    }
    transformerRef.current.getLayer().batchDraw();
  }, [selectedId, shapes]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.ctrlKey || e.evt.metaKey) {
      const scaleBy = 1.1;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(newScale, 5));

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setStageTransform(clampedScale, newPos);
    } else {
      const { scale, position } = stageTransformRef.current;
      setStageTransform(scale, {
        x: position.x - e.evt.deltaX,
        y: position.y - e.evt.deltaY,
      });
    }
  };

  const handleZoomButton = (direction) => {
    const scaleBy = 1.2;
    const oldScale = stageScale;
    const newScale =
      direction > 0
        ? Math.min(oldScale * scaleBy, 5)
        : Math.max(oldScale / scaleBy, 0.1);

    const center = { x: size.width / 2, y: size.height / 2 };
    const centerPointTo = {
      x: (center.x - stagePos.x) / oldScale,
      y: (center.y - stagePos.y) / oldScale,
    };

    setStageTransform(newScale, {
      x: center.x - centerPointTo.x * newScale,
      y: center.y - centerPointTo.y * newScale,
    });
  };

  const getTouchMetrics = (touches, stage) => {
    const rect = stage.container().getBoundingClientRect();
    const first = touches[0];
    const second = touches[1];
    const firstPoint = {
      x: first.clientX - rect.left,
      y: first.clientY - rect.top,
    };
    const secondPoint = {
      x: second.clientX - rect.left,
      y: second.clientY - rect.top,
    };

    return {
      center: {
        x: (firstPoint.x + secondPoint.x) / 2,
        y: (firstPoint.y + secondPoint.y) / 2,
      },
      distance: Math.hypot(
        secondPoint.x - firstPoint.x,
        secondPoint.y - firstPoint.y,
      ),
    };
  };

  const handleTouchStart = (e) => {
    const touches = e.evt.touches;
    if (touches.length < 2) return;

    e.evt.preventDefault();
    const stage = e.target.getStage();
    const { center, distance } = getTouchMetrics(touches, stage);
    touchGestureRef.current = { center, distance };
    stage.stopDrag();
  };

  const handleTouchMove = (e) => {
    const touches = e.evt.touches;
    if (touches.length < 2) return;

    e.evt.preventDefault();
    const stage = e.target.getStage();
    const previous = touchGestureRef.current;
    const { center, distance } = getTouchMetrics(touches, stage);

    if (!previous || !previous.distance) {
      touchGestureRef.current = { center, distance };
      return;
    }

    const { scale: oldScale, position: oldPosition } =
      stageTransformRef.current;
    const newScale = Math.max(
      0.1,
      Math.min(5, oldScale * (distance / previous.distance)),
    );
    const canvasPoint = {
      x: (previous.center.x - oldPosition.x) / oldScale,
      y: (previous.center.y - oldPosition.y) / oldScale,
    };
    const newPosition = {
      x: center.x - canvasPoint.x * newScale,
      y: center.y - canvasPoint.y * newScale,
    };

    stage.stopDrag();
    setStageTransform(newScale, newPosition);
    touchGestureRef.current = { center, distance };
  };

  const handleTouchEnd = (e) => {
    if (e.evt.touches.length < 2) {
      touchGestureRef.current = null;
      e.target.getStage().stopDrag();
    }
  };

  const handleStageMouseDown = (e) => {
    // Only prevent default for drawing tools — not for select (which needs
    // native pointer events for shape dragging, especially on mobile/touch)
    // and not for pan (which is handled by Stage.draggable).
    if (
      activeTool !== "select" &&
      activeTool !== "pan"
    ) {
      e.evt.preventDefault();
    }

    if (activeTool === "pan") return;
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    const clickedId = e.target.id();

    if (activeTool === "select") {
      if (e.target === stage) setSelectedId(null);
      return;
    }

    if (activeTool === "arrow") {
      if (clickedId && shapesMap.has(clickedId)) {
        setIsDrawing(true);
        setSelectedId(null);
        const id = nextId();
        shapesMap.set(id, {
          type: "arrow",
          startId: clickedId,
          endId: null,
          endX: pos.x,
          endY: pos.y,
          stroke: "#5ca4f8",
          strokeWidth: 2,
          dash: [],
          x: 0,
          y: 0,
        });
        setDrawingShapeId(id);
      }
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
        stroke:
          activeTool === "highlighter" ? "#f59e0b" : themeConfig.penStroke,
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
        fill: themeConfig.textFill,
        fontSize: 24,
      });
      setSelectedId(id);
      setEditingTextId(id);
      setActiveTool("select");
      return;
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const relativePoint = getRelativePointerPosition(stage);

    if (awareness) {
      const state = awareness.getLocalState();
      if (state?.user && relativePoint) {
        awareness.setLocalStateField("user", {
          ...state.user,
          cursor: { x: relativePoint.x, y: relativePoint.y },
        });
      }
    }

    if (!isDrawing) return;
    const existing = shapesMap.get(drawingShapeId);

    if (activeTool === "arrow" && existing) {
      shapesMap.set(drawingShapeId, {
        ...existing,
        endX: relativePoint.x,
        endY: relativePoint.y,
      });
      return;
    }

    if (
      (activeTool === "pen" || activeTool === "highlighter") &&
      existing &&
      existing.type === "line"
    ) {
      shapesMap.set(drawingShapeId, {
        ...existing,
        points: [...existing.points, relativePoint.x, relativePoint.y],
      });
    }
  };

  const handleStageMouseUp = (e) => {
    if (isDrawing) {
      if (activeTool === "arrow" && drawingShapeId) {
        const dropTargetId = e.target.id();
        const existing = shapesMap.get(drawingShapeId);
        if (existing) {
          if (
            dropTargetId &&
            dropTargetId !== existing.startId &&
            shapesMap.has(dropTargetId)
          ) {
            shapesMap.set(drawingShapeId, { ...existing, endId: dropTargetId });
          }
        }
        setActiveTool("select");
      }
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

  const addArchitectureNode = (nodeType) => {
    const center = getViewportCenter();
    const id = nextId();
    shapesMap.set(id, {
      type: nodeType,
      x: center.x - 40,
      y: center.y - 40,
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

  const addRectangle = () => {
    const center = getViewportCenter();
    const id = nextId();
    shapesMap.set(id, {
      type: "rect",
      x: center.x - 60,
      y: center.y - 60,
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
    const center = getViewportCenter();
    const id = nextId();
    shapesMap.set(id, {
      type: "circle",
      x: center.x,
      y: center.y,
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
    const center = getViewportCenter();
    const id = nextId();
    shapesMap.set(id, {
      type: "diamond",
      x: center.x,
      y: center.y,
      radius: 70,
      fill: "#523a10",
      stroke: "#e67e22",
      strokeWidth: 2,
      dash: [],
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
    if (existing) shapesMap.set(selectedId, { ...existing, [property]: value });
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
      const isTyping =
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA";
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && !isTyping) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            undoManager?.redo();
          } else {
            undoManager?.undo();
          }
          return;
        }
        if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          undoManager?.redo();
          return;
        }
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !isTyping) {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, undoManager]);

  const getShapeCenter = (s) => {
    if (!s) return { x: 0, y: 0 };
    if (s.type === "rect")
      return {
        x: s.x + (s.width * (s.scaleX || 1)) / 2,
        y: s.y + (s.height * (s.scaleY || 1)) / 2,
      };
    if (s.type === "circle" || s.type === "diamond") return { x: s.x, y: s.y };
    if (s.type === "text") return { x: s.x + 20, y: s.y + 15 };
    return { x: s.x + 36, y: s.y + 36 };
  };

  return (
    <div className="canvas-board relative w-full h-full overflow-hidden">
      {/* Leave Room Button - Added right gap to separate it from Clear Canvas */}
      <button
        onClick={() => setShowLeaveModal(true)}
        className="absolute top-20 right-4 md:top-6 md:right-44 z-[60] px-4 py-2 bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 text-zinc-300 text-xs font-semibold tracking-wide uppercase rounded-xl hover:bg-zinc-800 hover:text-white transition-all shadow-xl flex items-center gap-2"
      >
        <FiLogOut size={14} />
        <span className="hidden sm:inline">Leave Room</span>
      </button>

      {/* Leave Room Confirmation Modal */}
      {showLeaveModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0e1116]/60 backdrop-blur-sm">
          <div className="bg-[#1a1d24] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-white text-lg font-semibold mb-2">
              Leave Room
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              Are you sure you want to leave this workspace? You can rejoin
              anytime using the room PIN.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 text-sm font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Canvas Modal */}
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

      <Toolbars
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        addRectangle={addRectangle}
        addCircle={addCircle}
        addDiamond={addDiamond}
        addArchitectureNode={addArchitectureNode}
        setShowClearModal={setShowClearModal}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <PropertiesPanel
        selectedId={selectedId}
        shapes={shapes}
        updateShapeProperty={updateShapeProperty}
        deleteSelected={deleteSelected}
      />

      <div className="absolute z-50 flex items-center gap-3 md:gap-4 bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 text-zinc-300 rounded-xl px-2.5 md:px-3 py-2 shadow-xl bottom-24 right-4 md:bottom-6 md:left-6 md:right-auto">
        <button
          onClick={() => handleZoomButton(-1)}
          className="w-6 h-6 flex items-center justify-center hover:bg-zinc-700/50 hover:text-white rounded transition-colors"
        >
          -
        </button>
        <span
          className="text-xs font-mono font-medium tracking-wide w-12 text-center select-none cursor-pointer"
          onClick={() => {
            setStageTransform(1, { x: 0, y: 0 });
          }}
          title="Reset Zoom"
        >
          {Math.round(stageScale * 100)}%
        </span>
        <button
          onClick={() => handleZoomButton(1)}
          className="w-6 h-6 flex items-center justify-center hover:bg-zinc-700/50 hover:text-white rounded transition-colors"
        >
          +
        </button>
      </div>

      {editingTextId && shapesMap.get(editingTextId) && (
        <textarea
          ref={textareaRef}
          value={shapesMap.get(editingTextId).text}
          onChange={(e) => {
            const existing = shapesMap.get(editingTextId);
            if (existing)
              shapesMap.set(editingTextId, {
                ...existing,
                text: e.target.value,
              });
          }}
          onBlur={() => {
            const existing = shapesMap.get(editingTextId);
            if (existing && !existing.text.trim())
              shapesMap.delete(editingTextId);
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
            top: `${shapesMap.get(editingTextId).y * stageScale + stagePos.y}px`,
            left: `${shapesMap.get(editingTextId).x * stageScale + stagePos.x}px`,
            background: "transparent",
            color: shapesMap.get(editingTextId).fill,
            fontSize: `${shapesMap.get(editingTextId).fontSize * stageScale}px`,
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
            transformOrigin: "top left",
          }}
        />
      )}

      <div
        ref={containerRef}
        className={`canvas-container relative w-full h-full touch-none transition-colors duration-300 ${
          activeTool === "pan"
            ? "cursor-grab"
            : activeTool === "pen" ||
                activeTool === "highlighter" ||
                activeTool === "text" ||
                activeTool === "arrow"
              ? "cursor-crosshair"
              : "cursor-default"
        }`}
        style={{
          backgroundColor: themeConfig.background,
          backgroundImage: `radial-gradient(${themeConfig.dot} 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
          touchAction: "none",
        }}
        onMouseLeave={handleMouseLeave}
      >
        {size.width > 0 && (
          <Stage
            ref={stageRef}
            width={size.width}
            height={size.height}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={handleWheel}
            draggable={activeTool === "pan"}
            onDragMove={(e) => {
              if (e.target === stageRef.current) {
                setStageTransform(stageTransformRef.current.scale, {
                  x: e.target.x(),
                  y: e.target.y(),
                });
              }
            }}
            onDragEnd={(e) => {
              if (e.target === stageRef.current) {
                setStageTransform(stageTransformRef.current.scale, {
                  x: e.target.x(),
                  y: e.target.y(),
                });
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onPointerDown={handleStageMouseDown}
            onPointerMove={handleMouseMove}
            onPointerUp={handleStageMouseUp}
            onPointerLeave={handleMouseLeave}
          >
            <Layer>
              {shapes.map((shape) => {
                const isArrow = shape.type === "arrow";
                const commonProps = {
                  id: shape.id,
                  x: shape.x,
                  y: shape.y,
                  fill: shape.fill,
                  stroke:
                    shape.stroke ||
                    (shape.type === "line" || isArrow
                      ? "#ffffff"
                      : "transparent"),
                  strokeWidth: shape.strokeWidth || 2,
                  dash: shape.dash || [],
                  draggable: activeTool === "select" && !isArrow,
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
                  case "arrow": {
                    const startShape = shapes.find(
                      (s) => s.id === shape.startId,
                    );
                    const endShape = shape.endId
                      ? shapes.find((s) => s.id === shape.endId)
                      : null;
                    if (!startShape) return null;

                    const startP = getShapeCenter(startShape);
                    const endP = endShape
                      ? getShapeCenter(endShape)
                      : { x: shape.endX, y: shape.endY };

                    return (
                      <Arrow
                        key={shape.id}
                        {...commonProps}
                        points={[startP.x, startP.y, endP.x, endP.y]}
                        fill={shape.stroke}
                        pointerLength={12}
                        pointerWidth={12}
                        listening={drawingShapeId !== shape.id}
                      />
                    );
                  }
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
