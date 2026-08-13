/**
 * Named-scenario matrix (the consultant 2×2).
 *
 * Unlike the quadrant, every cell is a named strategy with a recommendation,
 * so the cell is the content — nothing floats inside it.
 */

import { grid } from "../engine/layout/band.js";
import { layoutParagraph, roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text, textBlock } from "../render/primitives.js";
import { boxPath } from "../render/shapes.js";
import { contentExtent } from "./_base.js";

const AREA = { w: 720, h: 520 };

export default {
  id: "matrix",
  label: "Consultant matrix",
  description: "Four named strategies against two axes",
  family: "matrix",

  layout(diagram, ctx) {
    const area = { x: ctx.margin.left + 56, y: ctx.margin.top, w: AREA.w, h: AREA.h };
    const cells = grid(Math.max(4, diagram.nodes.length), area, { columns: 2, gapX: 16, gapY: 16 });
    diagram.nodes.forEach((node, index) => {
      const cell = cells[index] ?? cells.at(-1);
      node.x = roundTo(cell.x);
      node.y = roundTo(cell.y);
      node.w = roundTo(cell.w);
      node.h = roundTo(cell.h);
      node.fixedSize = true;
    });
    const axes = {
      x: { low: "", high: "", label: "", ...(diagram.axes?.x ?? {}) },
      y: { low: "", high: "", label: "", ...(diagram.axes?.y ?? {}) },
    };
    const extent = contentExtent(diagram, ctx, [area]);
    return { area, axes, width: extent.width + 56, height: extent.height + 48 };
  },

  draw(diagram, ctx, layout) {
    const { area, axes } = layout;
    const cells = diagram.nodes
      .map((node) => {
        const focus = node.tone === "accent";
        const body = node.sublabel
          ? layoutParagraph(node.sublabel, node.w - 48, TYPE.nodeSub, 4, TYPE.nodeSub.leading)
          : null;
        return `<g class="ds-node matrix-cell ${focus ? "tone-accent" : ""} ${ctx.selectedId === node.id ? "is-selected" : ""}" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}">
          <path class="card" d="${boxPath({ x: node.x, y: node.y, w: node.w, h: node.h }, ctx.corner ?? 8)}"/>
          ${text(node.label, node.x + 24, node.y + 40, TYPE.nodeTitle, { className: "node-title" })}
          ${body ? textBlock(body.lines, node.x + 24, node.y + 68, TYPE.nodeSub, { className: "node-sub" }) : ""}
          ${node.action ? text(node.action, node.x + 24, node.y + node.h - 24, TYPE.meta, { className: "node-sub" }) : ""}
        </g>`;
      })
      .join("");

    const cx = area.x + area.w / 2;
    const cy = area.y + area.h / 2;
    return `${text(axes.x.label, cx, area.y + area.h + 40, TYPE.section, { anchor: "middle", className: "axis-label" })}
      ${text(axes.x.low, area.x, area.y + area.h + 22, TYPE.axis, { className: "axis-label" })}
      ${text(axes.x.high, area.x + area.w, area.y + area.h + 22, TYPE.axis, { anchor: "end", className: "axis-label" })}
      <g transform="translate(${area.x - 28} ${cy}) rotate(-90)">${text(axes.y.label, 0, 0, TYPE.section, { anchor: "middle", className: "axis-label" })}</g>
      ${text(axes.y.high, area.x - 12, area.y + 12, TYPE.axis, { anchor: "end", className: "axis-label" })}
      ${text(axes.y.low, area.x - 12, area.y + area.h - 4, TYPE.axis, { anchor: "end", className: "axis-label" })}
      ${cells}`;
  },

  sample: () => ({
    nodes: [
      { label: "Transform", sublabel: "High value to the business and expensive to keep as it is.", action: "Fund a rebuild", tone: "accent" },
      { label: "Optimise", sublabel: "Valuable and healthy. Small investments compound here.", action: "Invest incrementally" },
      { label: "Maintain", sublabel: "Low value but low cost. Leave it alone.", action: "Hold" },
      { label: "Retire", sublabel: "Low value and high cost to run.", action: "Plan an exit" },
    ],
    edges: [],
    axes: {
      x: { label: "Cost to run", low: "Low", high: "High" },
      y: { label: "Business value", low: "Low", high: "High" },
    },
  }),
};
