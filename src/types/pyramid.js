/**
 * Pyramid / funnel.
 *
 * Level widths are proportional to the model's values when every level has one,
 * and evenly stepped when they do not — a funnel drawn to invented proportions
 * is a chart that lies.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, valueOf } from "./_base.js";

const MAX_W = 760;
const LEVEL_H = 96;
const GAP = 8;

export default {
  id: "pyramid",
  label: "Pyramid / funnel",
  description: "Priority, maturity or drop-off across levels",
  family: "band",

  layout(diagram, ctx) {
    const count = diagram.nodes.length;
    const values = diagram.nodes.map(valueOf);
    const proportional = values.every((value) => value !== null && value > 0);
    const max = proportional ? Math.max(...values) : 1;

    diagram.nodes.forEach((node, index) => {
      const share = proportional ? values[index] / max : (index + 1) / count;
      const width = roundTo(Math.max(160, MAX_W * share));
      node.w = width;
      node.h = LEVEL_H;
      node.fixedSize = true;
      node.x = roundTo(ctx.margin.left + (MAX_W - width) / 2);
      node.y = roundTo(ctx.margin.top + index * (LEVEL_H + GAP));
    });

    const extent = contentExtent(diagram, ctx);
    return { proportional, width: Math.max(extent.width, MAX_W), height: extent.height };
  },

  draw(diagram, ctx, layout) {
    return diagram.nodes
      .map((node, index) => {
        const next = diagram.nodes[index + 1];
        const bottomW = next ? next.w : node.w;
        const x1 = node.x;
        const x2 = node.x + node.w;
        const bx1 = ctx.margin.left + (760 - bottomW) / 2;
        const bx2 = bx1 + bottomW;
        const focus = node.tone === "accent" ? " is-focus" : "";
        const value = valueOf(node);
        return `<g class="ds-node pyramid-level" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}">
          <path class="tier${focus}" d="M ${x1} ${node.y} H ${x2} L ${bx2} ${node.y + node.h} H ${bx1} Z"/>
          ${text(node.label, node.x + node.w / 2, node.y + node.h / 2 + 2, TYPE.nodeTitle, { anchor: "middle", className: "tier-label" })}
          ${node.sublabel ? text(node.sublabel, node.x + node.w / 2, node.y + node.h / 2 + 24, TYPE.nodeSub, { anchor: "middle", className: "tier-label" }) : ""}
          ${layout.proportional && value !== null ? text(String(value), x2 + 20, node.y + node.h / 2 + 4, TYPE.value, { className: "mark-value" }) : ""}
        </g>`;
      })
      .join("");
  },

  sample: () => ({
    nodes: [
      { label: "Vision", sublabel: "Why this exists" },
      { label: "Strategy", sublabel: "Where we will win" },
      { label: "Programmes", sublabel: "Funded bets", tone: "accent" },
      { label: "Projects", sublabel: "Scoped delivery" },
      { label: "Tasks", sublabel: "This fortnight" },
    ],
    edges: [],
  }),
};
