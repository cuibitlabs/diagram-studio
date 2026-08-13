/**
 * Project model.
 *
 * A `.diagram.json` project is the source of truth: semantic relationships live
 * in `edges`, roles live on nodes, and nothing meaningful is inferred from
 * coordinates. Renderers may move a node; they may never invent one.
 */

import { DIAGRAM_TYPES, getType, hasType, sampleFor } from "./types/index.js";
import { DEFAULT_PALETTE, PALETTES, paletteOf } from "./theme/palettes.js";
import { unknownIconsIn } from "./render/icons.js";

export { DIAGRAM_TYPES, getType, hasType, sampleFor, DEFAULT_PALETTE, PALETTES, paletteOf };

export const MODEL_VERSION = 2;
export const LIMITS = { nodes: 200, edges: 400, budgetNodes: 9, budgetEdges: 12, accent: 2 };

let counter = 0;
export const makeId = (prefix = "item") => `${prefix}-${(counter++).toString(36)}-${Math.abs(hashString(prefix + counter)).toString(36).slice(0, 4)}`;

function hashString(value) {
  let hash = 0;
  for (const char of String(value)) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return hash;
}

/** Fields copied verbatim from a sample or import onto a model node. */
const NODE_FIELDS = [
  "sublabel", "role", "shape", "tone", "icon", "badge", "value", "px", "py",
  "lane", "horizon", "zone", "constraint", "fields", "start", "duration",
  "marker", "dashed", "stateKind", "promotion", "action", "fixedSize",
  // Fields the later types read. A field missing from this list is silently
  // dropped when a project is built from starter content, which looks like a
  // renderer bug and is not one.
  "values", "row", "col", "column", "process", "wait", "cause", "c4",
  "movement", "kind", "locked",
];

const DIAGRAM_FIELDS = [
  "axes", "lanes", "horizons", "hub", "overlaps", "unit", "timeUnit", "seriesLabel",
  "series", "rows", "columns", "figure",
];

function nodeFrom(source) {
  const node = {
    id: source.id ?? makeId("node"),
    label: String(source.label ?? "Untitled"),
    x: Number(source.x) || 0,
    y: Number(source.y) || 0,
    w: Number(source.w) || 0,
    h: Number(source.h) || 0,
  };
  for (const field of NODE_FIELDS) if (source[field] !== undefined) node[field] = source[field];
  return node;
}

/**
 * Build a project.
 *
 * @param {string} type
 * @param {string} [title]
 * @param {{empty?: boolean}} [options] `empty` skips the starter content — used
 *   by importers, which supply their own nodes and must not inherit sample
 *   axes, lanes or groups from an unrelated type.
 */
export function createDiagram(type = "architecture", title, options = {}) {
  const meta = getType(hasType(type) ? type : "architecture");
  const sample = options.empty ? { nodes: [], edges: [] } : sampleFor(meta.id);
  const nodes = (sample.nodes ?? []).map(nodeFrom);
  const edges = (sample.edges ?? []).map((edge) => ({
    id: makeId("edge"),
    source: nodes[edge.from]?.id,
    target: nodes[edge.to]?.id,
    label: edge.label ?? "",
    dashed: Boolean(edge.dashed),
    ...(edge.kind ? { kind: edge.kind } : {}),
    ...(edge.tone ? { tone: edge.tone } : {}),
  })).filter((edge) => edge.source && edge.target);

  const diagram = {
    version: MODEL_VERSION,
    id: makeId("diagram"),
    type: meta.id,
    title: title || `${meta.label} overview`,
    description: meta.description,
    width: 0,
    height: 0,
    theme: paletteOf(DEFAULT_PALETTE),
    nodes,
    edges,
    annotations: [],
    settings: { grid: false, density: "balanced", corner: 8, autoFit: true, showTitle: false },
  };

  if (sample.groups) {
    diagram.groups = sample.groups.map((group) => ({
      id: makeId("group"),
      label: group.label,
      nodes: (group.nodes ?? []).map((index) => nodes[index]?.id).filter(Boolean),
    }));
  }
  for (const field of DIAGRAM_FIELDS) if (sample[field] !== undefined) diagram[field] = sample[field];

  return diagram;
}

const KEYWORD_TYPES = [
  [/(sequence|message flow|request.*response|oauth|handshake)/i, "sequence"],
  [/(state machine|lifecycle|status transition)/i, "state"],
  [/(entity relationship|\ber diagram\b|schema|data model|table.*column)/i, "er"],
  [/(swimlane|cross-functional|hand ?off between teams)/i, "swimlane"],
  [/(roadmap|now next later|horizon)/i, "roadmap"],
  [/(journey|touchpoint|customer experience)/i, "journey"],
  [/(timeline|milestone|chronolog)/i, "timeline"],
  [/(gantt|schedule|project plan|week \d)/i, "gantt"],
  [/(2 ?x ?2|quadrant|effort.*value|value.*effort)/i, "quadrant"],
  [/(consultant matrix|named scenario|transform.*optimi[sz]e.*retire)/i, "matrix"],
  [/(venn|overlap|intersection of)/i, "venn"],
  [/(pyramid|funnel|drop-?off)/i, "pyramid"],
  [/(org chart|reporting line|who reports)/i, "org-chart"],
  [/(taxonomy|tree of|parent and child)/i, "tree"],
  [/(radar|spider chart|capability assessment)/i, "radar"],
  [/(scatter|correlation between)/i, "scatter"],
  [/(bar chart|compare .* across|by category)/i, "bar"],
  [/(line chart|trend|over the last|growth over time)/i, "line"],
  [/(flywheel|reinforcing loop|virtuous cycle)/i, "loop"],
  [/(mind map|brainstorm|branches from)/i, "mind-map"],
  [/(network|topology|subnet|firewall)/i, "network"],
  [/(deployment|release pipeline|ci\/cd|promote to production)/i, "deployment"],
  [/(data flow|etl|ingest.*transform|pipeline)/i, "data-flow"],
  [/(medallion|bronze.*silver.*gold)/i, "medallion"],
  [/(layer|stack of abstractions|tiers of)/i, "layers"],
  [/(nested|contained within|sits inside)/i, "nested"],
  [/(current state|as-is|legacy landscape)/i, "current-state"],
  [/(executive|board|high-level overview)/i, "high-level"],
  [/(decision|if .* then|flowchart|branch)/i, "flowchart"],
  [/(process|workflow|steps to)/i, "process"],
];

/** Labels the author actually wrote: an arrow chain, or a bullet list. */
function extractLabels(prompt) {
  const arrowLine = prompt.split(/\n/).find((line) => /(?:-{1,2}>|→|=>)/.test(line));
  if (arrowLine) {
    return arrowLine
      .split(/\s*(?:-{1,2}>|→|=>)\s*/)
      .map((part) => part.replace(/^\d+[.)]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, LIMITS.budgetNodes);
  }
  const bullets = prompt
    .split(/\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((line) => line && line.length < 70);
  return bullets.length >= 3 ? bullets.slice(0, LIMITS.budgetNodes) : [];
}

/**
 * Compose a project from a prompt.
 *
 * When the prompt names its own elements they are used verbatim. When it does
 * not, the type's starter content is returned unchanged rather than the prompt
 * being padded out into fake nodes.
 */
export function createFromPrompt(prompt) {
  const source = String(prompt ?? "");
  const matched = KEYWORD_TYPES.find(([pattern]) => pattern.test(source));
  const type = matched?.[1] ?? "architecture";
  const titleMatch = source.match(/(?:titled?|called|about)\s+["“]?([^\n"”.,]{3,60})/i);
  const firstSentence = source.trim().split(/[.!?\n]/)[0]?.trim() ?? "";
  const diagram = createDiagram(type, titleMatch?.[1]?.trim() || firstSentence.slice(0, 64) || undefined);

  const labels = extractLabels(source);
  if (labels.length >= 2) {
    diagram.nodes = labels.map((label) => nodeFrom({ label }));
    diagram.nodes[Math.min(1, diagram.nodes.length - 1)].tone = "accent";
    diagram.edges = diagram.nodes.slice(0, -1).map((node, index) => ({
      id: makeId("edge"),
      source: node.id,
      target: diagram.nodes[index + 1].id,
      label: "",
      dashed: false,
    }));
    delete diagram.groups;
  }

  if (firstSentence) diagram.description = firstSentence.slice(0, 180);
  return diagram;
}

export const cloneDiagram = (diagram) => structuredClone(diagram);

/**
 * Structural validation. Returns blocking errors; use `reviewDiagram` for the
 * editorial checks that are advice rather than failure.
 */
export function validateDiagram(diagram) {
  const errors = [];
  if (!diagram || typeof diagram !== "object") return ["Diagram must be an object"];
  if (!hasType(diagram.type)) errors.push(`Unknown diagram type: ${diagram.type}`);
  if (!Array.isArray(diagram.nodes)) errors.push("nodes must be an array");
  if (!Array.isArray(diagram.edges)) errors.push("edges must be an array");
  if (!diagram.theme || typeof diagram.theme !== "object") errors.push("theme is missing");
  if (errors.length) return errors;

  if (diagram.nodes.length > LIMITS.nodes) errors.push(`too many nodes (${diagram.nodes.length} > ${LIMITS.nodes})`);
  if (diagram.edges.length > LIMITS.edges) errors.push(`too many edges (${diagram.edges.length} > ${LIMITS.edges})`);

  const ids = diagram.nodes.map((node) => node.id);
  if (new Set(ids).size !== ids.length) errors.push("node ids must be unique");
  const known = new Set(ids);
  for (const edge of diagram.edges) {
    if (!known.has(edge.source) || !known.has(edge.target)) errors.push(`edge ${edge.id} has a missing endpoint`);
  }
  return errors;
}

/**
 * The elements a reader has to hold separately.
 *
 * A cause on a fishbone bone, or a cell in a heatmap grid, is read as part of
 * the thing it sits inside — counting each one against the composition budget
 * would fail diagrams that are perfectly legible.
 */
export const primaryNodes = (diagram) =>
  (diagram.nodes ?? []).filter((node) => !node.cause && !(node.row !== undefined && node.col !== undefined));

/** Editorial review: the composition rules, reported as advice. */
export function reviewDiagram(diagram) {
  const notes = [];
  const primary = primaryNodes(diagram);
  const accents = diagram.nodes.filter((node) => node.tone === "accent").length;
  if (accents > LIMITS.accent) notes.push(`${accents} accent elements — the budget is ${LIMITS.accent}. Emphasis stops working when everything is emphasised.`);
  if (primary.length > LIMITS.budgetNodes) notes.push(`${primary.length} nodes — consider splitting into an overview and a detail diagram above ${LIMITS.budgetNodes}.`);
  if (diagram.edges.length > LIMITS.budgetEdges) notes.push(`${diagram.edges.length} connections — above ${LIMITS.budgetEdges} the reading order stops being obvious.`);
  const orphans = diagram.nodes.filter(
    (node) => !diagram.edges.some((edge) => edge.source === node.id || edge.target === node.id),
  );
  const graphFamily = ["layered", "hierarchy", "er", "sequence", "swimlane"].includes(getType(diagram.type).family);
  if (graphFamily && orphans.length) notes.push(`${orphans.length} unconnected element${orphans.length === 1 ? "" : "s"}: ${orphans.map((node) => node.label).join(", ")}`);
  const unknown = unknownIconsIn(diagram);
  if (unknown.length) {
    notes.push(
      `${unknown.length} icon name${unknown.length === 1 ? "" : "s"} this build cannot draw and will omit: ${unknown.join(", ")}. ` +
        `See UNAVAILABLE_MARKS for the concept icon to use instead of a withdrawn product mark.`,
    );
  }
  return notes;
}
