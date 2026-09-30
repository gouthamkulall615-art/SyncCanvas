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
import { ArchitectureNode } from "./ArchitectureNodes";
import Toolbars from "./Toolbars";
import PropertiesPanel from "./PropertiesPanel";
import AIAssistant from "../ui/AIAssistant";
import api from "../../api/axios";
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

export default function CanvasBoard({
  shapesMap,
  awareness,
  undoManager,
  onLeave,
}) {
  const navigate = useNavigate();
  const [shapes, setShapes] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [drawingShapeId, setDrawingShapeId] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [hoveredSnapId, setHoveredSnapId] = useState(null);

  // Modals state
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("canvasTheme") || "dark",
  );
  const toggleTheme = () =>
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("canvasTheme", next);
      return next;
    });
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
      let startNode = null;
      if (clickedId && shapesMap.has(clickedId)) {
        const s = shapesMap.get(clickedId);
        if (s && s.type !== "arrow" && s.type !== "line") {
          startNode = { id: clickedId, ...s };
        }
      }
      if (!startNode) {
        startNode = findNodeNear(pos, shapes, 75);
      }

      setIsDrawing(true);
      setSelectedId(null);
      const id = nextId();
      const startP = startNode ? getShapeCenter(startNode) : pos;
      shapesMap.set(id, {
        type: "arrow",
        startId: startNode ? startNode.id : null,
        startX: startP.x,
        startY: startP.y,
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

    if (activeTool === "arrow") {
      const snapCandidate = findNodeNear(relativePoint, shapes, 75);
      if (isDrawing && drawingShapeId) {
        const existing = shapesMap.get(drawingShapeId);
        if (existing) {
          const targetPos =
            snapCandidate && snapCandidate.id !== existing.startId
              ? getShapeCenter(snapCandidate)
              : relativePoint;
          shapesMap.set(drawingShapeId, {
            ...existing,
            endX: targetPos.x,
            endY: targetPos.y,
          });
          setHoveredSnapId(
            snapCandidate && snapCandidate.id !== existing.startId
              ? snapCandidate.id
              : null,
          );
          return;
        }
      } else {
        setHoveredSnapId(snapCandidate ? snapCandidate.id : null);
      }
    } else if (hoveredSnapId) {
      setHoveredSnapId(null);
    }

    if (!isDrawing) return;
    const existing = shapesMap.get(drawingShapeId);

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
        const stage = e.target.getStage();
        const pos = getRelativePointerPosition(stage);
        const dropTargetId = e.target.id();
        const existing = shapesMap.get(drawingShapeId);
        if (existing) {
          const dropTarget =
            (dropTargetId &&
              dropTargetId !== existing.startId &&
              shapesMap.has(dropTargetId) &&
              shapesMap.get(dropTargetId).type !== "arrow" && {
                id: dropTargetId,
                ...shapesMap.get(dropTargetId),
              }) ||
            findNodeNear(pos, shapes, 75);

          const finalEndId =
            dropTarget && dropTarget.id !== existing.startId
              ? dropTarget.id
              : null;

          const startCenter = existing.startId
            ? getShapeCenter(shapes.find((s) => s.id === existing.startId))
            : { x: existing.startX || pos.x, y: existing.startY || pos.y };

          const dist = Math.hypot(
            (existing.endX || pos.x) - startCenter.x,
            (existing.endY || pos.y) - startCenter.y,
          );

          if (dist < 15 && !finalEndId) {
            shapesMap.delete(drawingShapeId);
          } else {
            shapesMap.set(drawingShapeId, {
              ...existing,
              endId: finalEndId,
              endX: finalEndId
                ? getShapeCenter(dropTarget).x
                : existing.endX || pos.x,
              endY: finalEndId
                ? getShapeCenter(dropTarget).y
                : existing.endY || pos.y,
            });
          }
        }
        setActiveTool("select");
        setIsDrawing(false);
        setDrawingShapeId(null);
        setHoveredSnapId(null);
        return;
      }
      setIsDrawing(false);
      setDrawingShapeId(null);
      setHoveredSnapId(null);
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
    // Also remove any arrows that were connected to this node
    shapesMap.forEach((val, key) => {
      if (
        val.type === "arrow" &&
        (val.startId === selectedId || val.endId === selectedId)
      ) {
        shapesMap.delete(key);
      }
    });
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
    const sx = s.scaleX || 1;
    const sy = s.scaleY || 1;
    if (s.type === "rect") {
      return {
        x: s.x + ((s.width || 100) * sx) / 2,
        y: s.y + ((s.height || 100) * sy) / 2,
      };
    }
    if (s.type === "circle" || s.type === "diamond") {
      return { x: s.x, y: s.y };
    }
    if (s.type === "text") {
      return { x: s.x + 30, y: s.y + 15 };
    }
    // Architecture nodes (icon is 24x24 scaled by 3 = 72x72)
    return { x: s.x + 36 * (sx / 3), y: s.y + 36 * (sy / 3) };
  };

  const getDockingPoint = (sourceShape, targetPos) => {
    if (!sourceShape) return { x: 0, y: 0 };
    const center = getShapeCenter(sourceShape);
    if (!targetPos) return center;

    const dx = targetPos.x - center.x;
    const dy = targetPos.y - center.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return center;

    const sx = sourceShape.scaleX || 1;
    const sy = sourceShape.scaleY || 1;

    if (sourceShape.type === "rect") {
      const hw = ((sourceShape.width || 100) * sx) / 2 + 2;
      const hh = ((sourceShape.height || 100) * sy) / 2 + 2;
      const scale = Math.min(
        Math.abs(hw / (dx || 0.0001)),
        Math.abs(hh / (dy || 0.0001)),
      );
      return { x: center.x + dx * scale, y: center.y + dy * scale };
    }

    if (sourceShape.type === "circle" || sourceShape.type === "diamond") {
      const r = ((sourceShape.radius || 40) * sx) + 2;
      return { x: center.x + (dx / dist) * r, y: center.y + (dy / dist) * r };
    }

    // Architecture nodes (database, client, server, auth, etc.)
    const r = 38 * (sx / 3);
    return { x: center.x + (dx / dist) * r, y: center.y + (dy / dist) * r };
  };

  const findNodeNear = (pos, shapeList, threshold = 75) => {
    if (!pos || !shapeList) return null;
    let closestNode = null;
    let minDist = threshold;

    // First priority: architecture nodes and primary shapes (rect, circle, diamond)
    for (const s of shapeList) {
      if (s.type === "arrow" || s.type === "line" || s.type === "text") continue;
      const center = getShapeCenter(s);
      const dist = Math.hypot(center.x - pos.x, center.y - pos.y);
      if (dist < minDist) {
        minDist = dist;
        closestNode = s;
      }
    }
    if (closestNode) return closestNode;

    // Second priority: text shapes if no architecture or shape node was within range
    minDist = threshold;
    for (const s of shapeList) {
      if (s.type !== "text") continue;
      const center = getShapeCenter(s);
      const dist = Math.hypot(center.x - pos.x, center.y - pos.y);
      if (dist < minDist) {
        minDist = dist;
        closestNode = s;
      }
    }
    return closestNode;
  };

  // ----- AI-assisted shape generation -----
  const handleAIGenerate = async (prompt) => {
    let res;
    try {
      res = await api.post("/ai/generate", { prompt }, { timeout: 60000 });
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        throw new Error("AI took too long. Please try again.");
      }
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;
      if (status === 401) {
        throw new Error("Session expired, please log in again.");
      }
      if (status === 402) {
        throw new Error(
          serverMsg || "You don’t have enough credits for this generation.",
        );
      }
      if (status === 429) {
        throw new Error(
          serverMsg || "Too many requests — please wait a few minutes.",
        );
      }
      if (status === 504) {
        throw new Error(
          serverMsg || "AI took too long. Please try again.",
        );
      }
      throw new Error(
        serverMsg || "AI generation failed. Please try again.",
      );
    }

    const newShapes = res.data?.shapes;
    if (!Array.isArray(newShapes) || newShapes.length === 0) {
      throw new Error("AI returned no shapes. Try a different prompt.");
    }

    // Map AI IDs to unique Yjs IDs
    const idMap = new Map();
    const preparedShapes = [];
    const connectableNodes = [];

    for (const shape of newShapes) {
      const generatedId = nextId();
      if (shape.id) {
        idMap.set(String(shape.id), generatedId);
      }
      preparedShapes.push({ shape, yjsId: generatedId });
      if (
        shape.type !== "arrow" &&
        shape.type !== "line" &&
        shape.type !== "text"
      ) {
        connectableNodes.push({ ...shape, yjsId: generatedId });
      }
    }

    let arrowCount = 0;
    for (const { shape, yjsId } of preparedShapes) {
      const { id: rawId, ...fields } = shape;
      if (fields.type === "arrow") {
        arrowCount++;
        if (fields.startId && idMap.has(String(fields.startId))) {
          fields.startId = idMap.get(String(fields.startId));
        }
        if (fields.endId && idMap.has(String(fields.endId))) {
          fields.endId = idMap.get(String(fields.endId));
        }
        // If arrow has points but no startId/endId, snap to closest connectable nodes
        if (
          (!fields.startId || !fields.endId) &&
          Array.isArray(fields.points) &&
          fields.points.length >= 4
        ) {
          const pStart = { x: fields.points[0], y: fields.points[1] };
          const pEnd = { x: fields.points[2], y: fields.points[3] };
          const sNode = findNodeNear(pStart, connectableNodes, 120);
          const eNode = findNodeNear(pEnd, connectableNodes, 120);
          if (sNode) fields.startId = sNode.yjsId;
          if (eNode && (!sNode || eNode.yjsId !== sNode.yjsId)) {
            fields.endId = eNode.yjsId;
          }
        }
      }
      shapesMap.set(yjsId, fields);
    }

    // Auto-connect if no arrows were returned but we have 2+ connectable nodes
    if (arrowCount === 0 && connectableNodes.length >= 2) {
      const sorted = [...connectableNodes].sort(
        (a, b) => (a.x || 0) - (b.x || 0),
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const fromNode = sorted[i];
        const toNode = sorted[i + 1];
        shapesMap.set(nextId(), {
          type: "arrow",
          startId: fromNode.yjsId,
          endId: toNode.yjsId,
          stroke: fromNode.stroke || "#5ca4f8",
          strokeWidth: 2,
          dash: [],
          x: 0,
          y: 0,
        });
      }
    }

    // If the new shapes are outside the current viewport, pan to center on them
    const xs = newShapes.map((s) => s.x ?? 0);
    const ys = newShapes.map((s) => s.y ?? 0);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    const vpCenter = getViewportCenter();
    const vpHalfW = (size.width / stageScale) / 2;
    const vpHalfH = (size.height / stageScale) / 2;
    const isOutside =
      centerX < vpCenter.x - vpHalfW ||
      centerX > vpCenter.x + vpHalfW ||
      centerY < vpCenter.y - vpHalfH ||
      centerY > vpCenter.y + vpHalfH;

    if (isOutside) {
      setStageTransform(stageScale, {
        x: -centerX * stageScale + size.width / 2,
        y: -centerY * stageScale + size.height / 2,
      });
    }
  };

  return (
    <div className="canvas-board relative w-full h-full overflow-hidden">
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
                onClick={() => {
                  if (onLeave) {
                    onLeave();
                  } else {
                    navigate("/dashboard");
                  }
                }}
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
        onLeaveRoom={() => setShowLeaveModal(true)}
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
            color:
              theme === "light" &&
              (!shapesMap.get(editingTextId)?.fill ||
                shapesMap.get(editingTextId)?.fill?.toLowerCase() === "#ffffff" ||
                shapesMap.get(editingTextId)?.fill?.toLowerCase() === "#fff")
                ? themeConfig.textFill
                : shapesMap.get(editingTextId)?.fill || themeConfig.textFill,
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
                  onDragMove: (e) =>
                    updateShapePosition(shape.id, e.target.x(), e.target.y()),
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
                  case "text": {
                    const isLight = theme === "light";
                    const isWhiteText =
                      !shape.fill ||
                      shape.fill.toLowerCase() === "#ffffff" ||
                      shape.fill.toLowerCase() === "#fff" ||
                      shape.fill.toLowerCase() === "#f8fafc" ||
                      shape.fill.toLowerCase() === "#f1f5f9" ||
                      shape.fill.toLowerCase() === "white";

                    const isDarkText =
                      shape.fill &&
                      (shape.fill.toLowerCase() === "#000000" ||
                        shape.fill.toLowerCase() === "#000" ||
                        shape.fill.toLowerCase() === "#0e1116" ||
                        shape.fill.toLowerCase() === "#111827" ||
                        shape.fill.toLowerCase() === "black");

                    const textFill = isLight
                      ? isWhiteText
                        ? themeConfig.textFill
                        : shape.fill
                      : isDarkText
                        ? themeConfig.textFill
                        : shape.fill || themeConfig.textFill;

                    return (
                      <Text
                        key={shape.id}
                        {...commonProps}
                        text={shape.text}
                        fontSize={shape.fontSize || 14}
                        fill={textFill}
                        fontFamily="sans-serif"
                        fontStyle="bold"
                        opacity={editingTextId === shape.id ? 0 : 1}
                        onDblClick={() => setEditingTextId(shape.id)}
                        onDblTap={() => setEditingTextId(shape.id)}
                      />
                    );
                  }
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
                    const startShape = shape.startId
                      ? shapes.find((s) => s.id === shape.startId)
                      : null;
                    const endShape = shape.endId
                      ? shapes.find((s) => s.id === shape.endId)
                      : null;

                    let startP;
                    let endP;

                    if (startShape && endShape) {
                      const rawStart = getShapeCenter(startShape);
                      const rawEnd = getShapeCenter(endShape);
                      startP = getDockingPoint(startShape, rawEnd);
                      endP = getDockingPoint(endShape, startP);
                    } else if (startShape) {
                      const rawEnd = {
                        x: shape.endX ?? startShape.x,
                        y: shape.endY ?? startShape.y,
                      };
                      startP = getDockingPoint(startShape, rawEnd);
                      endP = rawEnd;
                    } else if (endShape) {
                      const rawStart = {
                        x: shape.startX ?? 0,
                        y: shape.startY ?? 0,
                      };
                      endP = getDockingPoint(endShape, rawStart);
                      startP = rawStart;
                    } else if (
                      shape.startX != null &&
                      shape.endX != null
                    ) {
                      startP = { x: shape.startX, y: shape.startY };
                      endP = { x: shape.endX, y: shape.endY };
                    } else if (
                      Array.isArray(shape.points) &&
                      shape.points.length >= 4
                    ) {
                      startP = { x: shape.points[0], y: shape.points[1] };
                      endP = { x: shape.points[2], y: shape.points[3] };
                    } else {
                      return null;
                    }

                    return (
                      <Arrow
                        key={shape.id}
                        {...commonProps}
                        points={[startP.x, startP.y, endP.x, endP.y]}
                        fill={shape.stroke || "#5ca4f8"}
                        stroke={shape.stroke || "#5ca4f8"}
                        pointerLength={10}
                        pointerWidth={10}
                        tension={0}
                        listening={drawingShapeId !== shape.id}
                      />
                    );
                  }
                  default:
                    return null;
                }
              })}

              {/* Magnetic snap indicator ring when using the arrow tool */}
              {activeTool === "arrow" && hoveredSnapId && (() => {
                const target = shapes.find((s) => s.id === hoveredSnapId);
                if (!target) return null;
                const c = getShapeCenter(target);
                return (
                  <Group listening={false}>
                    <Circle
                      x={c.x}
                      y={c.y}
                      radius={44}
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dash={[6, 4]}
                      opacity={0.85}
                    />
                    <Circle
                      x={c.x}
                      y={c.y}
                      radius={5}
                      fill="#3b82f6"
                      opacity={0.9}
                    />
                  </Group>
                );
              })()}

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

      {/* Floating AI Assistant */}
      <AIAssistant onGenerate={handleAIGenerate} />
    </div>
  );
}
