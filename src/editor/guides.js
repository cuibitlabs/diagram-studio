/**
 * Alignment guides.
 *
 * While a node is dragged, its edges and centres are compared with every other
 * node's. Within the snap threshold the position is corrected and a guide line
 * is reported so the correction is visible rather than mysterious.
 */

import { rectOf } from "../engine/geom.js";

export const SNAP = { threshold: 6, grid: 4 };

const EDGES_X = [
  { key: "left", value: (r) => r.x },
  { key: "centre", value: (r) => r.cx },
  { key: "right", value: (r) => r.x2 },
];
const EDGES_Y = [
  { key: "top", value: (r) => r.y },
  { key: "middle", value: (r) => r.cy },
  { key: "bottom", value: (r) => r.y2 },
];

/**
 * @param {{x:number,y:number,w:number,h:number}} moving  proposed position
 * @param {Array} others  every other node
 * @param {{threshold?:number}} [options]
 * @returns {{x:number, y:number, guides: Array<{axis:"x"|"y", at:number, from:number, to:number}>}}
 */
export function snapToNeighbours(moving, others, options = {}) {
  const threshold = options.threshold ?? SNAP.threshold;
  const rect = rectOf(moving);
  const targets = others.map(rectOf);
  const guides = [];

  let bestX = null;
  for (const source of EDGES_X) {
    const value = source.value(rect);
    for (const target of targets) {
      for (const candidate of EDGES_X) {
        const at = candidate.value(target);
        const delta = at - value;
        if (Math.abs(delta) > threshold) continue;
        if (!bestX || Math.abs(delta) < Math.abs(bestX.delta)) bestX = { delta, at, target };
      }
    }
  }

  let bestY = null;
  for (const source of EDGES_Y) {
    const value = source.value(rect);
    for (const target of targets) {
      for (const candidate of EDGES_Y) {
        const at = candidate.value(target);
        const delta = at - value;
        if (Math.abs(delta) > threshold) continue;
        if (!bestY || Math.abs(delta) < Math.abs(bestY.delta)) bestY = { delta, at, target };
      }
    }
  }

  const x = bestX ? moving.x + bestX.delta : moving.x;
  const y = bestY ? moving.y + bestY.delta : moving.y;

  if (bestX) {
    guides.push({
      axis: "x",
      at: bestX.at,
      from: Math.min(y, bestX.target.y) - 16,
      to: Math.max(y + rect.h, bestX.target.y2) + 16,
    });
  }
  if (bestY) {
    guides.push({
      axis: "y",
      at: bestY.at,
      from: Math.min(x, bestX ? bestX.target.x : bestY.target.x) - 16,
      to: Math.max(x + rect.w, bestY.target.x2) + 16,
    });
  }

  return { x, y, guides };
}

/** SVG overlay for the active guides. */
export const guideMarkup = (guides) =>
  guides
    .map((guide) =>
      guide.axis === "x"
        ? `<path class="snap-guide" d="M ${guide.at} ${guide.from} V ${guide.to}"/>`
        : `<path class="snap-guide" d="M ${guide.from} ${guide.at} H ${guide.to}"/>`,
    )
    .join("");
