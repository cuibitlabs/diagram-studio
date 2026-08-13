/**
 * Roadmap: initiatives grouped by horizon.
 *
 * Horizons are named commitments ("Now", "Next", "Later"), never dates the
 * model does not contain. A card with no horizon lands in the first column
 * rather than being silently dropped.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, drawNodes, sizeAll } from "./_base.js";

const COLUMN_GAP = 24;
const COLUMN_PAD = 20;
const HEADER_H = 52;
const CARD_GAP = 16;
const MIN_COLUMN = 240;

function horizonOrder(diagram) {
  if (Array.isArray(diagram.horizons) && diagram.horizons.length) return diagram.horizons.map(String);
  const seen = [];
  for (const node of diagram.nodes) {
    const horizon = node.horizon ?? "Now";
    if (!seen.includes(horizon)) seen.push(horizon);
  }
  return seen.length ? seen : ["Now"];
}

export default {
  id: "roadmap",
  label: "Roadmap",
  description: "Initiatives grouped by delivery horizon",
  family: "timeline",

  layout(diagram, ctx) {
    const horizons = horizonOrder(diagram);
    sizeAll(diagram.nodes, ctx, { maxW: MIN_COLUMN - COLUMN_PAD * 2, minW: MIN_COLUMN - COLUMN_PAD * 2 });

    const members = new Map(horizons.map((horizon) => [horizon, []]));
    for (const node of diagram.nodes) {
      const horizon = horizons.includes(node.horizon) ? node.horizon : horizons[0];
      members.get(horizon).push(node);
    }

    const columnWidth = roundTo(Math.max(MIN_COLUMN, Math.max(0, ...diagram.nodes.map((node) => node.w)) + COLUMN_PAD * 2));
    const columns = horizons.map((horizon, index) => {
      const x = roundTo(ctx.margin.left + index * (columnWidth + COLUMN_GAP));
      let cursor = ctx.margin.top + HEADER_H + COLUMN_PAD;
      for (const node of members.get(horizon)) {
        node.x = roundTo(x + COLUMN_PAD);
        node.y = roundTo(cursor);
        cursor += node.h + CARD_GAP;
      }
      return { horizon, x, y: ctx.margin.top, w: columnWidth, cardsBottom: cursor - CARD_GAP, count: members.get(horizon).length };
    });

    const bottom = Math.max(...columns.map((column) => column.cardsBottom), ctx.margin.top + HEADER_H + 96);
    for (const column of columns) column.h = roundTo(bottom + COLUMN_PAD - column.y);

    const extent = contentExtent(diagram, ctx, columns);
    return { columns, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const columns = layout.columns
      .map((column, index) => `<g class="lane ${index === 0 ? "is-filled" : ""}" data-horizon="${esc(column.horizon)}">
        <rect x="${column.x}" y="${column.y}" width="${column.w}" height="${column.h}" rx="10"/>
        ${text(column.horizon, column.x + COLUMN_PAD, column.y + 32, TYPE.section, { className: "lane-title" })}
        ${text(`${column.count} ${column.count === 1 ? "initiative" : "initiatives"}`, column.x + column.w - COLUMN_PAD, column.y + 32, TYPE.meta, { anchor: "end", className: "axis-label" })}
        <path class="grid-line" d="M ${column.x} ${column.y + 44} H ${column.x + column.w}"/>
      </g>`)
      .join("");
    return `${columns}${drawNodes(diagram, ctx)}`;
  },

  sample: () => ({
    nodes: [
      { label: "Single sign-on", horizon: "Now", tone: "accent" },
      { label: "Audit trail", horizon: "Now" },
      { label: "Self-serve provisioning", horizon: "Next" },
      { label: "Usage analytics", horizon: "Next" },
      { label: "Partner marketplace", horizon: "Later" },
    ],
    edges: [],
    horizons: ["Now", "Next", "Later"],
  }),
};
