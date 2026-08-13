/**
 * Treemap.
 *
 * Area is the value. Squarified so the tiles stay close to square, because a
 * long thin sliver is impossible to compare against anything and impossible to
 * label. Items without a value are listed under the map rather than given a
 * token tile — a tile implies a size.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { layoutParagraph } from "../engine/text.js";
import { contentExtent } from "./_base.js";

const AREA = { w: 880, h: 560 };
const GAP = 4;

const value = (node) => (typeof node.value === "number" && Number.isFinite(node.value) && node.value > 0 ? node.value : null);

const worst = (row, length, scale) => {
  const sum = row.reduce((total, item) => total + item, 0) * scale;
  const max = Math.max(...row) * scale;
  const min = Math.min(...row) * scale;
  return Math.max((length * length * max) / (sum * sum), (sum * sum) / (length * length * min));
};

/** Squarified treemap (Bruls, Huizing, van Wijk). */
function squarify(values, rect) {
  const tiles = [];
  const total = values.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return tiles;

  let area = { ...rect };
  const scaleFor = (box) => (box.w * box.h) / values.reduce((sum, item) => sum + item.value, 0);
  let scale = scaleFor(area);
  let remaining = [...values];
  let row = [];

  const layRow = () => {
    const horizontal = area.w >= area.h;
    const length = horizontal ? area.h : area.w;
    const rowSum = row.reduce((sum, item) => sum + item.value, 0) * scale;
    const thickness = rowSum / length;
    let offset = 0;
    for (const item of row) {
      const share = (item.value * scale) / thickness;
      tiles.push(
        horizontal
          ? { item, x: area.x, y: area.y + offset, w: thickness, h: share }
          : { item, x: area.x + offset, y: area.y, w: share, h: thickness },
      );
      offset += share;
    }
    if (horizontal) {
      area = { x: area.x + thickness, y: area.y, w: area.w - thickness, h: area.h };
    } else {
      area = { x: area.x, y: area.y + thickness, w: area.w, h: area.h - thickness };
    }
    row = [];
  };

  while (remaining.length) {
    const next = remaining[0];
    const length = Math.min(area.w, area.h);
    const current = row.map((item) => item.value);
    const candidate = [...current, next.value];
    if (!row.length || worst(candidate, length, scale) <= worst(current, length, scale)) {
      row.push(next);
      remaining = remaining.slice(1);
    } else {
      layRow();
      scale = area.w * area.h > 0 ? (area.w * area.h) / remaining.reduce((sum, item) => sum + item.value, 0) : scale;
    }
  }
  if (row.length) layRow();
  return tiles;
}

export default {
  id: "treemap",
  label: "Treemap",
  description: "Share of a whole, drawn as area",
  family: "chart",

  layout(diagram, ctx) {
    const sized = diagram.nodes.filter((node) => value(node) !== null).sort((a, b) => value(b) - value(a));
    const unsized = diagram.nodes.filter((node) => value(node) === null);

    const tiles = squarify(
      sized.map((node) => ({ node, value: value(node) })),
      { x: ctx.margin.left, y: ctx.margin.top, w: AREA.w, h: AREA.h },
    );

    for (const tile of tiles) {
      const node = tile.item.node;
      node.x = roundTo(tile.x);
      node.y = roundTo(tile.y);
      node.w = Math.max(4, roundTo(tile.w - GAP));
      node.h = Math.max(4, roundTo(tile.h - GAP));
      node.fixedSize = true;
    }
    for (const node of unsized) {
      node.x = roundTo(ctx.margin.left);
      node.y = roundTo(ctx.margin.top + AREA.h + 48);
      node.w = 0;
      node.h = 0;
      node.fixedSize = true;
    }

    const total = sized.reduce((sum, node) => sum + value(node), 0);
    const extent = contentExtent(diagram, ctx, [{ x: ctx.margin.left, y: ctx.margin.top, w: AREA.w, h: AREA.h + 64 }]);
    return { sized, unsized, total, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const unit = diagram.unit ? ` ${diagram.unit}` : "";

    const tiles = layout.sized
      .map((node) => {
        const share = layout.total ? Math.round((node.value / layout.total) * 100) : 0;
        // Only label a tile that can hold a label.
        const room = node.w > 88 && node.h > 44;
        const lines = room ? layoutParagraph(node.label, node.w - 24, TYPE.nodeTitleSmall, 2, 18).lines : [];
        return `<g class="ds-node tile ${node.tone === "accent" ? "tone-accent" : ""}" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: ${node.value}${unit}, ${share}%">
          <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="3"/>
          ${lines.map((line, index) => text(line, node.x + 12, node.y + 26 + index * 18, TYPE.nodeTitleSmall, { className: "tile-label" })).join("")}
          ${room ? text(`${node.value}${unit} · ${share}%`, node.x + 12, node.y + 26 + lines.length * 18 + 4, TYPE.meta, { className: "tile-value" }) : ""}
        </g>`;
      })
      .join("");

    const missing = layout.unsized.length
      ? text(
          `No value given, so not sized: ${layout.unsized.map((node) => node.label).join(", ")}`,
          ctx.margin.left,
          ctx.margin.top + AREA.h + 36,
          TYPE.meta,
          { className: "caption" },
        )
      : "";

    return `${tiles}${missing}`;
  },

  sample: () => ({
    nodes: [
      { label: "Compute", value: 4200, tone: "accent" },
      { label: "Managed database", value: 2600 },
      { label: "Object storage", value: 1400 },
      { label: "Data transfer", value: 900 },
      { label: "Observability", value: 620 },
      { label: "Search cluster", value: 480 },
      { label: "Queue", value: 260 },
      { label: "Secrets manager", value: 90 },
    ],
    edges: [],
    unit: "USD/month",
  }),
};
