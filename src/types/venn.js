/**
 * Set overlap.
 *
 * Two or three sets only — four-circle Venns are unreadable and the honest
 * alternative is a matrix. Intersection text comes from `diagram.overlaps`, so
 * an unlabelled centre stays empty instead of being filled with a platitude.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent } from "./_base.js";

const R = 176;

/** Circle centres for 2 or 3 sets, sized so every region is visible. */
function centres(count, origin) {
  if (count <= 1) return [{ x: origin.x + R, y: origin.y + R }];
  if (count === 2) {
    return [
      { x: origin.x + R, y: origin.y + R },
      { x: origin.x + R * 1.9, y: origin.y + R },
    ];
  }
  return [
    { x: origin.x + R, y: origin.y + R },
    { x: origin.x + R * 1.9, y: origin.y + R },
    { x: origin.x + R * 1.45, y: origin.y + R * 1.78 },
  ];
}

export default {
  id: "venn",
  label: "Venn",
  description: "Set overlap and the value that lives in the intersection",
  family: "set",

  layout(diagram, ctx) {
    const sets = diagram.nodes.slice(0, 3);
    const points = centres(sets.length, { x: ctx.margin.left, y: ctx.margin.top });
    sets.forEach((node, index) => {
      const point = points[index];
      node.w = R * 2;
      node.h = R * 2;
      node.fixedSize = true;
      node.x = roundTo(point.x - R);
      node.y = roundTo(point.y - R);
    });
    const extent = contentExtent(diagram, ctx);
    return { points, sets, width: extent.width, height: extent.height + 48 };
  },

  draw(diagram, ctx, layout) {
    const rings = layout.sets
      .map((node, index) => {
        const point = layout.points[index];
        return `<g class="ds-node venn-set" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}">
          <circle class="set-ring set-${index}" cx="${point.x}" cy="${point.y}" r="${R}"/>
        </g>`;
      })
      .join("");

    const labels = layout.sets
      .map((node, index) => {
        const point = layout.points[index];
        const below = layout.sets.length === 3 && index === 2;
        const y = below ? point.y + R + 32 : point.y - R - 18;
        return `${text(node.label, point.x, y, TYPE.nodeTitle, { anchor: "middle", className: "set-label" })}${
          node.sublabel ? text(node.sublabel, point.x, y + 20, TYPE.nodeSub, { anchor: "middle", className: "node-sub" }) : ""
        }`;
      })
      .join("");

    const overlapText = diagram.overlaps?.all;
    const centre = layout.points.length === 3
      ? { x: (layout.points[0].x + layout.points[1].x + layout.points[2].x) / 3, y: (layout.points[0].y + layout.points[1].y + layout.points[2].y) / 3 }
      : { x: (layout.points[0].x + (layout.points[1]?.x ?? layout.points[0].x)) / 2, y: layout.points[0].y };

    const intersection = overlapText
      ? text(overlapText, centre.x, centre.y + 6, TYPE.nodeTitleSmall, { anchor: "middle", className: "set-label" })
      : "";

    return `${rings}${intersection}${labels}`;
  },

  sample: () => ({
    nodes: [
      { label: "Desirable", sublabel: "People want it" },
      { label: "Viable", sublabel: "The business can sustain it" },
      { label: "Feasible", sublabel: "We can build it" },
    ],
    edges: [],
    overlaps: { all: "Worth building" },
  }),
};
