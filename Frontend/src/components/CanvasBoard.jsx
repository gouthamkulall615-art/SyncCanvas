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
import { ArchitectureNode } from "./ArchitectureNodes";
import Toolbars from "./Toolbars";
import PropertiesPanel from "./PropertiesPanel";
import "./CanvasBoard.css";

let idCounter = 0;
const nextId = () => `shape-${Date.now()}-${idCounter++}`;

// 1. Notice the undoManager is now safely added to the props here
export default function CanvasBoard({ shapesMap, awareness, undoManager }) {
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

  const handleStageMouseDown = (e) => {
    if (activeTool === "pan") return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
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

    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const existing = shapesMap.get(drawingShapeId);

    if (activeTool === "arrow" && existing) {
      shapesMap.set(drawingShapeId, {
        ...existing,
        endX: point.x,
        endY: point.y,
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
        points: [...existing.points, point.x, point.y],
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

  // 2. Here is the exact Undo/Redo logic perfectly integrated
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
      />
      <PropertiesPanel
        selectedId={selectedId}
        shapes={shapes}
        updateShapeProperty={updateShapeProperty}
        deleteSelected={deleteSelected}
      />

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

      <div
        ref={containerRef}
        className={`canvas-container relative w-full h-full ${
          activeTool === "pan"
            ? "cursor-grab"
            : activeTool === "pen" ||
                activeTool === "highlighter" ||
                activeTool === "text" ||
                activeTool === "arrow"
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
