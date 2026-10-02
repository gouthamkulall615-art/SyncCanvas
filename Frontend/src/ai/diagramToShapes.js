import { NODE_W, NODE_H } from "./layoutDiagram";
import { normalizeType } from "./nodeCatalog";

const COLOR = {
  client: "#64748b",
  mobile: "#3b82f6",
  internet: "#0ea5e9",
  server: "#10b981",
  worker: "#14b8a6",
  database: "#3b82f6",
  queue: "#f59e0b",
  cloud: "#8b5cf6",
  auth: "#ec4899",
};

const newId = () => `shape-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

// Architecture node center: icon is 24x24 at scale 3, center is at (x + 36, y + 36)
const getNodeCenter = (pos) => ({ x: pos.x + 36, y: pos.y + 36 });

// Docking point along the 38px radius boundary (matching CanvasBoard getDockingPoint)
function dockingPoint(center, target) {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const dist = Math.hypot(dx, dy) || 1;
  const r = 38;
  return { x: center.x + (dx / dist) * r, y: center.y + (dy / dist) * r };
}

/**
 * diagram: output of layoutDiagram() (nodes have x/y)
 * origin: where on the canvas to place the top-left of the diagram
 * Returns an array of [id, shape] ready for shapesMap.set(id, shape)
 */
export function diagramToShapes(diagram, origin = { x: 100, y: 100 }) {
  const groupId = `ai-group-${Date.now()}`;
  const idOf = {};
  const topLeft = {};
  const entries = [];

  diagram.nodes.forEach((n) => {
    const id = newId();
    const type = normalizeType(n.type);
    idOf[n.id] = id;
    topLeft[n.id] = { x: origin.x + n.x, y: origin.y + n.y };

    // Format label to show tech if provided (e.g. "API Gateway (Nginx)")
    const displayLabel = n.tech ? `${n.label}\n(${n.tech})` : n.label;

    // Created identically to how the CanvasBoard toolbox creates an ArchitectureNode
    entries.push([
      id,
      {
        type,
        x: topLeft[n.id].x,
        y: topLeft[n.id].y,
        label: displayLabel,
        rawLabel: n.label,
        tech: n.tech || "",
        fill: "#262627",
        stroke: COLOR[type] || "#5ca4f8",
        strokeWidth: 2,
        dash: [],
        scaleX: 3,
        scaleY: 3,
        aiGroup: groupId,
        aiReason: n.reason,
      },
    ]);
  });

  diagram.edges.forEach((e) => {
    const a = topLeft[e.from];
    const b = topLeft[e.to];
    if (!a || !b) return;

    const ca = getNodeCenter(a);
    const cb = getNodeCenter(b);
    const p1 = dockingPoint(ca, cb);
    const p2 = dockingPoint(cb, ca);

    entries.push([
      newId(),
      {
        type: "arrow",
        startId: idOf[e.from],
        endId: idOf[e.to],
        points: [p1.x, p1.y, p2.x, p2.y],
        stroke: "#5ca4f8",
        strokeWidth: 2,
        dashed: !!e.async,
        dash: e.async ? [8, 6] : [],
        label: e.label ? `${e.label} (${e.protocol})` : "",
        aiGroup: groupId,
      },
    ]);
  });

  return entries;
}

// One transaction = one network update and one undo step for all collaborators.
export function addAIDiagram(shapesMap, diagram, origin) {
  const entries = diagramToShapes(diagram, origin);
  if (shapesMap.doc?.transact) {
    shapesMap.doc.transact(() => {
      entries.forEach(([id, shape]) => shapesMap.set(id, shape));
    });
  } else {
    entries.forEach(([id, shape]) => shapesMap.set(id, shape));
  }
  return entries.length;
}
