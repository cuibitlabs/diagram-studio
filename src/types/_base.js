/**
 * Shared machinery for type renderers.
 *
 * A type module is `{ id, label, family, description, sample, layout, draw }`.
 * `layout` mutates node geometry and returns the drawing extent plus anything
 * `draw` needs; `draw` returns SVG markup for the content group only.
 */

import { BOX, measureNodeBox } from "../engine/box.js";
import { boundsOf, rectOf } from "../engine/geom.js";
import { routeEdges } from "../engine/router.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { connector, container, nodeCard, shapeOf } from "../render/primitives.js";
import { shapePadding } from "../render/shapes.js";

export const GROUP_PAD = { x: 28, y: 44 };

/** Shape-aware node sizing. Runs before any layout algorithm. */
export function sizeAll(nodes, ctx, config = {}) {
  for (const node of nodes) {
    if (node.fixedSize) continue;
    const shape = shapeOf(node, config.defaultShape);
    const pad = shapePadding(shape);
    const box = measureNodeBox(node, {
      padX: BOX.padX + pad.x / 2,
      padY: BOX.padY + pad.y / 2,
      minW: config.minW ?? (shape === "diamond" ? 192 : BOX.minW),
      maxW: config.maxW ?? BOX.maxW,
      minH: config.minH ?? (shape === "diamond" ? 112 : BOX.minH),
      dense: ctx.dense,
      titleStyle: config.titleStyle,
      subStyle: config.subStyle,
      maxTitleLines: config.maxTitleLines,
      maxSubLines: config.maxSubLines,
    });
    node.w = box.w;
    node.h = box.h;
  }
}

/** Route every edge with the type's router preferences. */
export function routeAll(diagram, config = {}) {
  return routeEdges(diagram.edges ?? [], diagram.nodes ?? [], config.router ?? {});
}

/** Bounding rects for declared groups, expanded to fit their members. */
export function groupRects(diagram) {
  const groups = diagram.groups ?? [];
  if (!groups.length) return [];
  const byId = new Map(diagram.nodes.map((node) => [node.id, node]));
  return groups
    .map((group) => {
      const members = (group.nodes ?? []).map((id) => byId.get(id)).filter(Boolean).map(rectOf);
      if (!members.length) return null;
      const bounds = boundsOf(members, 0);
      return {
        ...group,
        x: roundTo(bounds.x - GROUP_PAD.x),
        y: roundTo(bounds.y - GROUP_PAD.y),
        w: roundTo(bounds.w + GROUP_PAD.x * 2),
        h: roundTo(bounds.h + GROUP_PAD.y + GROUP_PAD.x),
      };
    })
    .filter(Boolean);
}

export const drawGroups = (groups = [], options = {}) =>
  groups.map((group) => container(group, group.label, { className: group.filled ? "lane is-filled" : "lane", id: group.id, ...options })).join("");

export const drawEdges = (diagram, ctx, routes, spec = {}) =>
  (diagram.edges ?? [])
    .map((edge) => connector(edge, routes.get(edge.id), { uid: ctx.uid, selectedId: ctx.selectedId, steps: ctx.steps, ...spec }))
    .join("");

export const drawNodes = (diagram, ctx, spec = {}) =>
  (diagram.nodes ?? []).map((node) => nodeCard(node, {
    uid: ctx.uid,
    corner: ctx.corner,
    dense: ctx.dense,
    selectedId: ctx.selectedId,
    selectedIds: ctx.selectedIds,
    steps: ctx.steps,
    interactive: ctx.interactive,
    ...spec,
  })).join("");

/**
 * Extent of everything drawn, measured from the margin origin so the shell can
 * add its own margins without double counting them.
 */
export function contentExtent(diagram, ctx, extras = []) {
  const rects = [
    ...diagram.nodes.map(rectOf),
    ...extras.map((item) => ({ ...item, x2: item.x + item.w, y2: item.y + item.h })),
  ];
  if (!rects.length) return { width: 0, height: 0 };
  const bounds = boundsOf(rects, 0);
  return {
    width: Math.max(0, bounds.x2 - ctx.margin.left),
    height: Math.max(0, bounds.y2 - ctx.margin.top),
    bounds,
  };
}

/**
 * Shift every node so the drawing starts at the margin origin.
 * Layout algorithms that place content around a centre use this to normalise.
 */
export function normaliseTo(diagram, origin, extras = []) {
  const rects = [...diagram.nodes.map(rectOf), ...extras];
  if (!rects.length) return { dx: 0, dy: 0 };
  const bounds = boundsOf(rects, 0);
  const dx = roundTo(origin.x - bounds.x);
  const dy = roundTo(origin.y - bounds.y);
  for (const node of diagram.nodes) {
    node.x = roundTo(node.x + dx);
    node.y = roundTo(node.y + dy);
  }
  return { dx, dy };
}

/** Nodes carrying the accent, capped at the two-element budget. */
export function accentIds(diagram, limit = 2) {
  return diagram.nodes.filter((node) => node.tone === "accent").slice(0, limit).map((node) => node.id);
}

/** Numeric value for chart-like types; absent values are treated as absent, not zero. */
export const valueOf = (node) => (typeof node.value === "number" && Number.isFinite(node.value) ? node.value : null);

export const SECTION_STYLE = TYPE.section;
