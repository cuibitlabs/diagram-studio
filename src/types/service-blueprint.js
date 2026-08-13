/**
 * Service blueprint.
 *
 * A journey drawn with everything the customer cannot see. The lanes are fixed
 * and named, and the line of visibility is drawn heavier than the others,
 * because the whole value of the format is being able to point at it and ask
 * what crosses it.
 */

import { layeredLayout } from "../engine/layout/layered.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, drawEdges, drawNodes, routeAll, sizeAll } from "./_base.js";

const LANE_LABEL_W = 176;
const LANE_PAD = 24;
const LANE_GAP = 8;

/** Fixed by the format, not by the data. */
const LANES = [
  { id: "evidence", label: "Physical evidence", note: "What the customer sees" },
  { id: "customer", label: "Customer actions", note: "What the customer does" },
  { id: "frontstage", label: "Frontstage", note: "Visible to the customer" },
  { id: "backstage", label: "Backstage", note: "Hidden from the customer" },
  { id: "support", label: "Support processes", note: "Systems and third parties" },
];

/** The heavier rule sits between frontstage and backstage. */
const VISIBILITY_AFTER = "frontstage";

export default {
  id: "service-blueprint",
  label: "Service blueprint",
  description: "A journey with the frontstage, backstage and the line of visibility",
  family: "swimlane",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, { maxSubLines: 2 });
    layeredLayout(diagram.nodes, diagram.edges ?? [], {
      direction: "LR",
      rankGap: 96,
      nodeGap: 28,
      origin: { x: ctx.margin.left + LANE_LABEL_W, y: ctx.margin.top },
    });

    const members = new Map(LANES.map((lane) => [lane.id, []]));
    for (const node of diagram.nodes) {
      const lane = members.has(node.lane) ? node.lane : "customer";
      node.lane = lane;
      members.get(lane).push(node);
    }

    const bands = [];
    let cursor = ctx.margin.top;
    for (const lane of LANES) {
      const nodes = members.get(lane.id);
      const tallest = Math.max(64, ...nodes.map((node) => node.h));
      const height = roundTo(tallest + LANE_PAD * 2);
      for (const node of nodes) node.y = roundTo(cursor + (height - node.h) / 2);
      bands.push({ ...lane, x: ctx.margin.left, y: roundTo(cursor), w: 0, h: height, count: nodes.length });
      cursor += height + LANE_GAP;
    }

    const right = Math.max(ctx.margin.left + LANE_LABEL_W + 200, ...diagram.nodes.map((node) => node.x + node.w));
    for (const band of bands) band.w = roundTo(right + LANE_PAD - band.x);

    const routes = routeAll(diagram, {});
    const extent = contentExtent(diagram, ctx, bands);
    return { bands, routes, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const lanes = layout.bands
      .map((band, index) => `<g class="lane ${index % 2 ? "is-filled" : ""}" data-lane="${esc(band.id)}">
        <rect x="${band.x}" y="${band.y}" width="${band.w}" height="${band.h}" rx="8"/>
        <path class="grid-line" d="M ${band.x + LANE_LABEL_W} ${band.y} V ${band.y + band.h}"/>
        ${text(band.label, band.x + 18, band.y + band.h / 2 - 2, TYPE.section, { className: "lane-title" })}
        ${text(band.note, band.x + 18, band.y + band.h / 2 + 16, TYPE.meta, { className: "axis-label" })}
      </g>`)
      .join("");

    const boundary = layout.bands.find((band) => band.id === VISIBILITY_AFTER);
    const visibility = boundary
      ? `<g class="visibility-line">
          <path d="M ${boundary.x} ${boundary.y + boundary.h + LANE_GAP / 2} H ${boundary.x + boundary.w}"/>
          ${text("Line of visibility", boundary.x + boundary.w, boundary.y + boundary.h + LANE_GAP / 2 - 8, TYPE.axis, { anchor: "end", className: "visibility-label" })}
        </g>`
      : "";

    return [lanes, visibility, drawEdges(diagram, ctx, layout.routes), drawNodes(diagram, ctx)].join("");
  },

  sample: () => ({
    nodes: [
      { label: "Order confirmation email", lane: "evidence" },
      { label: "Places the order", lane: "customer" },
      { label: "Tracks the delivery", lane: "customer" },
      { label: "Checkout confirms", lane: "frontstage" },
      { label: "Tracking page updates", lane: "frontstage", tone: "accent" },
      { label: "Payment captured", lane: "backstage" },
      { label: "Warehouse picks and packs", lane: "backstage" },
      { label: "Carrier books the collection", lane: "support" },
    ],
    edges: [
      { from: 1, to: 3 },
      { from: 3, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
      { from: 7, to: 4 },
      { from: 4, to: 2 },
    ],
  }),
};
