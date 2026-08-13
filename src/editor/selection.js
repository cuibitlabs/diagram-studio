/**
 * Selection maths.
 *
 * Pure functions so alignment and distribution can be tested without a DOM.
 * Every operation returns the moves it would make rather than mutating, which
 * keeps undo to a single snapshot per gesture.
 */

import { boundsOf, rectOf, rectsOverlap } from "../engine/geom.js";
import { roundTo } from "../engine/text.js";

export const ALIGNMENTS = ["left", "centre-x", "right", "top", "centre-y", "bottom"];
export const DISTRIBUTIONS = ["horizontal", "vertical"];

/** Nodes whose box intersects the marquee rect. */
export function nodesInMarquee(nodes, marquee) {
  const box = {
    x: Math.min(marquee.x1, marquee.x2),
    y: Math.min(marquee.y1, marquee.y2),
    x2: Math.max(marquee.x1, marquee.x2),
    y2: Math.max(marquee.y1, marquee.y2),
  };
  box.w = box.x2 - box.x;
  box.h = box.y2 - box.y;
  return nodes.filter((node) => rectsOverlap(rectOf(node), box)).map((node) => node.id);
}

/**
 * Align a set of nodes.
 *
 * @returns {Array<{id:string,x:number,y:number}>} the new positions
 */
export function align(nodes, mode) {
  if (nodes.length < 2) return [];
  const rects = nodes.map(rectOf);
  const bounds = boundsOf(rects, 0);

  return nodes.map((node, index) => {
    const rect = rects[index];
    let { x, y } = node;
    switch (mode) {
      case "left": x = bounds.x; break;
      case "right": x = bounds.x2 - rect.w; break;
      case "centre-x": x = bounds.cx - rect.w / 2; break;
      case "top": y = bounds.y; break;
      case "bottom": y = bounds.y2 - rect.h; break;
      case "centre-y": y = bounds.cy - rect.h / 2; break;
      default: break;
    }
    // Deliberately not grid-snapped: the target edge came from a real node, and
    // re-rounding it would leave the nodes almost-but-not-quite aligned.
    return { id: node.id, x, y };
  });
}

/**
 * Even spacing between the first and last node along one axis.
 * Gaps are equalised, not centres, so boxes of different sizes read as evenly
 * spaced rather than evenly stepped.
 */
export function distribute(nodes, axis) {
  if (nodes.length < 3) return [];
  const horizontal = axis === "horizontal";
  const sorted = [...nodes].sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
  const first = sorted[0];
  const last = sorted.at(-1);
  const span = horizontal ? last.x + last.w - first.x : last.y + last.h - first.y;
  const used = sorted.reduce((sum, node) => sum + (horizontal ? node.w : node.h), 0);
  const gap = (span - used) / (sorted.length - 1);

  let cursor = horizontal ? first.x : first.y;
  return sorted.map((node) => {
    const position = { id: node.id, x: node.x, y: node.y };
    if (horizontal) position.x = roundTo(cursor);
    else position.y = roundTo(cursor);
    cursor += (horizontal ? node.w : node.h) + gap;
    return position;
  });
}

/** Move every node in a selection by the same delta, snapped to the grid. */
export const translate = (nodes, dx, dy, step = 4) =>
  nodes.map((node) => ({ id: node.id, x: roundTo(node.x + dx, step), y: roundTo(node.y + dy, step) }));

/**
 * Duplicate nodes and the edges that run wholly inside the selection.
 *
 * @param {Array} nodes selected nodes
 * @param {Array} edges all edges
 * @param {() => string} makeId
 * @returns {{nodes: Array, edges: Array}} new model objects, offset for clarity
 */
export function duplicate(nodes, edges, makeId, offset = 24) {
  const idMap = new Map();
  const copies = nodes.map((node) => {
    const id = makeId("node");
    idMap.set(node.id, id);
    return { ...structuredClone(node), id, x: roundTo(node.x + offset), y: roundTo(node.y + offset) };
  });
  const copiedEdges = edges
    .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
    .map((edge) => ({ ...structuredClone(edge), id: makeId("edge"), source: idMap.get(edge.source), target: idMap.get(edge.target) }));
  return { nodes: copies, edges: copiedEdges };
}

/** Bounding box of a selection, for the marching-ants rectangle. */
export const selectionBounds = (nodes) => (nodes.length ? boundsOf(nodes.map(rectOf), 8) : null);
