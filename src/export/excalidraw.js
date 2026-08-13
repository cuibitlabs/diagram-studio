/**
 * Excalidraw export.
 *
 * Excalidraw is where a diagram goes to be argued about in a workshop. Writing
 * its scene format directly means the boxes are real Excalidraw elements people
 * can drag, not an imported image they have to redraw first.
 */

import { buildSVG } from "../render/svg.js";
import { rectOf } from "../engine/geom.js";
import { routeEdges } from "../engine/router.js";
import { shapeOf } from "../render/primitives.js";

const VERSION = 2;
const SOURCE = "diagram-studio";

/** Deterministic ids: Excalidraw only needs them unique within the scene. */
const idFor = (prefix, index) => `${prefix}-${index.toString(36).padStart(4, "0")}`;

const SHAPE_MAP = {
  diamond: "diamond",
  circle: "ellipse",
  event: "ellipse",
  stadium: "rectangle",
  cylinder: "rectangle",
};

const base = (id, index) => ({
  id,
  seed: 1000 + index,
  version: 1,
  versionNonce: 1,
  isDeleted: false,
  groupIds: [],
  frameId: null,
  boundElements: [],
  updated: 1,
  link: null,
  locked: false,
  angle: 0,
  opacity: 100,
  roughness: 1,
  strokeWidth: 1,
  strokeStyle: "solid",
  fillStyle: "solid",
});

/**
 * @param {object} diagram
 * @returns {object} an Excalidraw scene, ready to write as `.excalidraw`
 */
export function toExcalidraw(diagram) {
  buildSVG(diagram, { interactive: false, uid: "excalidraw" });
  const theme = diagram.theme;
  const elements = [];
  const elementIds = new Map();

  diagram.nodes.forEach((node, index) => {
    const rect = rectOf(node);
    const id = idFor("node", index);
    elementIds.set(node.id, id);
    const accent = node.tone === "accent";
    const shape = shapeOf(node);

    elements.push({
      ...base(id, index),
      type: SHAPE_MAP[shape] ?? "rectangle",
      x: rect.x,
      y: rect.y,
      width: rect.w,
      height: rect.h,
      strokeColor: accent ? theme.accent : theme.line,
      backgroundColor: accent ? theme.accent : theme.panel,
      strokeStyle: node.dashed || node.role === "external" ? "dashed" : "solid",
      roundness: shape === "diamond" ? null : { type: 3 },
    });

    const label = node.sublabel ? `${node.label}\n${node.sublabel}` : node.label;
    elements.push({
      ...base(idFor("label", index), index),
      type: "text",
      x: rect.x + 16,
      y: rect.y + 16,
      width: Math.max(16, rect.w - 32),
      height: Math.max(16, rect.h - 32),
      text: label,
      originalText: label,
      fontSize: 16,
      fontFamily: 2,
      textAlign: "left",
      verticalAlign: "top",
      lineHeight: 1.25,
      containerId: id,
      strokeColor: accent ? theme.onAccent : theme.ink,
      backgroundColor: "transparent",
    });
  });

  const routes = routeEdges(diagram.edges ?? [], diagram.nodes, {});
  (diagram.edges ?? []).forEach((edge, index) => {
    const route = routes.get(edge.id);
    if (!route) return;
    const origin = route.points[0];
    elements.push({
      ...base(idFor("edge", index), index),
      type: "arrow",
      x: origin.x,
      y: origin.y,
      width: Math.abs(route.points.at(-1).x - origin.x),
      height: Math.abs(route.points.at(-1).y - origin.y),
      // Excalidraw points are relative to the element origin.
      points: route.points.map((point) => [point.x - origin.x, point.y - origin.y]),
      strokeColor: edge.tone === "accent" ? theme.accent : theme.lineStrong,
      backgroundColor: "transparent",
      strokeStyle: edge.dashed ? "dashed" : "solid",
      startArrowhead: edge.bidirectional ? "arrow" : null,
      endArrowhead: "arrow",
      elbowed: true,
      startBinding: elementIds.has(edge.source) ? { elementId: elementIds.get(edge.source), focus: 0, gap: 4 } : null,
      endBinding: elementIds.has(edge.target) ? { elementId: elementIds.get(edge.target), focus: 0, gap: 4 } : null,
    });
  });

  return {
    type: "excalidraw",
    version: VERSION,
    source: SOURCE,
    elements,
    appState: {
      viewBackgroundColor: theme.paper,
      gridSize: 4,
    },
    files: {},
  };
}

export const toExcalidrawJSON = (diagram) => `${JSON.stringify(toExcalidraw(diagram), null, 2)}\n`;
