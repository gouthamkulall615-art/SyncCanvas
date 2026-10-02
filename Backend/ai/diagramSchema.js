import { z } from "zod";

export const NODE_TYPES = [
  "client", "cdn", "gateway", "lb", "service", "worker",
  "db", "cache", "queue", "storage", "search", "external",
];

export const PROTOCOLS = [
  "HTTP", "gRPC", "WebSocket", "TCP", "SQL", "Queue", "Event", "Other",
];

const nodeSchema = z.object({
  id: z.string().regex(/^n\d+$/, "id must look like n1, n2, ..."),
  type: z.enum(NODE_TYPES),
  label: z.string().min(1).max(40),
  tech: z.string().max(40).optional(),   // e.g. "Redis"
  reason: z.string().min(1).max(160),    // why this component / tech
  notes: z.string().max(160).optional(), // capacity, caveats
});

const edgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().min(1).max(40),      // what data flows
  protocol: z.enum(PROTOCOLS),
  async: z.boolean().default(false),
});

export const diagramSchema = z
  .object({
    title: z.string().min(1).max(80),
    requirements: z.object({
      functional: z.array(z.string().max(120)).max(8),
      non_functional: z.array(z.string().max(120)).max(8),
    }),
    nodes: z.array(nodeSchema).min(3).max(25),
    edges: z.array(edgeSchema).min(2).max(50),
    bottlenecks: z
      .array(z.object({ issue: z.string().max(160), fix: z.string().max(160) }))
      .max(5),
    scaling_notes: z.array(z.string().max(160)).max(6),
  })
  .superRefine((d, ctx) => {
    const ids = new Set();
    d.nodes.forEach((n, i) => {
      if (ids.has(n.id)) {
        ctx.addIssue({ code: "custom", path: ["nodes", i, "id"], message: `duplicate id ${n.id}` });
      }
      ids.add(n.id);
    });
    d.edges.forEach((e, i) => {
      if (!ids.has(e.from)) {
        ctx.addIssue({ code: "custom", path: ["edges", i, "from"], message: `unknown node ${e.from}` });
      }
      if (!ids.has(e.to)) {
        ctx.addIssue({ code: "custom", path: ["edges", i, "to"], message: `unknown node ${e.to}` });
      }
      if (e.from === e.to) {
        ctx.addIssue({ code: "custom", path: ["edges", i], message: "self-loop edge" });
      }
    });
  });
