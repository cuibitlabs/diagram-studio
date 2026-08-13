/**
 * Mermaid export — the return leg the reference tooling never had.
 *
 * A diagram that can only be imported is a trap: once it is in the studio it
 * can never go back into a README. Types that Mermaid cannot express are
 * exported as the closest honest structure, and the mismatch is stated in a
 * header comment rather than glossed over.
 */

import { getRenderer, getType } from "../types/index.js";

const HEADERS = {
  // The direction the type actually draws in, not a guess: an architecture
  // diagram exported as `flowchart LR` must re-import reading left to right.
  flowchart: (diagram) => `flowchart ${diagram.settings?.direction ?? getRenderer(diagram.type).direction ?? "LR"}`,
  state: () => "stateDiagram-v2",
  sequence: () => "sequenceDiagram",
  er: () => "erDiagram",
  gantt: () => "gantt",
  journey: () => "journey",
  "mind-map": () => "mindmap",
  quadrant: () => "quadrantChart",
};

const SHAPE_WRAP = {
  store: ["[(", ")]"],
  decision: ["{", "}"],
  terminal: ["([", "])"],
  actor: ["([", "])"],
  state: ["([", "])"],
  gateway: ["{{", "}}"],
  input: ["[/", "/]"],
  output: ["[\\", "\\]"],
  event: ["((", "))"],
  note: [">", "]"],
};

const FLOW_TYPES = new Set(["architecture", "flowchart", "process", "data-flow", "deployment", "network", "current-state", "high-level", "tree", "org-chart", "swimlane", "loop", "nested", "layers", "medallion", "pyramid"]);

const escapeLabel = (value) => String(value ?? "").replace(/["`]/g, "'").replace(/\n/g, " ").trim();

/** Stable, readable keys: N1, N2, … in model order. */
const keyMap = (diagram) => new Map(diagram.nodes.map((node, index) => [node.id, `N${index + 1}`]));

function flowBody(diagram, keys) {
  const rows = [];
  const grouped = new Set();

  for (const group of diagram.groups ?? []) {
    rows.push(`  subgraph ${escapeLabel(group.label)}`);
    for (const id of group.nodes ?? []) {
      const node = diagram.nodes.find((item) => item.id === id);
      if (!node) continue;
      grouped.add(id);
      rows.push(`    ${nodeToken(node, keys)}`);
    }
    rows.push("  end");
  }

  for (const node of diagram.nodes) {
    if (grouped.has(node.id)) continue;
    rows.push(`  ${nodeToken(node, keys)}`);
  }

  for (const edge of diagram.edges) {
    const source = keys.get(edge.source);
    const target = keys.get(edge.target);
    if (!source || !target) continue;
    const arrow = edge.dashed ? "-.->" : "-->";
    const label = escapeLabel(edge.label);
    rows.push(`  ${source} ${arrow}${label ? `|${label}|` : ""} ${target}`);
  }
  return rows;
}

function nodeToken(node, keys) {
  const [open, close] = SHAPE_WRAP[node.role] ?? ["[", "]"];
  const label = escapeLabel(node.sublabel ? `${node.label} · ${node.sublabel}` : node.label);
  return `${keys.get(node.id)}${open}"${label}"${close}`;
}

function sequenceBody(diagram, keys) {
  const rows = diagram.nodes.map((node) => `  participant ${keys.get(node.id)} as ${escapeLabel(node.label)}`);
  for (const edge of diagram.edges) {
    const source = keys.get(edge.source);
    const target = keys.get(edge.target);
    if (!source || !target) continue;
    const arrow = edge.kind === "return" || edge.dashed ? "-->>" : "->>";
    rows.push(`  ${source}${arrow}${target}: ${escapeLabel(edge.label) || "message"}`);
  }
  return rows;
}

function erBody(diagram, keys) {
  const rows = [];
  for (const edge of diagram.edges) {
    const source = keys.get(edge.source);
    const target = keys.get(edge.target);
    if (!source || !target) continue;
    rows.push(`  ${source} ||--o{ ${target} : "${escapeLabel(edge.label) || "relates to"}"`);
  }
  for (const node of diagram.nodes) {
    const fields = Array.isArray(node.fields) ? node.fields : [];
    if (!fields.length) continue;
    rows.push(`  ${keys.get(node.id)} {`);
    for (const field of fields) rows.push(`    ${field.type ?? "string"} ${field.name}${field.key ? ` ${field.key}` : ""}`);
    rows.push("  }");
  }
  return rows;
}

function ganttBody(diagram) {
  const rows = ["  dateFormat X", "  axisFormat %s", "  section Schedule"];
  for (const node of diagram.nodes) {
    if (typeof node.start !== "number" || typeof node.duration !== "number") {
      rows.push(`  %% ${escapeLabel(node.label)} has no schedule in the model`);
      continue;
    }
    rows.push(`  ${escapeLabel(node.label)} : ${node.start}, ${node.duration}`);
  }
  return rows;
}

function journeyBody(diagram) {
  const rows = ["  section Journey"];
  for (const node of diagram.nodes) {
    const score = typeof node.value === "number" ? Math.max(1, Math.round((node.value / 100) * 5)) : 3;
    rows.push(`  ${escapeLabel(node.label)}: ${score}: Customer`);
  }
  return rows;
}

function mindmapBody(diagram, keys) {
  const children = new Map();
  const claimed = new Set();
  for (const edge of diagram.edges) {
    if (claimed.has(edge.target)) continue;
    claimed.add(edge.target);
    if (!children.has(edge.source)) children.set(edge.source, []);
    children.get(edge.source).push(edge.target);
  }
  const roots = diagram.nodes.filter((node) => !claimed.has(node.id));
  const rows = [];
  const walk = (id, depth) => {
    const node = diagram.nodes.find((item) => item.id === id);
    if (!node) return;
    rows.push(`${"  ".repeat(depth + 1)}${escapeLabel(node.label)}`);
    for (const child of children.get(id) ?? []) walk(child, depth + 1);
  };
  for (const root of roots) walk(root.id, 0);
  return rows.length ? rows : diagram.nodes.map((node) => `  ${escapeLabel(node.label)}`);
}

/** State diagrams label transitions with `: event` and mark entry/exit with `[*]`. */
function stateBody(diagram, keys) {
  // `stateKind` is set during layout, so a project that has never been rendered
  // has none. Fall back to the same rule the renderer uses.
  const incoming = new Set(diagram.edges.map((edge) => edge.target));
  const outgoing = new Set(diagram.edges.map((edge) => edge.source));
  const isInitial = (node) => node.stateKind === "initial" || (!node.stateKind && !incoming.has(node.id));
  const isFinal = (node) => node.stateKind === "final" || (!node.stateKind && !outgoing.has(node.id));

  const rows = diagram.nodes.map((node) => `  state "${escapeLabel(node.label)}" as ${keys.get(node.id)}`);
  for (const node of diagram.nodes) {
    if (isInitial(node)) rows.push(`  [*] --> ${keys.get(node.id)}`);
  }
  for (const edge of diagram.edges) {
    const source = keys.get(edge.source);
    const target = keys.get(edge.target);
    if (!source || !target) continue;
    const label = escapeLabel(edge.label);
    rows.push(`  ${source} --> ${target}${label ? ` : ${label}` : ""}`);
  }
  for (const node of diagram.nodes) {
    if (isFinal(node)) rows.push(`  ${keys.get(node.id)} --> [*]`);
  }
  return rows;
}

function quadrantBody(diagram) {
  const axes = diagram.axes ?? {};
  const rows = [];
  if (axes.x?.low) rows.push(`  x-axis ${escapeLabel(axes.x.low)} --> ${escapeLabel(axes.x.high ?? "")}`);
  if (axes.y?.low) rows.push(`  y-axis ${escapeLabel(axes.y.low)} --> ${escapeLabel(axes.y.high ?? "")}`);
  for (const node of diagram.nodes) {
    const px = typeof node.px === "number" ? node.px / 100 : 0.5;
    const py = typeof node.py === "number" ? node.py / 100 : 0.5;
    rows.push(`  ${escapeLabel(node.label)}: [${px.toFixed(2)}, ${py.toFixed(2)}]`);
  }
  return rows;
}

/**
 * @param {object} diagram
 * @returns {{text: string, notes: string[]}}
 */
export function toMermaid(diagram) {
  const keys = keyMap(diagram);
  const notes = [];
  const type = diagram.type;
  let header;
  let body;

  if (type === "sequence") {
    header = HEADERS.sequence();
    body = sequenceBody(diagram, keys);
  } else if (type === "er") {
    header = HEADERS.er();
    body = erBody(diagram, keys);
  } else if (type === "gantt") {
    header = HEADERS.gantt();
    body = ganttBody(diagram);
    notes.push("Gantt exported with numeric day offsets rather than calendar dates.");
  } else if (type === "journey") {
    header = HEADERS.journey();
    body = journeyBody(diagram);
    notes.push("Sentiment rescaled from 0–100 back to Mermaid's 1–5 scores.");
  } else if (type === "mind-map") {
    header = HEADERS["mind-map"]();
    body = mindmapBody(diagram, keys);
  } else if (type === "quadrant") {
    header = HEADERS.quadrant();
    body = quadrantBody(diagram);
  } else if (type === "state") {
    header = HEADERS.state();
    body = stateBody(diagram, keys);
  } else if (FLOW_TYPES.has(type)) {
    header = HEADERS.flowchart(diagram);
    body = flowBody(diagram, keys);
    if (!["architecture", "flowchart", "process", "data-flow", "deployment", "network", "current-state", "high-level"].includes(type)) {
      notes.push(`Mermaid has no ${getType(type).label.toLowerCase()} type; exported as a flowchart, which loses the ${getType(type).family} structure.`);
    }
  } else {
    header = HEADERS.flowchart(diagram);
    body = flowBody(diagram, keys);
    notes.push(`Mermaid cannot express a ${getType(type).label.toLowerCase()}. Exported as a flowchart of the same elements; values, axes and positions are not represented.`);
  }

  const preamble = [`%% ${diagram.title}`, ...notes.map((note) => `%% ${note}`)];
  return { text: [...preamble, header, ...body].join("\n"), notes };
}
