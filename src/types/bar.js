/**
 * Bar chart.
 *
 * The scale starts at zero and the axis maximum is a rounded value above the
 * data, never a value chosen to flatter a bar. Categories without a value are
 * drawn as an explicit gap rather than as zero.
 */

import { axisTicks, slots } from "../engine/layout/band.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, valueOf } from "./_base.js";

const PLOT = { w: 800, h: 460 };
const MAX_BAR = 88;

export default {
  id: "bar",
  label: "Bar chart",
  description: "Comparison across categories",
  family: "chart",

  layout(diagram, ctx) {
    const plot = { x: ctx.margin.left + 56, y: ctx.margin.top, w: PLOT.w, h: PLOT.h };
    const values = diagram.nodes.map(valueOf);
    const max = Math.max(1, ...values.filter((value) => value !== null));
    const scale = axisTicks(max, 4);
    const top = scale.at(-1);
    const centres = slots(diagram.nodes.length, plot.x, plot.x + plot.w);
    const barWidth = roundTo(Math.min(MAX_BAR, (plot.w / Math.max(1, diagram.nodes.length)) * 0.6));

    diagram.nodes.forEach((node, index) => {
      const value = values[index];
      const height = value === null ? 0 : roundTo((plot.h * value) / top);
      node.w = barWidth;
      node.h = Math.max(4, height);
      node.fixedSize = true;
      node.x = roundTo(centres[index] - barWidth / 2);
      node.y = roundTo(plot.y + plot.h - height);
    });

    const extent = contentExtent(diagram, ctx, [plot]);
    return { plot, scale, top, centres, missing: values.filter((value) => value === null).length, width: extent.width + 56, height: extent.height + 56 };
  },

  draw(diagram, ctx, layout) {
    const { plot, scale, top } = layout;
    const gridlines = scale
      .map((value) => {
        const y = plot.y + plot.h - (plot.h * value) / top;
        return `<path class="grid-line" d="M ${plot.x} ${y} H ${plot.x + plot.w}"/>${text(String(value), plot.x - 12, y + 4, TYPE.axis, { anchor: "end", className: "axis-label" })}`;
      })
      .join("");

    const bars = diagram.nodes
      .map((node, index) => {
        const value = valueOf(node);
        if (value === null) {
          return `${text("no data", layout.centres[index], plot.y + plot.h - 12, TYPE.meta, { anchor: "middle", className: "axis-label" })}
            ${text(node.label, layout.centres[index], plot.y + plot.h + 28, TYPE.nodeSub, { anchor: "middle", className: "mark-label" })}`;
        }
        return `<g class="ds-node chart-mark" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: ${value}">
          <rect class="mark ${node.tone === "accent" ? "is-focus" : ""}" x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="4"/>
          ${text(String(value), node.x + node.w / 2, node.y - 10, TYPE.value, { anchor: "middle", className: "mark-value" })}
          ${text(node.label, node.x + node.w / 2, plot.y + plot.h + 28, TYPE.nodeSub, { anchor: "middle", className: "mark-label" })}
        </g>`;
      })
      .join("");

    const unit = diagram.unit ? text(diagram.unit, plot.x - 12, plot.y - 16, TYPE.axis, { anchor: "end", className: "axis-label" }) : "";
    const note = layout.missing
      ? text(`${layout.missing} ${layout.missing === 1 ? "category has" : "categories have"} no value`, plot.x, plot.y + plot.h + 60, TYPE.meta, { className: "caption" })
      : "";

    return `<rect class="plot-bg" x="${plot.x}" y="${plot.y}" width="${plot.w}" height="${plot.h}" rx="4"/>
      ${gridlines}${unit}
      <path class="axis-line" d="M ${plot.x} ${plot.y} V ${plot.y + plot.h} H ${plot.x + plot.w}"/>
      ${bars}${note}`;
  },

  sample: () => ({
    nodes: [
      { label: "Research", value: 18 },
      { label: "Design", value: 26 },
      { label: "Build", value: 64, tone: "accent" },
      { label: "Launch", value: 22 },
      { label: "Improve", value: 41 },
    ],
    edges: [],
    unit: "Days",
  }),
};
