export const DIAGRAM_TYPES = [
  ["architecture", "Architecture", "flow", "Systems, services and connections"],
  ["flowchart", "Flowchart", "flow", "Decisions and process logic"],
  ["sequence", "Sequence", "sequence", "Messages arranged over time"],
  ["state", "State machine", "flow", "States and valid transitions"],
  ["er", "ER / data model", "flow", "Entities, fields and relations"],
  ["timeline", "Timeline", "timeline", "Events on a clear axis"],
  ["swimlane", "Swimlane", "flow", "Cross-functional ownership"],
  ["quadrant", "Quadrant", "quadrant", "Two-axis positioning"],
  ["nested", "Nested systems", "layers", "Hierarchy by containment"],
  ["tree", "Tree", "hierarchy", "Parent and child relationships"],
  ["org-chart", "Org chart", "hierarchy", "Teams, ownership and reporting"],
  ["venn", "Venn", "venn", "Set overlap and shared value"],
  ["layers", "Layer stack", "layers", "Stacked abstractions"],
  ["pyramid", "Pyramid / funnel", "pyramid", "Priority, maturity or drop-off"],
  ["matrix", "Consultant matrix", "quadrant", "Named strategic scenarios"],
  ["radar", "Radar", "radar", "Multi-axis comparison"],
  ["loop", "Loop / flywheel", "loop", "A reinforcing cycle around a hub"],
  ["current-state", "Current state", "flow", "Legacy landscape and constraints"],
  ["high-level", "High-level system", "flow", "End-to-end platform view"],
  ["bar", "Bar chart", "bar", "Categorical comparison"],
  ["line", "Line chart", "line", "Trends over time"],
  ["gantt", "Gantt", "gantt", "Tasks, timing and phases"],
  ["scatter", "Scatter plot", "scatter", "Distribution and correlation"],
  ["process", "Process", "flow", "Multi-step operational workflow"],
  ["medallion", "Medallion", "layers", "Bronze, silver and gold data tiers"],
  ["data-flow", "Data flow", "flow", "Sources, transformations and destinations"],
  ["mind-map", "Mind map", "loop", "Ideas branching from a central concept"],
  ["network", "Network topology", "flow", "Devices, zones and links"],
  ["deployment", "Deployment", "layers", "Runtime environments and releases"],
  ["roadmap", "Roadmap", "timeline", "Initiatives across horizons"],
  ["journey", "Customer journey", "timeline", "Stages, actions and sentiment"],
].map(([id, label, family, description]) => ({ id, label, family, description }));

export const PALETTES = {
  editorial: { name: "Paper & coral", paper: "#f3f0e9", panel: "#fffdf8", ink: "#1d211f", muted: "#6e746f", accent: "#e85d3f", accent2: "#174f46", line: "#b9b5ac" },
  midnight: { name: "Midnight", paper: "#111512", panel: "#191e1a", ink: "#f1efe7", muted: "#9ba69e", accent: "#ff7557", accent2: "#64d8b0", line: "#424b44" },
  cobalt: { name: "Cobalt", paper: "#eef3fb", panel: "#ffffff", ink: "#15233d", muted: "#64708a", accent: "#2f62d6", accent2: "#d45078", line: "#afbdd7" },
  moss: { name: "Moss", paper: "#eef0e5", panel: "#fafbf5", ink: "#263126", muted: "#687265", accent: "#607b4d", accent2: "#bf6b48", line: "#b5bcae" },
  mono: { name: "Monochrome", paper: "#f4f4f2", panel: "#ffffff", ink: "#161616", muted: "#6a6a68", accent: "#161616", accent2: "#777772", line: "#bcbcb8" },
};

const typeMap = Object.fromEntries(DIAGRAM_TYPES.map((item) => [item.id, item]));
let nextNumber = 1;
export const makeId = (prefix = "item") => `${prefix}-${Date.now().toString(36)}-${nextNumber++}`;

const samples = {
  architecture: ["Experience", "API gateway", "Core service", "Data store", "Observability"],
  flowchart: ["New request", "Validate", "Decision", "Process", "Complete"],
  sequence: ["Customer", "Web app", "Gateway", "Service", "Database"],
  state: ["Draft", "Review", "Approved", "Published", "Archived"],
  er: ["Customer", "Order", "Order item", "Product", "Payment"],
  timeline: ["Discover", "Prototype", "Pilot", "Launch", "Scale"],
  swimlane: ["Request", "Triage", "Design", "Build", "Release"],
  quadrant: ["Quick wins", "Strategic bets", "Fill-ins", "Avoid"],
  nested: ["Platform", "Experience layer", "Service layer", "Data layer"],
  tree: ["Platform", "Experience", "Services", "Web", "Mobile", "Data"],
  "org-chart": ["CEO", "Product", "Engineering", "Design", "Data", "Operations"],
  venn: ["Desirable", "Viable", "Feasible"],
  layers: ["Experience", "Application", "Domain", "Data", "Infrastructure"],
  pyramid: ["Vision", "Strategy", "Programs", "Projects", "Tasks"],
  matrix: ["Transform", "Optimize", "Maintain", "Retire"],
  radar: ["Speed", "Quality", "Cost", "Security", "Adoption", "Scale"],
  loop: ["Discover", "Decide", "Deliver", "Measure", "Learn"],
  "current-state": ["Channels", "Point solutions", "Legacy core", "Data silos", "Manual ops"],
  "high-level": ["Users", "Experience", "Platform", "Intelligence", "Operations"],
  bar: ["Research", "Design", "Build", "Launch", "Improve"],
  line: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  gantt: ["Discovery", "Design", "Build", "Pilot", "Launch"],
  scatter: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"],
  process: ["Intake", "Qualify", "Plan", "Execute", "Review"],
  medallion: ["Bronze / raw", "Silver / clean", "Gold / trusted"],
  "data-flow": ["Sources", "Ingest", "Transform", "Model", "Serve"],
  "mind-map": ["Product", "People", "Process", "Technology", "Market", "Metrics"],
  network: ["Internet", "Edge", "Application", "Private network", "Database"],
  deployment: ["Commit", "Build", "Test", "Staging", "Production"],
  roadmap: ["Now", "Next", "Later", "Future"],
  journey: ["Awareness", "Evaluate", "Buy", "Onboard", "Grow"],
};

function node(label, index, total, family) {
  const cols = Math.min(total, 4);
  const row = Math.floor(index / cols);
  const col = index % cols;
  const base = { id: makeId("node"), label, sublabel: "Double-click to edit", x: 120 + col * 260, y: 160 + row * 180, w: 196, h: 88, value: 34 + ((index * 17) % 58), tone: index === 1 ? "accent" : "default" };
  if (["quadrant", "venn", "loop", "radar", "scatter"].includes(family)) {
    base.x = 220 + ((index * 173) % 720);
    base.y = 150 + ((index * 117) % 430);
  }
  if (family === "timeline") { base.x = 140 + index * (880 / Math.max(1, total - 1)); base.y = index % 2 ? 430 : 270; }
  if (family === "gantt") { base.x = 260 + index * 80; base.y = 150 + index * 92; base.w = 220 + (index % 3) * 60; base.h = 48; }
  return base;
}

function defaultEdges(nodes, type) {
  if (["bar", "line", "scatter", "radar", "venn", "quadrant", "pyramid", "layers", "gantt", "timeline", "roadmap", "journey"].includes(type)) return [];
  if (["tree", "org-chart"].includes(type)) return nodes.slice(1).map((n, i) => ({ id: makeId("edge"), source: nodes[Math.floor(i / 2)].id, target: n.id, label: "", dashed: false }));
  return nodes.slice(0, -1).map((n, i) => ({ id: makeId("edge"), source: n.id, target: nodes[i + 1].id, label: i === 1 ? "signal" : "", dashed: type === "loop" && i === nodes.length - 2 }));
}

export function createDiagram(type = "architecture", title) {
  const meta = typeMap[type] || typeMap.architecture;
  const labels = samples[meta.id] || samples.architecture;
  const nodes = labels.map((label, index) => node(label, index, labels.length, meta.family));
  return {
    version: 1,
    id: makeId("diagram"),
    type: meta.id,
    title: title || `${meta.label} overview`,
    description: meta.description,
    width: 1200,
    height: 760,
    theme: { ...PALETTES.editorial },
    nodes,
    edges: defaultEdges(nodes, meta.id),
    annotations: [],
    settings: { grid: true, density: "balanced", corner: 8 },
  };
}

const keywordTypes = [
  [/(sequence|message|request.*response|oauth)/i, "sequence"], [/(state|status|lifecycle)/i, "state"],
  [/(database|entity|schema|relationship|data model)/i, "er"], [/(timeline|history|milestone)/i, "timeline"],
  [/(roadmap|now next later)/i, "roadmap"], [/(journey|touchpoint|customer experience)/i, "journey"],
  [/(gantt|schedule|project plan)/i, "gantt"], [/(quadrant|2x2|matrix)/i, "quadrant"],
  [/(venn|overlap|intersection)/i, "venn"], [/(pyramid|funnel|hierarchy of needs)/i, "pyramid"],
  [/(org chart|reporting line|organization)/i, "org-chart"], [/(tree|taxonomy|hierarchy)/i, "tree"],
  [/(radar|spider)/i, "radar"], [/(scatter|correlation)/i, "scatter"], [/(bar chart|compare values)/i, "bar"],
  [/(line chart|trend|growth over time)/i, "line"], [/(flywheel|loop|cycle)/i, "loop"],
  [/(mind map|brainstorm)/i, "mind-map"], [/(network|topology|subnet)/i, "network"],
  [/(deployment|release pipeline|ci\/cd)/i, "deployment"], [/(data flow|etl|pipeline)/i, "data-flow"],
  [/(medallion|bronze.*silver.*gold)/i, "medallion"], [/(flowchart|decision|if then)/i, "flowchart"],
  [/(process|workflow|steps)/i, "process"],
];

function extractLabels(prompt) {
  const arrowLine = prompt.split(/\n/).find((line) => /(?:--?>|→|=>)/.test(line));
  if (arrowLine) return arrowLine.split(/\s*(?:--?>|→|=>)\s*/).map((s) => s.replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean).slice(0, 12);
  const bullets = prompt.split(/\n/).map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter((s) => s && s.length < 70);
  return bullets.length >= 3 ? bullets.slice(0, 12) : [];
}

export function createFromPrompt(prompt) {
  const selected = keywordTypes.find(([pattern]) => pattern.test(prompt));
  const type = selected?.[1] || "architecture";
  const titleMatch = prompt.match(/(?:titled?|called|about)\s+["“]?([^\n"”.,]{3,60})/i);
  const diagram = createDiagram(type, titleMatch?.[1]?.trim() || `${typeMap[type].label}: ${prompt.trim().split(/[.!?\n]/)[0].slice(0, 56) || "Untitled"}`);
  const labels = extractLabels(prompt);
  if (labels.length >= 2) {
    const meta = typeMap[type];
    diagram.nodes = labels.map((label, index) => node(label, index, labels.length, meta.family));
    diagram.edges = defaultEdges(diagram.nodes, type);
  }
  diagram.description = prompt.trim().slice(0, 180) || typeMap[type].description;
  return diagram;
}

export function applyAutoLayout(diagram) {
  const family = typeMap[diagram.type]?.family || "flow";
  const count = diagram.nodes.length;
  diagram.nodes.forEach((item, index) => {
    const fresh = node(item.label, index, count, family);
    item.x = fresh.x; item.y = fresh.y;
    if (family !== "gantt") { item.w = item.w || fresh.w; item.h = item.h || fresh.h; }
  });
  return diagram;
}

export function cloneDiagram(diagram) {
  return JSON.parse(JSON.stringify(diagram));
}

export function validateDiagram(diagram) {
  const errors = [];
  if (!diagram || typeof diagram !== "object") return ["Diagram must be an object"];
  if (!typeMap[diagram.type]) errors.push(`Unknown diagram type: ${diagram.type}`);
  if (!Array.isArray(diagram.nodes)) errors.push("nodes must be an array");
  if (!Array.isArray(diagram.edges)) errors.push("edges must be an array");
  const ids = new Set((diagram.nodes || []).map((item) => item.id));
  for (const edge of diagram.edges || []) if (!ids.has(edge.source) || !ids.has(edge.target)) errors.push(`Edge ${edge.id} has a missing endpoint`);
  return errors;
}

export const getType = (id) => typeMap[id] || typeMap.architecture;
