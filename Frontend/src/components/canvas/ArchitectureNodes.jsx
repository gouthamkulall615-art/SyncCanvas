import { Path, Group, Rect, Text } from "react-konva";

// 1. Removed the 'export' keyword from this constant
const ARCHITECTURE_PATHS = {
  database:
    "M12 2C6.48 2 2 3.79 2 6s4.48 4 10 4 10-1.79 10-4-4.48-4-10-4zm0 6c-5.52 0-10-1.79-10-4v4c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0 2.21-4.48 4-10 4zm0 6c-5.52 0-10-1.79-10-4v4c0 2.21 4.48 4 10 4s10-1.79 10-4v-4c0 2.21-4.48 4-10 4z",
  server:
    "M4 2h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 12h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zm3-7h2v2H7V5zm0 12h2v2H7v-2z",
  client:
    "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  cloud:
    "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z",

  queue: "M12 2 L2 7 L12 12 L22 7 Z M2 17 L12 22 L22 17 M2 12 L12 17 L22 12",
  worker:
    "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3",
  internet:
    "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  mobile:
    "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M11.5 18h1",
  auth: "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4",
};

// Clean, soft pastel fills paired with high-contrast rich strokes for light theme (gentle on eyes, no harsh black blobs)
export const LIGHT_NODE_PALETTE = {
  client: { fill: "#e2e8f0", stroke: "#334155" },
  mobile: { fill: "#e0e7ff", stroke: "#4338ca" },
  internet: { fill: "#e0f2fe", stroke: "#0369a1" },
  server: { fill: "#d1fae5", stroke: "#047857" },
  worker: { fill: "#ccfbf1", stroke: "#0f766e" },
  database: { fill: "#dbeafe", stroke: "#1d4ed8" },
  queue: { fill: "#fef3c7", stroke: "#b45309" },
  cloud: { fill: "#ede9fe", stroke: "#6d28d9" },
  auth: { fill: "#ffe4e6", stroke: "#be123c" },
};

// Deep, sleek dark-mode palette
export const DARK_NODE_PALETTE = {
  client: { fill: "#1e293b", stroke: "#94a3b8" },
  mobile: { fill: "#1e2238", stroke: "#60a5fa" },
  internet: { fill: "#16283b", stroke: "#38bdf8" },
  server: { fill: "#132d24", stroke: "#34d399" },
  worker: { fill: "#132e2b", stroke: "#2dd4bf" },
  database: { fill: "#172844", stroke: "#60a5fa" },
  queue: { fill: "#302213", stroke: "#fbbf24" },
  cloud: { fill: "#27193f", stroke: "#c084fc" },
  auth: { fill: "#351726", stroke: "#f472b6" },
};

export function ArchitectureNode({ shape, commonProps, theme = "dark" }) {
  const { fill, stroke, strokeWidth, dash, ...groupProps } = commonProps;
  const label = shape.label;
  const isLight = theme === "light";

  const palette = isLight ? LIGHT_NODE_PALETTE[shape.type] : DARK_NODE_PALETTE[shape.type];

  // Detect if fill is dark default
  const isDefaultDarkFill =
    !shape.fill ||
    shape.fill === "#262627" ||
    shape.fill === "#20456b" ||
    shape.fill === "#1e293b" ||
    shape.fill === "#0b0d13";

  // Detect default/AI neon strokes
  const isDefaultStroke =
    !shape.stroke ||
    shape.stroke === "#5ca4f8" ||
    shape.stroke === "#10b981" ||
    shape.stroke === "#ec4899" ||
    shape.stroke === "#8b5cf6" ||
    shape.stroke === "#f59e0b" ||
    shape.stroke === "#14b8a6" ||
    shape.stroke === "#0ea5e9" ||
    shape.stroke === "#3b82f6" ||
    shape.stroke === "#64748b";

  let resolvedFill = shape.fill;
  if (isLight && (isDefaultDarkFill || !shape.fill)) {
    resolvedFill = palette?.fill || "#e2e8f0";
  } else if (!isLight && (!shape.fill || shape.fill === "#f1f5f9" || shape.fill === "#e2e8f0")) {
    resolvedFill = palette?.fill || "#1e293b";
  }

  let resolvedStroke = shape.stroke;
  if (isLight && isDefaultStroke) {
    resolvedStroke = palette?.stroke || "#1d4ed8";
  } else if (!isLight && isDefaultStroke) {
    resolvedStroke = palette?.stroke || "#5ca4f8";
  }

  const labelColor = isLight ? "#0f172a" : "#f8fafc";
  const labelHalo = isLight ? "#ffffff" : "#0e1116";

  return (
    <Group {...groupProps}>
      {/* Hitbox for easy clicking, dragging, and magnetic snapping */}
      <Rect
        id={commonProps.id}
        x={-6}
        y={-6}
        width={36}
        height={label ? 48 : 36}
        fill="transparent"
        listening={true}
      />
      <Path
        id={commonProps.id}
        data={ARCHITECTURE_PATHS[shape.type]}
        fill={resolvedFill}
        stroke={resolvedStroke}
        strokeWidth={shape.strokeWidth || 1.8}
        strokeScaleEnabled={false}
      />
      {label && (
        <Text
          id={commonProps.id}
          text={label}
          x={-28}
          y={26}
          width={80}
          align="center"
          fontSize={4.6}
          lineHeight={1.22}
          fill={labelColor}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontStyle="bold"
          stroke={labelHalo}
          strokeWidth={isLight ? 2.5 : 2}
          fillAfterStrokeEnabled={true}
          listening={true}
        />
      )}
    </Group>
  );
}
