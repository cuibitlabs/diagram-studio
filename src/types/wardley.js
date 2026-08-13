/**
 * Wardley map.
 *
 * Two axes that mean something: how visible a component is to the user, and how
 * evolved it is. The value of the format is that position is an argument you can
 * be wrong about — so both coordinates come from the model and neither is
 * inferred. A component with no stated evolution is not placed at a guess; it is
 * listed as unplaced under the map.
 *
 * Diagonals are correct here: a dependency line is a relationship, not a route.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, drawNodes, sizeAll } from "./_base.js";

const PLOT = { w: 900, h: 560 };

/** Fixed by the method, not by the data. */
const STAGES = [
  { label: "Genesis", note: "Novel, uncertain" },
  { label: "Custom-built", note: "Built for us" },
  { label: "Product", note: "Bought, configured" },
  { label: "Commodity", note: "Utility, invisible" },
];

const coord = (node, key) => (typeof node[key] === "number" && Number.isFinite(node[key]) ? node[key] : null);

export default {
  id: "wardley",
  label: "Wardley map",
  description: "Components by user visibility and evolution, with their dependencies",
  family: "map",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, { minW: 140, maxW: 200, minH: 44, maxSubLines: 1, dense: true });
    const plot = { x: ctx.margin.left + 72, y: ctx.margin.top, w: PLOT.w, h: PLOT.h };

    const unplaced = [];
    for (const node of diagram.nodes) {
      const px = coord(node, "px");
      const py = coord(node, "py");
      if (px === null || py === null) {
        unplaced.push(node);
        node.x = roundTo(plot.x);
        node.y = roundTo(plot.y + plot.h + 88);
        continue;
      }
      node.x = roundTo(plot.x + (plot.w * px) / 100 - node.w / 2);
      node.y = roundTo(plot.y + plot.h - (plot.h * py) / 100 - node.h / 2);
    }

    const extent = contentExtent(diagram, ctx, [plot]);
    return { plot, unplaced, width: extent.width + 72, height: extent.height + 64 };
  },

  draw(diagram, ctx, layout) {
    const { plot, unplaced } = layout;
    const byId = new Map(diagram.nodes.map((node) => [node.id, node]));

    const bands = STAGES.map((stage, index) => {
      const x = plot.x + (plot.w / STAGES.length) * index;
      const width = plot.w / STAGES.length;
      return `${index ? `<path class="grid-line" d="M ${x} ${plot.y} V ${plot.y + plot.h}"/>` : ""}
        ${text(stage.label, x + width / 2, plot.y + plot.h + 24, TYPE.axis, { anchor: "middle", className: "axis-label" })}
        ${text(stage.note, x + width / 2, plot.y + plot.h + 42, TYPE.meta, { anchor: "middle", className: "axis-label" })}`;
    }).join("");

    // Dependencies first, so a component sits on top of its own lines.
    const links = (diagram.edges ?? [])
      .map((edge) => {
        const from = byId.get(edge.source);
        const to = byId.get(edge.target);
        if (!from || !to || unplaced.includes(from) || unplaced.includes(to)) return "";
        return `<path class="map-link ${edge.dashed ? "is-dashed" : ""}" d="M ${from.x + from.w / 2} ${from.y + from.h / 2} L ${to.x + to.w / 2} ${to.y + to.h / 2}"/>`;
      })
      .join("");

    // Expected movement, drawn only where the model states it.
    const movement = diagram.nodes
      .filter((node) => typeof node.movement === "number" && node.movement !== 0 && !unplaced.includes(node))
      .map((node) => {
        const from = node.x + node.w / 2;
        const distance = (plot.w * node.movement) / 100;
        const to = Math.max(plot.x, Math.min(plot.x + plot.w, from + distance));
        const y = node.y + node.h / 2;
        return `<path class="map-move" d="M ${from} ${y} H ${to}" marker-end="url(#${ctx.uid}-arrow)"/>`;
      })
      .join("");

    const missing = unplaced.length
      ? text(
          `Unplaced (no evolution or visibility given): ${unplaced.map((node) => node.label).join(", ")}`,
          plot.x,
          plot.y + plot.h + 76,
          TYPE.meta,
          { className: "caption" },
        )
      : "";

    return `<rect class="plot-bg" x="${plot.x}" y="${plot.y}" width="${plot.w}" height="${plot.h}" rx="4"/>
      ${bands}
      <path class="axis-line" d="M ${plot.x} ${plot.y} V ${plot.y + plot.h} H ${plot.x + plot.w}"/>
      <g transform="translate(${plot.x - 44} ${plot.y + plot.h / 2}) rotate(-90)">${text("Visible to the user", 0, 0, TYPE.section, { anchor: "middle", className: "axis-label" })}</g>
      ${text("Evolution", plot.x + plot.w / 2, plot.y + plot.h + 66, TYPE.section, { anchor: "middle", className: "axis-label" })}
      ${links}${movement}
      ${drawNodes(diagram, ctx, { centre: true })}
      ${missing}`;
  },

  sample: () => ({
    nodes: [
      { label: "Customer", px: 82, py: 96, tone: "accent" },
      { label: "Order tracking", px: 46, py: 78 },
      { label: "Notification service", px: 58, py: 58, movement: 14 },
      { label: "Carrier integration", px: 34, py: 44, movement: 18 },
      { label: "Message queue", px: 78, py: 28 },
      { label: "Compute", px: 92, py: 10 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ],
  }),
};
