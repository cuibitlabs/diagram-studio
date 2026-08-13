/**
 * Two-axis positioning.
 *
 * Axis names come from `diagram.axes`; the renderer never supplies its own.
 * Item placement uses `px`/`py` (0–100 along each axis) so a position means
 * something rather than being wherever the box happened to land.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { text } from "../render/primitives.js";
import { contentExtent, drawNodes, sizeAll } from "./_base.js";

const PLOT = { w: 760, h: 560 };

const axesOf = (diagram) => ({
  x: { low: "Low", high: "High", label: "", ...(diagram.axes?.x ?? {}) },
  y: { low: "Low", high: "High", label: "", ...(diagram.axes?.y ?? {}) },
});

export default {
  id: "quadrant",
  label: "Quadrant",
  description: "Items positioned against two named axes",
  family: "matrix",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, { maxW: 200, minW: 152, maxSubLines: 1 });
    const plot = { x: ctx.margin.left + 56, y: ctx.margin.top, w: PLOT.w, h: PLOT.h };

    diagram.nodes.forEach((node, index) => {
      const px = typeof node.px === "number" ? node.px : ((index * 37) % 80) + 10;
      const py = typeof node.py === "number" ? node.py : ((index * 53) % 80) + 10;
      node.px = px;
      node.py = py;
      node.x = roundTo(plot.x + (plot.w * px) / 100 - node.w / 2);
      node.y = roundTo(plot.y + plot.h - (plot.h * py) / 100 - node.h / 2);
    });

    const extent = contentExtent(diagram, ctx, [plot]);
    return { plot, axes: axesOf(diagram), width: extent.width + 56, height: extent.height + 56 };
  },

  draw(diagram, ctx, layout) {
    const { plot, axes } = layout;
    const cx = plot.x + plot.w / 2;
    const cy = plot.y + plot.h / 2;
    return `<rect class="plot-bg" x="${plot.x}" y="${plot.y}" width="${plot.w}" height="${plot.h}" rx="4"/>
      <path class="grid-line" d="M ${plot.x} ${cy} H ${plot.x + plot.w} M ${cx} ${plot.y} V ${plot.y + plot.h}"/>
      <path class="axis-line" d="M ${plot.x} ${plot.y + plot.h} H ${plot.x + plot.w}"/>
      <path class="axis-line" d="M ${plot.x} ${plot.y} V ${plot.y + plot.h}"/>
      ${text(axes.x.label, cx, plot.y + plot.h + 44, TYPE.section, { anchor: "middle", className: "axis-label" })}
      ${text(axes.x.low, plot.x, plot.y + plot.h + 24, TYPE.axis, { className: "axis-label" })}
      ${text(axes.x.high, plot.x + plot.w, plot.y + plot.h + 24, TYPE.axis, { anchor: "end", className: "axis-label" })}
      <g transform="translate(${plot.x - 28} ${cy}) rotate(-90)">${text(axes.y.label, 0, 0, TYPE.section, { anchor: "middle", className: "axis-label" })}</g>
      ${text(axes.y.high, plot.x - 12, plot.y + 12, TYPE.axis, { anchor: "end", className: "axis-label" })}
      ${text(axes.y.low, plot.x - 12, plot.y + plot.h - 4, TYPE.axis, { anchor: "end", className: "axis-label" })}
      ${drawNodes(diagram, ctx, { centre: true })}`;
  },

  sample: () => ({
    nodes: [
      { label: "Quick wins", px: 22, py: 78, tone: "accent" },
      { label: "Strategic bets", px: 78, py: 82 },
      { label: "Fill-ins", px: 20, py: 24 },
      { label: "Avoid", px: 80, py: 20 },
    ],
    edges: [],
    axes: {
      x: { label: "Effort", low: "Low effort", high: "High effort" },
      y: { label: "Value", low: "Low value", high: "High value" },
    },
  }),
};
