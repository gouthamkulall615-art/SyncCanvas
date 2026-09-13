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
} from "react-icons/fi";
import { LuHand, LuDiamond } from "react-icons/lu";
import "./CanvasBoard.css";

let idCounter = 0;
const nextId = () => `shape-${Date.now()}-${idCounter++}`;

export default function CanvasBoard({ shapesMap, awareness }) {
  const [shapes, setShapes] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [drawingShapeId, setDrawingShapeId] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [isDrawing, setIsDrawing] = useState(false); // Track freehand drawing

  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

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

  //  MOUSE EVENTS FOR DRAWING & CURSORS
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
      });
      setDrawingShapeId(id);
    }
  };

  const handleMouseMove = (e) => {
    // 1. Broadcast Cursor
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

    // 2. Handle Freehand Drawing
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
      fill: "#3b82f6",
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
      fill: "#ef4444",
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
      fill: "#8b5cf6",
    });
    setSelectedId(id);
    setActiveTool("select");
  };

  const addText = () => {
    const text = prompt("Enter text:");
    if (!text) return;
    const id = nextId();
    shapesMap.set(id, {
      type: "text",
      x: 400,
      y: 300,
      text: text,
      fill: "#ffffff",
      fontSize: 24,
    });
    setSelectedId(id);
    setActiveTool("select");
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    shapesMap.delete(selectedId);
    setSelectedId(null);
  };

  const clearCanvas = () => {
    if (
      window.confirm(
        "Are u sure you want to clear the entire canvas for everyone?",
      )
    ) {
      const keys = Array.from(shapesMap.keys());
      keys.forEach((key) => shapesMap.delete(key));
      setSelectedId(null);
    }
  };

  const updateShapeColor = (newColor) => {
    if (!selectedId) return;
    const existing = shapesMap.get(selectedId);
    if (existing)
      shapesMap.set(selectedId, {
        ...existing,
        fill: newColor,
        stroke: existing.type === "line" ? newColor : undefined,
      });
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
    } else if (existing.type === "circle") {
      shapesMap.set(id, {
        ...existing,
        x: node.x(),
        y: node.y(),
        radius: Math.max(10, node.radius() * scaleX),
      });
    } else if (existing.type === "diamond") {
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
        document.activeElement.tagName !== "INPUT"
      ) {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  return (
    <div className="canvas-board relative w-full h-full">
      {/* Top-Center Floating Toolbar */}
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
            action: addText,
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

      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-[#1a1d24]/95 backdrop-blur-md border border-red-900/50 text-red-400 text-xs font-semibold tracking-wide uppercase rounded-xl hover:bg-red-500/10 hover:border-red-500/80 transition-all shadow-xl flex items-center gap-2"
        >
          <FiTrash2 size={14} />
          Clear Canvas
        </button>
      </div>

      {/* Right-Side Properties Panel */}
      {selectedId && (
        <div className="absolute right-6 top-24 z-50 bg-[#1a1d24]/95 backdrop-blur-md border border-zinc-800/80 rounded-xl p-5 w-64 shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Inspect Shape
            </h3>
            <FiMoreVertical className="text-zinc-500" />
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">
                Color
              </p>
              <div className="flex gap-2">
                {[
                  "#ef4444",
                  "#3b82f6",
                  "#8b5cf6",
                  "#f59e0b",
                  "#10b981",
                  "#ffffff",
                ].map((color) => {
                  const currentShape = shapes.find((s) => s.id === selectedId);
                  const activeColor =
                    currentShape?.type === "line"
                      ? currentShape?.stroke
                      : currentShape?.fill;
                  const isActive = activeColor === color;

                  return (
                    <button
                      key={color}
                      onClick={() => updateShapeColor(color)}
                      className={`w-6 h-6 rounded-md border transition-all hover:scale-110 ${
                        isActive
                          ? "scale-110 border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                          : "border-zinc-700/50"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-800/80">
              <button
                onClick={deleteSelected}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Remove element
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konva Canvas */}
      <div
        ref={containerRef}
        className={`canvas-container ${
          activeTool === "pan"
            ? "cursor-grab"
            : activeTool === "pen" || activeTool === "highlighter"
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
            draggable={activeTool === "pan"} // Allow dragging the entire stage to pan
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
              />

              {/* Render Remote Cursors */}
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
