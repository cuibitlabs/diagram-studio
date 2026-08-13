/**
 * Band, grid and axis helpers for the non-graph structures:
 * layers, medallion, pyramid, swimlane, roadmap, timeline, gantt, matrices.
 *
 * These return rects rather than mutating nodes, because band structures often
 * need the band itself (a lane background) as well as the boxes inside it.
 */

import { floorTo, roundTo } from "../text.js";

/**
 * Split an area into `count` bands along one axis.
 *
 * @param {number} count
 * @param {{x:number,y:number,w:number,h:number}} area
 * @param {{axis?: "x"|"y", gap?: number, weights?: number[]}} [options]
 * @returns {Array<{x:number,y:number,w:number,h:number,index:number}>}
 */
export function bands(count, area, options = {}) {
  const { axis = "y", gap = 16, weights } = options;
  if (count <= 0) return [];
  const along = axis === "y" ? area.h : area.w;
  const usable = along - gap * (count - 1);
  const shares = weights?.length === count ? weights : new Array(count).fill(1);
  const total = shares.reduce((sum, value) => sum + value, 0) || count;

  const out = [];
  let cursor = axis === "y" ? area.y : area.x;
  for (let index = 0; index < count; index++) {
    // Floor rather than round: a band must never spill outside its area.
    const size = floorTo((usable * shares[index]) / total);
    out.push(
      axis === "y"
        ? { x: roundTo(area.x), y: roundTo(cursor), w: roundTo(area.w), h: size, index }
        : { x: roundTo(cursor), y: roundTo(area.y), w: size, h: roundTo(area.h), index },
    );
    cursor += size + gap;
  }
  return out;
}

/** Regular grid of cells inside an area. */
export function grid(count, area, options = {}) {
  const { columns = Math.ceil(Math.sqrt(count)), gapX = 24, gapY = 24 } = options;
  if (count <= 0) return [];
  const rows = Math.ceil(count / columns);
  const cellW = floorTo((area.w - gapX * (columns - 1)) / columns);
  const cellH = floorTo((area.h - gapY * (rows - 1)) / rows);
  const out = [];
  for (let index = 0; index < count; index++) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    out.push({
      x: roundTo(area.x + column * (cellW + gapX)),
      y: roundTo(area.y + row * (cellH + gapY)),
      w: cellW,
      h: cellH,
      index,
      row,
      column,
    });
  }
  return out;
}

/**
 * Evenly spaced positions along an axis, used for timelines, roadmaps and
 * category axes. Returns the centre of each slot.
 */
export function ticks(count, from, to) {
  if (count <= 0) return [];
  if (count === 1) return [(from + to) / 2];
  const step = (to - from) / (count - 1);
  return Array.from({ length: count }, (_, index) => from + step * index);
}

/** Slot centres for banded categories (bar charts, swimlane columns). */
export function slots(count, from, to) {
  if (count <= 0) return [];
  const width = (to - from) / count;
  return Array.from({ length: count }, (_, index) => from + width * (index + 0.5));
}

/**
 * Place items alternately above and below an axis, keeping a stem clear.
 *
 * @returns {Array<{x:number,y:number,above:boolean}>} top-left corners
 */
export function alternating(items, axisY, xs, stem = 56) {
  return items.map((item, index) => {
    const above = index % 2 === 0;
    return {
      x: roundTo(xs[index] - item.w / 2),
      y: roundTo(above ? axisY - stem - item.h : axisY + stem),
      above,
    };
  });
}

/**
 * Nice axis maximum for a value scale: 1, 2, 2.5 or 5 times a power of ten.
 * Charts must never invent a scale that hides data.
 */
export function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Evenly divided tick values from 0 to max. */
export function axisTicks(max, divisions = 4) {
  const top = niceMax(max);
  return Array.from({ length: divisions + 1 }, (_, index) => (top / divisions) * index);
}
