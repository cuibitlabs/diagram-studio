/**
 * Line chart.
 *
 * Gaps in the data break the line instead of being interpolated across, because
 * a continuous line implies a measurement that was never taken.
 */

import { axisTicks, ticks } from "../engine/layout/band.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, valueOf } from "./_base.js";

const PLOT = { w: 800, h: 440 };

export default {
  id: "line",
  label: "Line chart",
  description: "A measured trend over an ordered axis",
  family: "chart",

  layout(diagram, ctx) {
    const plot = { x: ctx.margin.left + 56, y: ctx.margin.top, w: PLOT.w, h: PLOT.h };
    const values = diagram.nodes.map(valueOf);
    const max = Math.max(1, ...values.filter((value) => value !== null));
    const scale = axisTicks(max, 4);
    const top = scale.at(-1);
    const xs = ticks(diagram.nodes.length, plot.x, plot.x + plot.w);

    diagram.nodes.forEach((node, index) => {
      const value = values[index];
      node.w = 12;
      node.h = 12;
      node.fixedSize = true;
      node.x = roundTo(xs[index] - 6);
      node.y = value === null ? roundTo(plot.y + plot.h) : roundTo(plot.y + plot.h - (plot.h * value) / top - 6);
    });

    const extent = contentExtent(diagram, ctx, [plot]);
    return { plot, scale, top, xs, values, width: extent.width + 56, height: extent.height + 56 };
  },

  draw(diagram, ctx, layout) {
    const { plot, scale, top, xs, values } = layout;

    const gridlines = scale
      .map((value) => {
        const y = plot.y + plot.h - (plot.h * value) / top;
        return `<path class="grid-line" d="M ${plot.x} ${y} H ${plot.x + plot.w}"/>${text(String(value), plot.x - 12, y + 4, TYPE.axis, { anchor: "end", className: "axis-label" })}`;
      })
      .join("");

    // Break the path wherever a value is missing.
    let path = "";
    let open = false;
    values.forEach((value, index) => {
      if (value === null) {
        open = false;
        return;
      }
      const x = xs[index];
      const y = plot.y + plot.h - (plot.h * value) / top;
      path += `${open ? " L" : " M"} ${x} ${y}`;
      open = true;
    });

    const dots = diagram.nodes
      .map((node, index) => {
        const value = values[index];
        const labelMarkup = text(node.label, xs[index], plot.y + plot.h + 28, TYPE.nodeSub, { anchor: "middle", className: "mark-label" });
        if (value === null) return labelMarkup;
        const y = plot.y + plot.h - (plot.h * value) / top;
        return `<g class="ds-node chart-mark" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: ${value}">
          <circle class="mark ${node.tone === "accent" ? "is-focus" : ""}" cx="${xs[index]}" cy="${y}" r="6"/>
          ${node.tone === "accent" ? text(String(value), xs[index], y - 16, TYPE.value, { anchor: "middle", className: "mark-value" }) : ""}
          ${labelMarkup}
        </g>`;
      })
      .join("");

    const unit = diagram.unit ? text(diagram.unit, plot.x - 12, plot.y - 16, TYPE.axis, { anchor: "end", className: "axis-label" }) : "";

    return `<rect class="plot-bg" x="${plot.x}" y="${plot.y}" width="${plot.w}" height="${plot.h}" rx="4"/>
      ${gridlines}${unit}
      <path class="axis-line" d="M ${plot.x} ${plot.y} V ${plot.y + plot.h} H ${plot.x + plot.w}"/>
      <path class="mark-line" d="${path.trim()}"/>
      ${dots}`;
  },

  sample: () => ({
    nodes: [
      { label: "Jan", value: 24 },
      { label: "Feb", value: 31 },
      { label: "Mar", value: 29 },
      { label: "Apr", value: 46 },
      { label: "May", value: 58 },
      { label: "Jun", value: 71, tone: "accent" },
    ],
    edges: [],
    unit: "Active teams",
  }),
};
