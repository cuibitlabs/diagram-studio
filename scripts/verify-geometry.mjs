/**
 * Geometry verifier.
 *
 * Renders every diagram type and checks the drawing against the rules the
 * visual system claims to enforce:
 *  1. nothing is drawn outside the canvas
 *  2. nodes in graph families do not overlap
 *  3. connectors are orthogonal and cross no node
 *  4. node geometry sits on the 4 px base grid
 *  5. no label is silently truncated at the starter size
 *
 * Exits non-zero on the first category with failures, so CI reports them all.
 */

import { DIAGRAM_TYPES, createDiagram } from "../src/model.js";
import { buildSVG, uidFor } from "../src/render/svg.js";
import { rectOf, rectsOverlap } from "../src/engine/geom.js";
import { nodeText } from "../src/render/primitives.js";
import { getRenderer } from "../src/types/index.js";

const TOLERANCE = 4;
const failures = [];
const fail = (type, rule, detail) => failures.push({ type, rule, detail });

const coords = (svg, attributes) =>
  attributes.flatMap((attribute) => [...svg.matchAll(new RegExp(`${attribute}="(-?[0-9.]+)"`, "g"))].map((match) => Number(match[1])));

for (const type of DIAGRAM_TYPES) {
  const diagram = createDiagram(type.id);
  const ctx = {
    uid: uidFor(type.id),
    theme: diagram.theme,
    settings: diagram.settings,
    corner: 8,
    dense: false,
    interactive: false,
    selectedId: null,
    margin: { top: 96, right: 96, bottom: 96, left: 96 },
  };
  const renderer = getRenderer(type.id);
  const layout = renderer.layout(diagram, ctx);
  const svg = buildSVG(diagram, { uid: ctx.uid, interactive: false });

  // 1. inside the canvas
  const xs = coords(svg, ["x", "cx"]);
  const ys = coords(svg, ["y", "cy"]);
  if (Math.min(...xs) < -TOLERANCE) fail(type.id, "canvas", `content starts at x=${Math.min(...xs)}`);
  if (Math.max(...xs) > diagram.width + TOLERANCE) fail(type.id, "canvas", `content ends at x=${Math.max(...xs)} > ${diagram.width}`);
  if (Math.min(...ys) < -TOLERANCE) fail(type.id, "canvas", `content starts at y=${Math.min(...ys)}`);
  if (Math.max(...ys) > diagram.height + TOLERANCE) fail(type.id, "canvas", `content ends at y=${Math.max(...ys)} > ${diagram.height}`);

  // 2. no overlapping nodes in the families where position means structure
  if (["layered", "hierarchy", "er", "swimlane"].includes(type.family)) {
    const rects = diagram.nodes.map(rectOf);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(rects[i], rects[j])) {
          fail(type.id, "overlap", `${diagram.nodes[i].label} / ${diagram.nodes[j].label}`);
        }
      }
    }
  }

  // 3. orthogonal, non-crossing connectors
  for (const [id, route] of layout.routes ?? []) {
    route.points.forEach((point, index) => {
      if (index === 0) return;
      const previous = route.points[index - 1];
      if (Math.abs(point.x - previous.x) > 0.01 && Math.abs(point.y - previous.y) > 0.01) {
        fail(type.id, "diagonal", `edge ${id} segment ${index}`);
      }
    });
    if (route.hits > 0) fail(type.id, "crossing", `edge ${id} passes through ${route.hits} node(s)`);
  }

  // 4. base grid
  for (const node of diagram.nodes) {
    for (const key of ["x", "y", "w", "h"]) {
      if (Math.abs(node[key] % 4) > 0.01) fail(type.id, "grid", `${node.label}.${key} = ${node[key]}`);
    }
  }

  // 5. truncation, measured through the same path the renderer draws with.
  // Checking `measureNodeBox` here instead hid a real defect: sizing and
  // drawing disagreed about shape padding, so text was clipped in the output
  // while the sizing pass reported it fitting.
  for (const node of diagram.nodes) {
    if (node.fixedSize) continue;
    const drawn = nodeText(node, { corner: ctx.corner, dense: ctx.dense });
    if (drawn.title.truncated) fail(type.id, "truncated", `${node.label} (title)`);
    if (drawn.sub?.truncated) fail(type.id, "truncated", `${node.label} (sublabel)`);
    // A single word spread over more than one line means the box was too narrow.
    if (node.label.trim().split(/\s+/).length === 1 && drawn.title.lines.length > 1) {
      fail(type.id, "hard-break", `${node.label} was split mid-word`);
    }
  }
}

if (failures.length) {
  const byRule = new Map();
  for (const failure of failures) {
    if (!byRule.has(failure.rule)) byRule.set(failure.rule, []);
    byRule.get(failure.rule).push(failure);
  }
  for (const [rule, entries] of byRule) {
    console.error(`\n${rule} (${entries.length}):`);
    for (const entry of entries) console.error(`  ${entry.type}: ${entry.detail}`);
  }
  console.error(`\nverify-geometry: ${failures.length} failures across ${byRule.size} rules`);
  process.exit(1);
}

console.log(`verify-geometry: ${DIAGRAM_TYPES.length} types pass canvas, overlap, connector, grid and truncation checks`);
