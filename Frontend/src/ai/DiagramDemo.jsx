import { useState, useEffect } from "react";
import { Stage, Layer } from "react-konva";
import AIDiagramLayer from "./AIDiagramLayer";
import { layoutDiagram } from "./layoutDiagram";
import { sampleDiagram } from "./sampleDiagram";

// Temporary test page. Render <DiagramDemo /> anywhere (e.g. a /demo route).
const laidOut = layoutDiagram(sampleDiagram);

export default function DiagramDemo() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#f8fafc" }}>
      <div style={{
        position: "absolute",
        top: 16,
        left: 20,
        zIndex: 10,
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(8px)",
        padding: "8px 16px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
        fontFamily: "sans-serif"
      }}>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>
          Phase 2: Dagre Diagram Demo ({sampleDiagram.title})
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
          Nodes are draggable · Edges re-route dynamically · Dashed = Async
        </p>
      </div>

      <Stage width={size.width} height={size.height} style={{ background: "#f8fafc" }}>
        <Layer>
          <AIDiagramLayer diagram={laidOut} />
        </Layer>
      </Stage>
    </div>
  );
}
