/**
 * Kanban board.
 *
 * The columns are the workflow; the WIP limit is the argument. A board drawn
 * without limits is a to-do list, so the limit is shown next to the count and a
 * column over its limit is marked — from the model's own numbers, never from an
 * assumption about what a healthy column looks like.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, drawNodes, sizeAll } from "./_base.js";

const COLUMN_GAP = 20;
const PAD = 16;
const HEADER = 56;
const CARD_GAP = 12;
const MIN_COLUMN = 224;

function columnOrder(diagram) {
  if (Array.isArray(diagram.columns) && diagram.columns.length) return diagram.columns;
  const seen = [];
  for (const node of diagram.nodes) {
    const column = node.column ?? "Backlog";
    if (!seen.some((entry) => entry.name === column)) seen.push({ name: column });
  }
  return seen.length ? seen : [{ name: "Backlog" }];
}

export default {
  id: "kanban",
  label: "Kanban board",
  description: "Work in columns, with the limit that makes it a system",
  family: "band",

  layout(diagram, ctx) {
    const columns = columnOrder(diagram).map((entry) => (typeof entry === "string" ? { name: entry } : entry));
    sizeAll(diagram.nodes, ctx, { minW: MIN_COLUMN - PAD * 2, maxW: MIN_COLUMN - PAD * 2, maxSubLines: 2 });

    const members = new Map(columns.map((column) => [column.name, []]));
    for (const node of diagram.nodes) {
      const name = members.has(node.column) ? node.column : columns[0].name;
      members.get(name).push(node);
    }

    const width = roundTo(Math.max(MIN_COLUMN, Math.max(0, ...diagram.nodes.map((node) => node.w)) + PAD * 2));
    const placed = columns.map((column, index) => {
      const x = roundTo(ctx.margin.left + index * (width + COLUMN_GAP));
      let cursor = ctx.margin.top + HEADER + PAD;
      for (const node of members.get(column.name)) {
        node.x = roundTo(x + PAD);
        node.y = roundTo(cursor);
        cursor += node.h + CARD_GAP;
      }
      const count = members.get(column.name).length;
      return {
        ...column,
        x,
        y: ctx.margin.top,
        w: width,
        bottom: cursor - CARD_GAP,
        count,
        over: typeof column.limit === "number" && count > column.limit,
      };
    });

    const bottom = Math.max(...placed.map((column) => column.bottom), ctx.margin.top + HEADER + 120);
    for (const column of placed) column.h = roundTo(bottom + PAD - column.y);

    const extent = contentExtent(diagram, ctx, placed);
    return { columns: placed, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const columns = layout.columns
      .map((column) => {
        const limit = typeof column.limit === "number" ? `${column.count} / ${column.limit}` : `${column.count}`;
        return `<g class="lane ${column.over ? "" : "is-filled"}" data-column="${esc(column.name)}">
        <rect x="${column.x}" y="${column.y}" width="${column.w}" height="${column.h}" rx="10"/>
        ${text(column.name, column.x + PAD, column.y + 28, TYPE.section, { className: "lane-title" })}
        ${text(limit, column.x + column.w - PAD, column.y + 28, TYPE.meta, { anchor: "end", className: column.over ? "wip-over" : "axis-label" })}
        ${column.over ? text("over limit", column.x + column.w - PAD, column.y + 46, TYPE.meta, { anchor: "end", className: "wip-over" }) : ""}
        <path class="grid-line" d="M ${column.x} ${column.y + HEADER} H ${column.x + column.w}"/>
      </g>`;
      })
      .join("");
    return `${columns}${drawNodes(diagram, ctx)}`;
  },

  sample: () => ({
    nodes: [
      { label: "Rename the billing endpoints", sublabel: "Blocked on the client release", column: "In progress" },
      { label: "Idempotency keys on retries", column: "In progress" },
      { label: "Split the orders read model", column: "In progress", tone: "accent" },
      { label: "Drop the legacy webhook", column: "Ready" },
      { label: "Backfill the audit log", column: "Ready" },
      { label: "Retire the v1 API", column: "Backlog" },
      { label: "Contract tests for carriers", column: "Done" },
    ],
    edges: [],
    columns: [
      { name: "Backlog" },
      { name: "Ready", limit: 3 },
      { name: "In progress", limit: 2 },
      { name: "Done" },
    ],
  }),
};
