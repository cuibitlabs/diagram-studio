/**
 * Tidy tree layout for hierarchies: tree, org chart, mind map spines.
 *
 * Children are placed first, parents are centred over their children, and each
 * depth is then packed so siblings from different branches cannot collide.
 */

import { roundTo } from "../text.js";
import { buildGraph, packCentres } from "./graph.js";

export const TREE_DEFAULTS = {
  direction: "TB",
  levelGap: 88,
  siblingGap: 32,
  subtreeGap: 48,
  origin: { x: 96, y: 96 },
};

/** Parent→children map plus the detected roots, in stable model order. */
export function forestOf(nodes, edges) {
  const { out, inn } = buildGraph(nodes, edges);
  const children = new Map(nodes.map((node) => [node.id, []]));
  const claimed = new Set();
  for (const node of nodes) {
    for (const child of out.get(node.id) ?? []) {
      // A node keeps only its first parent, so a DAG still draws as a tree.
      if (claimed.has(child)) continue;
      claimed.add(child);
      children.get(node.id).push(child);
    }
  }
  const roots = nodes.filter((node) => !claimed.has(node.id) && (inn.get(node.id) ?? []).length === 0).map((node) => node.id);
  if (!roots.length && nodes.length) roots.push(nodes[0].id);
  // Any node not reachable from a root becomes its own root.
  const reachable = new Set();
  const walk = (id) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    for (const child of children.get(id) ?? []) walk(child);
  };
  roots.forEach(walk);
  for (const node of nodes) if (!reachable.has(node.id)) { roots.push(node.id); walk(node.id); }
  return { children, roots };
}

export function treeLayout(nodes, edges, overrides = {}) {
  const options = { ...TREE_DEFAULTS, ...overrides };
  if (!nodes.length) return { width: 0, height: 0, depth: 0 };

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const { children, roots } = forestOf(nodes, edges);
  const vertical = options.direction === "TB" || options.direction === "BT";
  const crossSize = (node) => (vertical ? node.w : node.h);
  const mainSize = (node) => (vertical ? node.h : node.w);

  const depth = new Map();
  const centre = new Map();
  let cursor = 0;

  const place = (id, level) => {
    depth.set(id, level);
    const kids = children.get(id) ?? [];
    if (!kids.length) {
      const size = crossSize(byId.get(id));
      centre.set(id, cursor + size / 2);
      cursor += size + options.siblingGap;
      return;
    }
    kids.forEach((child) => place(child, level + 1));
    const first = centre.get(kids[0]);
    const last = centre.get(kids[kids.length - 1]);
    centre.set(id, (first + last) / 2);
  };

  roots.forEach((root, index) => {
    if (index > 0) cursor += options.subtreeGap - options.siblingGap;
    place(root, 0);
  });

  // Pack each depth so branches that grew independently cannot overlap.
  const levels = [];
  for (const [id, level] of depth) (levels[level] ??= []).push(id);
  levels.forEach((ids, level) => {
    ids.sort((a, b) => centre.get(a) - centre.get(b));
    const halves = ids.map((id) => crossSize(byId.get(id)) / 2);
    const packed = packCentres(ids.map((id) => centre.get(id)), halves, options.siblingGap);
    ids.forEach((id, index) => centre.set(id, packed[index]));
    levels[level] = ids;
  });

  // One upward pass so parents stay centred after packing, then re-pack.
  for (let level = levels.length - 2; level >= 0; level--) {
    for (const id of levels[level] ?? []) {
      const kids = children.get(id) ?? [];
      if (kids.length) centre.set(id, (centre.get(kids[0]) + centre.get(kids[kids.length - 1])) / 2);
    }
    const ids = [...(levels[level] ?? [])].sort((a, b) => centre.get(a) - centre.get(b));
    const halves = ids.map((id) => crossSize(byId.get(id)) / 2);
    const packed = packCentres(ids.map((id) => centre.get(id)), halves, options.siblingGap);
    ids.forEach((id, index) => centre.set(id, packed[index]));
    levels[level] = ids;
  }

  const levelStart = [];
  let mainCursor = 0;
  levels.forEach((ids, level) => {
    const band = Math.max(0, ...(ids ?? []).map((id) => mainSize(byId.get(id))));
    levelStart[level] = { start: mainCursor, band };
    mainCursor += band + options.levelGap;
  });

  let minCross = Infinity;
  for (const node of nodes) minCross = Math.min(minCross, centre.get(node.id) - crossSize(node) / 2);
  if (!Number.isFinite(minCross)) minCross = 0;

  let maxCross = 0;
  for (const node of nodes) {
    const level = depth.get(node.id) ?? 0;
    const band = levelStart[level];
    const cross = centre.get(node.id) - minCross;
    const main = band.start + (band.band - mainSize(node)) / 2;
    if (vertical) {
      node.x = roundTo(options.origin.x + cross - node.w / 2);
      node.y = roundTo(options.origin.y + main);
    } else {
      node.x = roundTo(options.origin.x + main);
      node.y = roundTo(options.origin.y + cross - node.h / 2);
    }
    maxCross = Math.max(maxCross, cross + crossSize(node) / 2);
  }

  const mainExtent = mainCursor - options.levelGap;
  return {
    width: vertical ? maxCross : mainExtent,
    height: vertical ? mainExtent : maxCross,
    depth: levels.length,
    levels,
    children,
    roots,
  };
}
