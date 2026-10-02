import dagre from "@dagrejs/dagre";

export const NODE_W = 190;
export const NODE_H = 72;

// Takes the AI's validated JSON, returns the same JSON with x/y on every node.
export function layoutDiagram(diagram) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 50, ranksep: 120, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  diagram.nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  diagram.edges.forEach((e) => g.setEdge(e.from, e.to));
  dagre.layout(g);

  return {
    ...diagram,
    nodes: diagram.nodes.map((n) => {
      const p = g.node(n.id); // dagre returns the CENTER of the node
      return { ...n, x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
    }),
  };
}
