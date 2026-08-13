/**
 * Nested systems: hierarchy expressed by containment.
 *
 * Each level sits inside the previous one, so the reader gets "is part of"
 * rather than "flows to". Labels sit on the top edge of their own ring.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { boxPath } from "../render/shapes.js";
import { contentExtent } from "./_base.js";

const OUTER = { w: 760, h: 520 };
const INSET_X = 56;
const INSET_Y = 48;

export default {
  id: "nested",
  label: "Nested systems",
  description: "Hierarchy expressed by containment rather than flow",
  family: "band",

  layout(diagram, ctx) {
    diagram.nodes.forEach((node, index) => {
      node.w = roundTo(Math.max(160, OUTER.w - index * INSET_X * 2));
      node.h = roundTo(Math.max(96, OUTER.h - index * INSET_Y * 2));
      node.fixedSize = true;
      node.x = roundTo(ctx.margin.left + index * INSET_X);
      node.y = roundTo(ctx.margin.top + index * INSET_Y);
    });
    const extent = contentExtent(diagram, ctx);
    return { width: extent.width, height: extent.height };
  },

  draw(diagram, ctx) {
    return diagram.nodes
      .map((node, index) => {
        const focus = node.tone === "accent" ? " tone-accent" : "";
        const classes = `ds-node nested-ring${focus}${ctx.selectedId === node.id ? " is-selected" : ""}`;
        return `<g class="${classes}" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}">
          <path class="card" d="${boxPath({ x: node.x, y: node.y, w: node.w, h: node.h }, 12)}"/>
          ${text(node.label, node.x + 24, node.y + 30, index === 0 ? TYPE.nodeTitle : TYPE.nodeTitleSmall, { className: "node-title" })}
          ${node.sublabel ? text(node.sublabel, node.x + 24, node.y + 52, TYPE.nodeSub, { className: "node-sub" }) : ""}
        </g>`;
      })
      .join("");
  },

  sample: () => ({
    nodes: [
      { label: "Platform", sublabel: "Everything we run" },
      { label: "Experience layer", sublabel: "Web, mobile, partner APIs" },
      { label: "Service layer", sublabel: "Domain capabilities" },
      { label: "Data layer", sublabel: "Records of truth", tone: "accent" },
    ],
    edges: [],
  }),
};
