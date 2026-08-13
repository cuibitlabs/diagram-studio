/**
 * Scatter plot.
 *
 * Both coordinates are data (`px`, `py`); nothing is positioned by index. A
 * point missing either coordinate is listed under the plot instead of being
 * placed somewhere plausible.
 */

import { axisTicks } from "../engine/layout/band.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent } from "./_base.js";

const PLOT = { w: 720, h: 520 };

const coord = (node, key) => (typeof node[key] === "number" && Number.isFinite(node[key]) ? node[key] : null);

export default {
  id: "scatter",
  label: "Scatter plot",
  description: "Distribution and correlation across two measures",
  family: "chart",

  layout(diagram, ctx) {
    const plot = { x: ctx.margin.left + 56, y: ctx.margin.top, w: PLOT.w, h: PLOT.h };
    const xs = diagram.nodes.map((node) => coord(node, "px")).filter((value) => value !== null);
    const ys = diagram.nodes.map((node) => coord(node, "py")).filter((value) => value !== null);
    const xScale = axisTicks(Math.max(1, ...xs), 4);
    const yScale = axisTicks(Math.max(1, ...ys), 4);
    const xTop = xScale.at(-1);
    const yTop = yScale.at(-1);

    const unplotted = [];
    diagram.nodes.forEach((node) => {
      const px = coord(node, "px");
      const py = coord(node, "py");
      node.w = 16;
      node.h = 16;
      node.fixedSize = true;
      if (px === null || py === null) {
        unplotted.push(node);
        node.x = roundTo(plot.x);
        node.y = roundTo(plot.y + plot.h + 64);
        return;
      }
      node.x = roundTo(plot.x + (plot.w * px) / xTop - 8);
      node.y = roundTo(plot.y + plot.h - (plot.h * py) / yTop - 8);
    });

    const extent = contentExtent(diagram, ctx, [plot]);
    return { plot, xScale, yScale, xTop, yTop, unplotted, width: extent.width + 56, height: extent.height + 56 };
  },

  draw(diagram, ctx, layout) {
    const { plot, xScale, yScale, xTop, yTop, unplotted } = layout;
    const axes = diagram.axes ?? {};

    const gridY = yScale
      .map((value) => {
        const y = plot.y + plot.h - (plot.h * value) / yTop;
        return `<path class="grid-line" d="M ${plot.x} ${y} H ${plot.x + plot.w}"/>${text(String(value), plot.x - 12, y + 4, TYPE.axis, { anchor: "end", className: "axis-label" })}`;
      })
      .join("");
    const gridX = xScale
      .map((value) => {
        const x = plot.x + (plot.w * value) / xTop;
        return `<path class="grid-line" d="M ${x} ${plot.y} V ${plot.y + plot.h}"/>${text(String(value), x, plot.y + plot.h + 24, TYPE.axis, { anchor: "middle", className: "axis-label" })}`;
      })
      .join("");

    const points = diagram.nodes
      .filter((node) => !unplotted.includes(node))
      .map((node) => `<g class="ds-node chart-mark" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: ${node.px}, ${node.py}">
        <circle class="mark ${node.tone === "accent" ? "is-focus" : ""}" cx="${node.x + 8}" cy="${node.y + 8}" r="8"/>
        ${text(node.label, node.x + 20, node.y + 13, TYPE.nodeSub, { className: "mark-label" })}
      </g>`)
      .join("");

    const missing = unplotted.length
      ? text(`Not plotted (missing coordinates): ${unplotted.map((node) => node.label).join(", ")}`, plot.x, plot.y + plot.h + 60, TYPE.meta, { className: "caption" })
      : "";

    return `<rect class="plot-bg" x="${plot.x}" y="${plot.y}" width="${plot.w}" height="${plot.h}" rx="4"/>
      ${gridY}${gridX}
      <path class="axis-line" d="M ${plot.x} ${plot.y} V ${plot.y + plot.h} H ${plot.x + plot.w}"/>
      ${axes.x?.label ? text(axes.x.label, plot.x + plot.w / 2, plot.y + plot.h + 52, TYPE.section, { anchor: "middle", className: "axis-label" }) : ""}
      ${axes.y?.label ? `<g transform="translate(${plot.x - 44} ${plot.y + plot.h / 2}) rotate(-90)">${text(axes.y.label, 0, 0, TYPE.section, { anchor: "middle", className: "axis-label" })}</g>` : ""}
      ${points}${missing}`;
  },

  sample: () => ({
    nodes: [
      { label: "Alpha", px: 12, py: 34 },
      { label: "Beta", px: 28, py: 52 },
      { label: "Gamma", px: 44, py: 41 },
      { label: "Delta", px: 61, py: 76, tone: "accent" },
      { label: "Epsilon", px: 73, py: 68 },
      { label: "Zeta", px: 88, py: 91 },
    ],
    edges: [],
    axes: { x: { label: "Adoption" }, y: { label: "Satisfaction" } },
  }),
};
