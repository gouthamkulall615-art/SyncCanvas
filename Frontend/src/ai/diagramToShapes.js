import { NODE_W, NODE_H } from "./layoutDiagram";

// AI node type -> shape type that CanvasBoard already understands.
const TYPE_MAP = {
  client: "rect",
  cdn: "rect",
  gateway: "server",
  lb: "server",
  service: "server",
  worker: "server",
  db: "database",
  cache: "database",
  queue: "rect",
  storage: "database",
  search: "server",
  external: "rect",
};

const COLOR = {
  client: "#64748b",
  cdn: "#0ea5e9",
  gateway: "#8b5cf6",
  lb: "#6366f1",
  service: "#10b981",
  worker: "#14b8a6",
  db: "#3b82f6",
  cache: "#ef4444",
  queue: "#f59e0b",
  storage: "#a16207",
  search: "#ec4899",
  external: "#94a3b8",
};

const ICONS = {
  client: "🖥️",
  cdn: "🌐",
  gateway: "🚪",
  lb: "⚖️",
  service: "⚙️",
  worker: "🛠️",
  db: "🗄️",
  cache: "⚡",
  queue: "📨",
  storage: "📦",
  search: "🔍",
  external: "🔌",
};

const newId = () => `shape-ai-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

// Where the line from center c toward `other` leaves the node rectangle
function borderPoint(c, other) {
  const dx = other.x - c.x;
  const dy = other.y - c.y;
  if (dx === 0 && dy === 0) return c;
  const sx = dx !== 0 ? NODE_W / 2 / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? NODE_H / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: c.x + dx * s, y: c.y + dy * s };
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
    idOf[n.id] = id;
    topLeft[n.id] = { x: origin.x + n.x, y: origin.y + n.y };
    entries.push([
      id,
      {
        type: "rect",
        x: topLeft[n.id].x,
        y: topLeft[n.id].y,
        width: NODE_W,
        height: NODE_H,
        label: n.label,
        tech: n.tech || "",
        icon: ICONS[n.type] || "⚙️",
        stroke: COLOR[n.type] || "#475569",
        fill: "#ffffff",
        aiGroup: groupId,
        aiType: n.type,
        aiReason: n.reason,
      },
    ]);
  });

  diagram.edges.forEach((e) => {
    const a = topLeft[e.from];
    const b = topLeft[e.to];
    const ca = { x: a.x + NODE_W / 2, y: a.y + NODE_H / 2 };
    const cb = { x: b.x + NODE_W / 2, y: b.y + NODE_H / 2 };
    const p1 = borderPoint(ca, cb);
    const p2 = borderPoint(cb, ca);
    entries.push([
      newId(),
      {
        type: "arrow",
        points: [p1.x, p1.y, p2.x, p2.y],
        startId: idOf[e.from],
        endId: idOf[e.to],
        label: `${e.label} (${e.protocol})`,
        stroke: "#64748b",
        dashed: !!e.async,
        dash: e.async ? [8, 6] : [],
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
