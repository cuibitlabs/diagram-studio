/**
 * Terminal rendering.
 *
 * A real character-grid drawing, not a styled SVG: box-drawing glyphs, routed
 * connectors and arrowheads, so a diagram can land in a README, a commit
 * message or a terminal where SVG is useless.
 *
 * The layout comes from the same engine, so the ASCII view is the same diagram
 * at a coarser resolution rather than a different one.
 */

import { buildSVG } from "../render/svg.js";
import { routeEdges } from "../engine/router.js";
import { boundsOf, rectOf } from "../engine/geom.js";

const CELL = { w: 9, h: 20 };

const GLYPH = {
  horizontal: "─",
  vertical: "│",
  cross: "┼",
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  arrowRight: "▶",
  arrowLeft: "◀",
  arrowUp: "▲",
  arrowDown: "▼",
};

const LINE_GLYPHS = new Set([GLYPH.horizontal, GLYPH.vertical, GLYPH.cross]);

class Grid {
  constructor(columns, rows) {
    this.columns = columns;
    this.rows = rows;
    this.cells = Array.from({ length: rows }, () => new Array(columns).fill(" "));
  }

  set(x, y, glyph, { overwrite = true } = {}) {
    if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) return;
    const current = this.cells[y][x];
    if (!overwrite && current !== " ") return;
    // Crossing lines become a junction rather than one silently winning.
    if (LINE_GLYPHS.has(current) && LINE_GLYPHS.has(glyph) && current !== glyph) {
      this.cells[y][x] = GLYPH.cross;
      return;
    }
    this.cells[y][x] = glyph;
  }

  write(x, y, value, options) {
    [...String(value)].forEach((char, index) => this.set(x + index, y, char, options));
  }

  toString() {
    return this.cells.map((row) => row.join("").replace(/\s+$/, "")).join("\n");
  }
}

const toChar = (value, size, origin) => Math.round((value - origin) / size);

/**
 * Pick a cell size that fits the drawing into the available columns.
 * Clipping would silently drop nodes, which is exactly the failure mode this
 * whole project exists to avoid.
 */
const cellFor = (span, maxCells, minimum) => Math.max(minimum, span / Math.max(1, maxCells - 3));

function drawBox(grid, rect, node, maxWidth) {
  const x1 = rect.x;
  const y1 = rect.y;
  const x2 = Math.max(x1 + 2, rect.x2);
  const y2 = Math.max(y1 + 2, rect.y2);

  for (let x = x1 + 1; x < x2; x++) {
    grid.set(x, y1, GLYPH.horizontal);
    grid.set(x, y2, GLYPH.horizontal);
  }
  for (let y = y1 + 1; y < y2; y++) {
    grid.set(x1, y, GLYPH.vertical);
    grid.set(x2, y, GLYPH.vertical);
  }
  grid.set(x1, y1, GLYPH.topLeft);
  grid.set(x2, y1, GLYPH.topRight);
  grid.set(x1, y2, GLYPH.bottomLeft);
  grid.set(x2, y2, GLYPH.bottomRight);

  const inner = Math.max(1, x2 - x1 - 3);
  const label = node.label.length > inner ? `${node.label.slice(0, Math.max(1, inner - 1))}…` : node.label;
  const marker = node.tone === "accent" ? "*" : " ";
  grid.write(x1 + 2, y1 + 1, `${marker}${label}`.slice(0, inner));

  if (node.sublabel && y2 - y1 > 2) {
    const sub = node.sublabel.length > inner ? `${node.sublabel.slice(0, Math.max(1, inner - 1))}…` : node.sublabel;
    grid.write(x1 + 2, y1 + 2, sub.slice(0, inner));
  }
  return maxWidth;
}

function drawRoute(grid, points, origin, blocked, cell) {
  const chars = points.map((point) => ({
    x: toChar(point.x, cell.w, origin.x),
    y: toChar(point.y, cell.h, origin.y),
  }));

  // Connectors stop at the box they touch. At character resolution a vector
  // endpoint that sits exactly on a border would otherwise punch a hole in it.
  for (let i = 0; i < chars.length - 1; i++) {
    const from = chars[i];
    const to = chars[i + 1];
    if (from.y === to.y) {
      const step = Math.sign(to.x - from.x) || 1;
      for (let x = from.x; x !== to.x; x += step) {
        if (!blocked(x, from.y)) grid.set(x, from.y, GLYPH.horizontal, { overwrite: false });
      }
    } else if (from.x === to.x) {
      const step = Math.sign(to.y - from.y) || 1;
      for (let y = from.y; y !== to.y; y += step) {
        if (!blocked(from.x, y)) grid.set(from.x, y, GLYPH.vertical, { overwrite: false });
      }
    }
  }

  const last = chars.at(-1);
  const previous = chars.at(-2) ?? last;
  const dx = Math.sign(last.x - previous.x);
  const dy = Math.sign(last.y - previous.y);
  const arrow = dx > 0 ? GLYPH.arrowRight : dx < 0 ? GLYPH.arrowLeft : dy > 0 ? GLYPH.arrowDown : GLYPH.arrowUp;

  // Walk back out of the target box so the head sits beside it, not inside it.
  let head = { ...last };
  let guard = 0;
  while (blocked(head.x, head.y) && guard++ < 40 && (dx || dy)) {
    head = { x: head.x - dx, y: head.y - dy };
  }
  if (!blocked(head.x, head.y)) grid.set(head.x, head.y, arrow);
}

/**
 * @param {object} diagram
 * @param {{width?: number}} [options] maximum character width (default 100)
 * @returns {string}
 */
export function toASCII(diagram, options = {}) {
  // Lay the diagram out with the real engine first.
  buildSVG(diagram, { interactive: false, uid: "ascii" });
  if (!diagram.nodes.length) return "(empty diagram)";

  const bounds = boundsOf(diagram.nodes.map(rectOf), 8);
  const maxColumns = options.width ?? 120;
  const cell = {
    w: cellFor(bounds.w, maxColumns, CELL.w),
    h: cellFor(bounds.h, options.height ?? 60, CELL.h),
  };
  const columns = Math.max(20, Math.ceil(bounds.w / cell.w) + 3);
  const rows = Math.max(6, Math.ceil(bounds.h / cell.h) + 2);
  const grid = new Grid(columns, rows);

  const boxes = diagram.nodes.map((node) => {
    const rect = rectOf(node);
    return {
      node,
      x: toChar(rect.x, cell.w, bounds.x),
      y: toChar(rect.y, cell.h, bounds.y),
      x2: toChar(rect.x2, cell.w, bounds.x),
      y2: toChar(rect.y2, cell.h, bounds.y),
    };
  });
  const blocked = (x, y) => boxes.some((box) => x >= box.x && x <= box.x2 && y >= box.y && y <= box.y2);

  const routes = routeEdges(diagram.edges ?? [], diagram.nodes, {});
  for (const [, route] of routes) drawRoute(grid, route.points, bounds, blocked, cell);
  for (const box of boxes) drawBox(grid, box, box.node, columns);

  const header = [diagram.title, diagram.description].filter(Boolean).join(" — ");
  const legend = diagram.nodes.some((node) => node.tone === "accent") ? "\n\n* marks the focal element" : "";
  const labelled = (diagram.edges ?? []).filter((edge) => String(edge.label ?? "").trim());
  const key = labelled.length
    ? `\n\n${labelled
        .map((edge) => {
          const source = diagram.nodes.find((node) => node.id === edge.source)?.label ?? "?";
          const target = diagram.nodes.find((node) => node.id === edge.target)?.label ?? "?";
          return `  ${source} → ${target}: ${edge.label}`;
        })
        .join("\n")}`
    : "";

  return `${header}\n${"─".repeat(Math.min(columns, header.length))}\n\n${grid}${legend}${key}\n`;
}
