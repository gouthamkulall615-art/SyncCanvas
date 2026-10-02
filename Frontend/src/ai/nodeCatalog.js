// Single source of truth for which toolbox nodes the AI may use.
// Ids must match the node ids in ArchitectureNodes.jsx (lowercase assumed; adjust if different).
// Keep one copy for the backend and an identical copy in the frontend.

export const CATALOG = [
  { id: "client",   desc: "Web browser or desktop user client" },
  { id: "mobile",   desc: "Mobile app client" },
  { id: "internet", desc: "Public internet, external users, or third-party networks" },
  { id: "server",   desc: "Any backend service: API server, gateway, load balancer, app service. Use label and tech to say which" },
  { id: "worker",   desc: "Background job processor, queue consumer, cron job, analytics worker" },
  { id: "database", desc: "Any data store: SQL, NoSQL, cache (Redis), search index, object storage. Use label and tech to say which" },
  { id: "queue",    desc: "Message queue or event stream (Kafka, RabbitMQ, SQS)" },
  { id: "cloud",    desc: "Managed cloud or third-party service: CDN, S3, Stripe, push notifications, external API" },
  { id: "auth",     desc: "Authentication / authorization service (OAuth, JWT, SSO)" },
];

// Add these to CATALOG ONLY AFTER you create the matching node in the toolbox.
export const PLANNED = [
  { id: "cache",        desc: "In-memory cache (Redis, Memcached)" },
  { id: "loadbalancer", desc: "Load balancer (Nginx, ALB)" },
  { id: "gateway",      desc: "API gateway" },
  { id: "cdn",          desc: "Content delivery network" },
  { id: "storage",      desc: "Object / file storage (S3)" },
];

// If the AI returns a type the toolbox doesn't have, map it to the closest real one.
const FALLBACK = {
  cache: "database", search: "database", storage: "database", datastore: "database",
  gateway: "server", loadbalancer: "server", lb: "server", service: "server", api: "server",
  cdn: "cloud", external: "cloud",
  user: "client", web: "client", browser: "client",
};

export const NODE_TYPES = CATALOG.map((c) => c.id);

export const normalizeType = (t) => {
  const key = String(t || "").toLowerCase().trim();
  return NODE_TYPES.includes(key) ? key : FALLBACK[key] || "server";
};

// Paste this into the system prompt
export const catalogForPrompt = () =>
  CATALOG.map((c) => `- ${c.id}: ${c.desc}`).join("\n");
