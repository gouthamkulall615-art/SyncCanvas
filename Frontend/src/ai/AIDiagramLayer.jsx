import { useEffect, useState } from "react";
import { Group, Rect, Text, Arrow } from "react-konva";
import { NODE_W, NODE_H } from "./layoutDiagram";

// Color + icon per node type
const STYLE = {
  client:   { color: "#64748b", icon: "🖥️" },
  cdn:      { color: "#0ea5e9", icon: "🌐" },
  gateway:  { color: "#8b5cf6", icon: "🚪" },
  lb:       { color: "#6366f1", icon: "⚖️" },
  service:  { color: "#10b981", icon: "⚙️" },
  worker:   { color: "#14b8a6", icon: "🛠️" },
  db:       { color: "#3b82f6", icon: "🗄️" },
  cache:    { color: "#ef4444", icon: "⚡" },
  queue:    { color: "#f59e0b", icon: "📨" },
  storage:  { color: "#a16207", icon: "📦" },
  search:   { color: "#ec4899", icon: "🔍" },
  external: { color: "#94a3b8", icon: "🔌" },
};

// Point where the line from center c toward `other` leaves the node rectangle
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
 * Put this inside a react-konva <Layer>.
 * `diagram` must already be run through layoutDiagram().
 */
export default function AIDiagramLayer({ diagram }) {
  const initial = () =>
    Object.fromEntries(diagram.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  const [pos, setPos] = useState(initial);

  // Reset positions when a new diagram arrives
  useEffect(() => {
    setPos(initial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagram]);

  const center = (id) => ({ x: pos[id].x + NODE_W / 2, y: pos[id].y + NODE_H / 2 });

  return (
    <>
      {/* Arrows first so nodes sit on top */}
      {diagram.edges.map((e, i) => {
        if (!pos[e.from] || !pos[e.to]) return null;
        const a = center(e.from);
        const b = center(e.to);
        const p1 = borderPoint(a, b);
        const p2 = borderPoint(b, a);
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        return (
          <Group key={i}>
            <Arrow
              points={[p1.x, p1.y, p2.x, p2.y]}
              stroke="#475569"
              fill="#475569"
              strokeWidth={2}
              pointerLength={10}
              pointerWidth={10}
              dash={e.async ? [8, 6] : undefined}
            />
            <Text
              x={mx}
              y={my - 8}
              width={150}
              offsetX={75}
              align="center"
              text={`${e.label}\n(${e.protocol})`}
              fontSize={11}
              fill="#334155"
              stroke="#ffffff"
              strokeWidth={3}
              fillAfterStrokeEnabled
              listening={false}
            />
          </Group>
        );
      })}

      {diagram.nodes.map((n) => {
        const st = STYLE[n.type] || STYLE.service;
        return (
          <Group
            key={n.id}
            x={pos[n.id].x}
            y={pos[n.id].y}
            draggable
            onDragMove={(ev) =>
              setPos((p) => ({ ...p, [n.id]: { x: ev.target.x(), y: ev.target.y() } }))
            }
          >
            <Rect
              width={NODE_W}
              height={NODE_H}
              cornerRadius={10}
              fill="#ffffff"
              stroke={st.color}
              strokeWidth={2}
              shadowColor="#000"
              shadowOpacity={0.12}
              shadowBlur={6}
              shadowOffsetY={2}
            />
            <Rect width={8} height={NODE_H} fill={st.color} cornerRadius={[10, 0, 0, 10]} />
            <Text
              x={18}
              y={12}
              width={NODE_W - 26}
              text={`${st.icon} ${n.label}`}
              fontSize={15}
              fontStyle="bold"
              fill="#0f172a"
              wrap="none"
              ellipsis
            />
            <Text
              x={18}
              y={40}
              width={NODE_W - 26}
              text={n.tech || n.type}
              fontSize={12}
              fill={st.color}
              wrap="none"
              ellipsis
            />
          </Group>
        );
      })}
    </>
  );
}
