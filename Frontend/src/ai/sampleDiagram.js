export const sampleDiagram = {
  title: "URL Shortener",
  requirements: { functional: [], non_functional: [] },
  nodes: [
    { id: "n1", type: "client", label: "Web / Mobile Client", reason: "Users" },
    { id: "n2", type: "gateway", label: "API Gateway", tech: "Nginx", reason: "TLS, rate limit" },
    { id: "n3", type: "service", label: "Shortener Service", tech: "Node.js", reason: "Logic" },
    { id: "n4", type: "cache", label: "Hot URL Cache", tech: "Redis", reason: "Fast reads" },
    { id: "n5", type: "db", label: "URL Store", tech: "PostgreSQL", reason: "Mappings" },
    { id: "n6", type: "queue", label: "Click Events", tech: "Kafka", reason: "Async analytics" },
    { id: "n7", type: "worker", label: "Analytics Worker", tech: "Node.js", reason: "Aggregation" },
  ],
  edges: [
    { from: "n1", to: "n2", label: "create / redirect", protocol: "HTTP", async: false },
    { from: "n2", to: "n3", label: "forward request", protocol: "HTTP", async: false },
    { from: "n3", to: "n4", label: "lookup code", protocol: "TCP", async: false },
    { from: "n3", to: "n5", label: "read/write mapping", protocol: "SQL", async: false },
    { from: "n3", to: "n6", label: "publish click", protocol: "Queue", async: true },
    { from: "n6", to: "n7", label: "consume clicks", protocol: "Queue", async: true },
    { from: "n7", to: "n5", label: "write stats", protocol: "SQL", async: true },
  ],
  bottlenecks: [],
  scaling_notes: [],
};
