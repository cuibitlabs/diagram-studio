/**
 * Sankey.
 *
 * Quantity is the whole point: a band's thickness is its value, and a node's
 * height is the larger of what flows in and what flows out. Where those two
 * disagree the difference is stated rather than smoothed over — an imbalance is
 * usually the interesting finding, not a rounding error.
 *
 * Flows without a value are not drawn. A hairline where a number should be
 * would read as "small" rather than "unknown".
 */

import { assignRanks, groupByRank } from "../engine/layout/graph.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent } from "./_base.js";

const PLOT = { w: 900, h: 520 };
const NODE_W = 16;
const NODE_GAP = 20;

const value = (item) => (typeof item.value === "number" && Number.isFinite(item.value) && item.value > 0 ? item.value : null);

export default {
  id: "sankey",
  label: "Sankey",
  description: "Where a quantity goes, drawn to scale",
  family: "chart",

  layout(diagram, ctx) {
    const flows = (diagram.edges ?? []).filter((edge) => value(edge) !== null);
    const dropped = (diagram.edges ?? []).length - flows.length;

    const rank = assignRanks(diagram.nodes, flows);
    const columns = groupByRank(diagram.nodes, rank);
    const byId = new Map(diagram.nodes.map((node) => [node.id, node]));

    const inflow = new Map();
    const outflow = new Map();
    for (const edge of flows) {
      inflow.set(edge.target, (inflow.get(edge.target) ?? 0) + value(edge));
      outflow.set(edge.source, (outflow.get(edge.source) ?? 0) + value(edge));
    }
    const throughput = (id) => Math.max(inflow.get(id) ?? 0, outflow.get(id) ?? 0);

    const tallest = Math.max(
      1,
      ...columns.map((ids) => ids.reduce((sum, id) => sum + throughput(id), 0)),
    );
    const columnHeight = PLOT.h - NODE_GAP * (Math.max(...columns.map((ids) => ids.length)) - 1 || 0);
    const scale = columnHeight / tallest;

    const origin = { x: ctx.margin.left + 24, y: ctx.margin.top };
    const step = columns.length > 1 ? (PLOT.w - NODE_W) / (columns.length - 1) : 0;

    columns.forEach((ids, column) => {
      const total = ids.reduce((sum, id) => sum + throughput(id) * scale, 0) + NODE_GAP * (ids.length - 1);
      let cursor = origin.y + (PLOT.h - total) / 2;
      for (const id of ids) {
        const node = byId.get(id);
        node.w = NODE_W;
        node.h = Math.max(4, roundTo(throughput(id) * scale));
        node.fixedSize = true;
        node.x = roundTo(origin.x + column * step);
        node.y = roundTo(cursor);
        cursor += node.h + NODE_GAP;
      }
    });

    // Ribbon attach points, stacked in the order the model lists the flows.
    const outCursor = new Map();
    const inCursor = new Map();
    const ribbons = flows.map((edge) => {
      const from = byId.get(edge.source);
      const to = byId.get(edge.target);
      if (!from || !to) return null;
      const thickness = value(edge) * scale;
      const y1 = (outCursor.get(from.id) ?? from.y) + thickness / 2;
      const y2 = (inCursor.get(to.id) ?? to.y) + thickness / 2;
      outCursor.set(from.id, (outCursor.get(from.id) ?? from.y) + thickness);
      inCursor.set(to.id, (inCursor.get(to.id) ?? to.y) + thickness);
      return { edge, x1: from.x + from.w, y1, x2: to.x, y2, thickness };
    }).filter(Boolean);

    const imbalanced = diagram.nodes.filter((node) => {
      const into = inflow.get(node.id);
      const out = outflow.get(node.id);
      return into !== undefined && out !== undefined && Math.abs(into - out) > 0.001;
    });

    const extent = contentExtent(diagram, ctx, [{ x: origin.x, y: origin.y, w: PLOT.w, h: PLOT.h }]);
    return { ribbons, dropped, imbalanced, inflow, outflow, width: extent.width + 180, height: extent.height + 56 };
  },

  draw(diagram, ctx, layout) {
    const unit = diagram.unit ? ` ${diagram.unit}` : "";

    const ribbons = layout.ribbons
      .map(({ edge, x1, y1, x2, y2, thickness }) => {
        const midpoint = (x1 + x2) / 2;
        const d = `M ${x1} ${y1} C ${midpoint} ${y1} ${midpoint} ${y2} ${x2} ${y2}`;
        return `<path class="flow ${edge.tone === "accent" ? "is-focus" : ""}" d="${d}" stroke-width="${Math.max(1, thickness)}" data-edge-id="${esc(edge.id)}"/>`;
      })
      .join("");

    const nodes = diagram.nodes
      .map((node) => {
        const total = Math.max(layout.inflow.get(node.id) ?? 0, layout.outflow.get(node.id) ?? 0);
        const right = (layout.outflow.get(node.id) ?? 0) > 0;
        return `<g class="ds-node flow-node ${node.tone === "accent" ? "tone-accent" : ""}" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: ${total}${unit}">
          <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="2"/>
          ${text(node.label, right ? node.x + node.w + 10 : node.x - 10, node.y + node.h / 2 - 2, TYPE.nodeSub, { anchor: right ? "start" : "end", className: "mark-label" })}
          ${text(`${total}${unit}`, right ? node.x + node.w + 10 : node.x - 10, node.y + node.h / 2 + 14, TYPE.meta, { anchor: right ? "start" : "end", className: "mark-value" })}
        </g>`;
      })
      .join("");

    const notes = [];
    if (layout.dropped) notes.push(`${layout.dropped} flow${layout.dropped === 1 ? "" : "s"} carried no value and are not drawn`);
    if (layout.imbalanced.length) {
      notes.push(`in and out do not balance at: ${layout.imbalanced.map((node) => node.label).join(", ")}`);
    }
    const caption = notes.length
      ? text(notes.join(" · "), ctx.margin.left + 24, ctx.margin.top + PLOT.h + 40, TYPE.meta, { className: "caption" })
      : "";

    return `${ribbons}${nodes}${caption}`;
  },

  sample: () => ({
    nodes: [
      { label: "Trial signups" },
      { label: "Activated" },
      { label: "Lapsed" },
      { label: "Paid" },
      { label: "Churned", tone: "accent" },
      { label: "Retained" },
    ],
    edges: [
      { from: 0, to: 1, value: 620 },
      { from: 0, to: 2, value: 380 },
      { from: 1, to: 3, value: 410 },
      { from: 1, to: 2, value: 210 },
      { from: 3, to: 4, value: 90 },
      { from: 3, to: 5, value: 320 },
    ],
    unit: "accounts",
  }),
};
