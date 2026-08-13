/**
 * Swimlane: who does what, in what order.
 *
 * Columns come from the ranked flow, rows come from ownership. A node's lane is
 * data (`node.lane`), never a coordinate guess, so re-layout cannot silently
 * reassign work to the wrong team.
 */

import { layeredLayout } from "../engine/layout/layered.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, drawEdges, drawNodes, routeAll, sizeAll } from "./_base.js";

const LANE_LABEL_W = 168;
const LANE_PAD = 28;
const LANE_GAP = 12;

function laneOrder(diagram) {
  if (Array.isArray(diagram.lanes) && diagram.lanes.length) return diagram.lanes.map(String);
  const seen = [];
  for (const node of diagram.nodes) {
    const lane = node.lane ?? "Unassigned";
    if (!seen.includes(lane)) seen.push(lane);
  }
  return seen;
}

export default {
  id: "swimlane",
  label: "Swimlane",
  description: "Cross-functional flow with explicit ownership",
  family: "swimlane",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, {});
    layeredLayout(diagram.nodes, diagram.edges ?? [], {
      direction: "LR",
      rankGap: 104,
      nodeGap: 32,
      origin: { x: ctx.margin.left + LANE_LABEL_W, y: ctx.margin.top },
    });

    const lanes = laneOrder(diagram);
    const members = new Map(lanes.map((lane) => [lane, []]));
    for (const node of diagram.nodes) {
      const lane = node.lane ?? "Unassigned";
      if (!members.has(lane)) {
        lanes.push(lane);
        members.set(lane, []);
      }
      members.get(lane).push(node);
    }

    const bands = [];
    let cursor = ctx.margin.top;
    for (const lane of lanes) {
      const nodes = members.get(lane) ?? [];
      // Stack nodes that share a column inside the same lane.
      const columns = new Map();
      for (const node of nodes) {
        const key = Math.round(node.x);
        if (!columns.has(key)) columns.set(key, []);
        columns.get(key).push(node);
      }
      let stackHeight = 0;
      for (const stacked of columns.values()) {
        stackHeight = Math.max(stackHeight, stacked.reduce((sum, node) => sum + node.h, 0) + (stacked.length - 1) * 16);
      }
      const height = roundTo(Math.max(96, stackHeight) + LANE_PAD * 2);
      for (const stacked of columns.values()) {
        const total = stacked.reduce((sum, node) => sum + node.h, 0) + (stacked.length - 1) * 16;
        let y = cursor + (height - total) / 2;
        for (const node of stacked) {
          node.y = roundTo(y);
          y += node.h + 16;
        }
      }
      bands.push({ lane, x: ctx.margin.left, y: roundTo(cursor), w: 0, h: height, nodes });
      cursor += height + LANE_GAP;
    }

    const right = Math.max(ctx.margin.left + LANE_LABEL_W, ...diagram.nodes.map((node) => node.x + node.w));
    for (const band of bands) band.w = roundTo(right + LANE_PAD - band.x);

    const routes = routeAll(diagram, {});
    const extent = contentExtent(diagram, ctx, bands);
    return { bands, routes, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const lanes = layout.bands
      .map((band, index) => `<g class="lane ${index % 2 ? "is-filled" : ""}" data-lane="${esc(band.lane)}">
        <rect x="${band.x}" y="${band.y}" width="${band.w}" height="${band.h}" rx="10"/>
        <path class="grid-line" d="M ${band.x + LANE_LABEL_W} ${band.y} V ${band.y + band.h}"/>
        ${text(band.lane, band.x + 20, band.y + band.h / 2 + 4, TYPE.section, { className: "lane-title" })}
      </g>`)
      .join("");

    return [lanes, drawEdges(diagram, ctx, layout.routes), drawNodes(diagram, ctx)].join("");
  },

  sample: () => ({
    nodes: [
      { label: "Request raised", lane: "Customer" },
      { label: "Triage", lane: "Support" },
      { label: "Design change", lane: "Product" },
      { label: "Build and test", lane: "Engineering", tone: "accent" },
      { label: "Release", lane: "Engineering" },
      { label: "Confirmed", lane: "Customer" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ],
    lanes: ["Customer", "Support", "Product", "Engineering"],
  }),
};
