/**
 * Heatmap.
 *
 * Two categories and one measure. Intensity carries the value, so the value is
 * also printed in every cell — a reader should never have to estimate a number
 * from a shade, and the printed figure is what makes the chart survive
 * greyscale and colour-vision differences.
 *
 * A cell with no value is left empty and marked, not shaded as if it were zero.
 */

import { grid } from "../engine/layout/band.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { contrastRatio } from "../theme/contrast.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent } from "./_base.js";

const AREA = { w: 760, h: 480 };
const LABEL_W = 168;
const HEADER_H = 44;

const value = (node) => (typeof node.value === "number" && Number.isFinite(node.value) ? node.value : null);

const axisOf = (diagram, key, fallbackKey) => {
  if (Array.isArray(diagram[key]) && diagram[key].length) return diagram[key].map(String);
  const seen = [];
  for (const node of diagram.nodes) {
    const entry = node[fallbackKey];
    if (entry !== undefined && !seen.includes(String(entry))) seen.push(String(entry));
  }
  return seen;
};

export default {
  id: "heatmap",
  label: "Heatmap",
  description: "One measure across two categories, with the number in every cell",
  family: "chart",

  layout(diagram, ctx) {
    const rows = axisOf(diagram, "rows", "row");
    const columns = axisOf(diagram, "columns", "col");
    const area = { x: ctx.margin.left + LABEL_W, y: ctx.margin.top + HEADER_H, w: AREA.w, h: AREA.h };
    const cells = grid(rows.length * columns.length, area, { columns: columns.length || 1, gapX: 4, gapY: 4 });

    const values = diagram.nodes.map(value).filter((entry) => entry !== null);
    const max = values.length ? Math.max(...values) : 1;
    const min = values.length ? Math.min(...values) : 0;

    for (const node of diagram.nodes) {
      const row = rows.indexOf(String(node.row));
      const column = columns.indexOf(String(node.col));
      const cell = row >= 0 && column >= 0 ? cells[row * columns.length + column] : null;
      node.fixedSize = true;
      if (!cell) {
        node.x = roundTo(ctx.margin.left);
        node.y = roundTo(area.y + area.h + 48);
        node.w = 0;
        node.h = 0;
        continue;
      }
      node.x = cell.x;
      node.y = cell.y;
      node.w = cell.w;
      node.h = cell.h;
    }

    const extent = contentExtent(diagram, ctx, [{ x: ctx.margin.left, y: ctx.margin.top, w: LABEL_W + AREA.w, h: HEADER_H + AREA.h + 56 }]);
    return { rows, columns, area, max, min, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const { rows, columns, area, max, min } = layout;
    const theme = ctx.theme;
    const unit = diagram.unit ? ` ${diagram.unit}` : "";
    const span = max - min || 1;

    const headers = columns
      .map((label, index) => {
        const cellWidth = area.w / columns.length;
        return text(label, area.x + cellWidth * (index + 0.5), area.y - 14, TYPE.axis, { anchor: "middle", className: "axis-label" });
      })
      .join("");

    const rowLabels = rows
      .map((label, index) => {
        const cellHeight = area.h / rows.length;
        return text(label, area.x - 16, area.y + cellHeight * (index + 0.5) + 4, TYPE.nodeSub, { anchor: "end", className: "mark-label" });
      })
      .join("");

    const cells = diagram.nodes
      .filter((node) => node.w > 0)
      .map((node) => {
        const measure = value(node);
        if (measure === null) {
          return `<g class="heat-cell is-empty" data-node-id="${esc(node.id)}"><rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="3"/>${text("—", node.x + node.w / 2, node.y + node.h / 2 + 5, TYPE.meta, { anchor: "middle", className: "axis-label" })}</g>`;
        }
        const intensity = (measure - min) / span;
        // Label colour is chosen by measured contrast against the cell, not by a
        // guessed threshold, so it stays readable across every palette.
        const fill = `color-mix(in srgb, ${theme.accent} ${Math.round(12 + intensity * 78)}%, ${theme.paper})`;
        const solid = intensity > 0.55 ? theme.accent : theme.paper;
        const label = contrastRatio(theme.ink, solid) >= contrastRatio(theme.onAccent, solid) ? theme.ink : theme.onAccent;
        return `<g class="heat-cell" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.row)} / ${esc(node.col)}: ${measure}${unit}">
          <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="3" fill="${fill}"/>
          <text x="${node.x + node.w / 2}" y="${node.y + node.h / 2 + 5}" text-anchor="middle" fill="${label}" style="font-family:var(--font-mono);font-size:13px;font-weight:700">${measure}</text>
        </g>`;
      })
      .join("");

    const scale = `${text(`${min}${unit}`, area.x, area.y + area.h + 30, TYPE.meta, { className: "axis-label" })}${text(`${max}${unit}`, area.x + area.w, area.y + area.h + 30, TYPE.meta, { anchor: "end", className: "axis-label" })}`;

    return `${headers}${rowLabels}${cells}${scale}`;
  },

  sample: () => ({
    nodes: [
      { label: "Checkout / p50", row: "Checkout", col: "p50", value: 120 },
      { label: "Checkout / p95", row: "Checkout", col: "p95", value: 480 },
      { label: "Checkout / p99", row: "Checkout", col: "p99", value: 1400, tone: "accent" },
      { label: "Search / p50", row: "Search", col: "p50", value: 80 },
      { label: "Search / p95", row: "Search", col: "p95", value: 210 },
      { label: "Search / p99", row: "Search", col: "p99", value: 640 },
      { label: "Account / p50", row: "Account", col: "p50", value: 60 },
      { label: "Account / p95", row: "Account", col: "p95", value: 150 },
      { label: "Account / p99", row: "Account", col: "p99", value: 320 },
    ],
    edges: [],
    rows: ["Checkout", "Search", "Account"],
    columns: ["p50", "p95", "p99"],
    unit: "ms",
  }),
};
