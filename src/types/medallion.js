/**
 * Medallion architecture: raw → cleaned → trusted.
 *
 * Drawn as left-to-right tiers with the promotion rule written on the arrow
 * between them, because the rule is the point of the pattern.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { text } from "../render/primitives.js";
import { contentExtent, drawNodes, sizeAll } from "./_base.js";

const TIER_W = 264;
const TIER_H = 200;
const GAP = 96;

export default {
  id: "medallion",
  label: "Medallion",
  description: "Raw, cleaned and trusted data tiers with promotion rules",
  family: "band",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, { maxSubLines: 3 });
    diagram.nodes.forEach((node, index) => {
      node.w = TIER_W;
      node.h = TIER_H;
      node.fixedSize = true;
      node.x = roundTo(ctx.margin.left + index * (TIER_W + GAP));
      node.y = roundTo(ctx.margin.top);
    });
    const extent = contentExtent(diagram, ctx);
    return { width: extent.width, height: extent.height };
  },

  draw(diagram, ctx) {
    const arrows = diagram.nodes
      .slice(0, -1)
      .map((node, index) => {
        const next = diagram.nodes[index + 1];
        const y = node.y + node.h / 2;
        const rule = (diagram.edges ?? [])[index]?.label ?? node.promotion ?? "";
        return `<g class="ds-edge">
          <path class="line" d="M ${node.x + node.w} ${y} H ${next.x}" marker-end="url(#${ctx.uid}-arrow)"/>
          ${rule ? text(rule, (node.x + node.w + next.x) / 2, y - 14, TYPE.edgeLabel, { anchor: "middle", className: "edge-label-text" }) : ""}
        </g>`;
      })
      .join("");

    const captions = diagram.nodes
      .map((node, index) => text(`Tier ${index + 1}`, node.x, node.y - 16, TYPE.axis, { className: "axis-label" }))
      .join("");

    return `${captions}${arrows}${drawNodes(diagram, ctx)}`;
  },

  sample: () => ({
    nodes: [
      { label: "Bronze", sublabel: "Landed exactly as received. Nothing dropped, nothing renamed." },
      { label: "Silver", sublabel: "Deduplicated, typed and conformed to shared keys." },
      { label: "Gold", sublabel: "Modelled for a named consumer and contract-tested.", tone: "accent" },
    ],
    edges: [
      { from: 0, to: 1, label: "validate and conform" },
      { from: 1, to: 2, label: "model for use" },
    ],
  }),
};
