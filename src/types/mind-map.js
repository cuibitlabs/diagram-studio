/**
 * Mind map: one central idea, branches around it.
 *
 * Radial layouts are exempt from the orthogonal-connector rule — a spoke that
 * elbows would imply routing that is not part of the meaning.
 */

import { radialTreeLayout } from "../engine/layout/radial.js";
import { forestOf } from "../engine/layout/tree.js";
import { contentExtent, drawNodes, normaliseTo, sizeAll } from "./_base.js";

/** Point where the line from `to` meets the border of `from`. */
function borderPoint(from, to) {
  const cx = from.x + from.w / 2;
  const cy = from.y + from.h / 2;
  const dx = to.x + to.w / 2 - cx;
  const dy = to.y + to.h / 2 - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const scale = Math.min(
    dx === 0 ? Infinity : from.w / 2 / Math.abs(dx),
    dy === 0 ? Infinity : from.h / 2 / Math.abs(dy),
  );
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export default {
  id: "mind-map",
  label: "Mind map",
  description: "Ideas branching from a central concept",
  family: "radial",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, { maxW: 224 });
    radialTreeLayout(diagram.nodes, diagram.edges ?? [], {
      origin: { x: 0, y: 0 },
      ringGap: 88,
    });
    normaliseTo(diagram, { x: ctx.margin.left, y: ctx.margin.top });
    const { children } = forestOf(diagram.nodes, diagram.edges ?? []);
    const extent = contentExtent(diagram, ctx);
    return { children, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const byId = new Map(diagram.nodes.map((node) => [node.id, node]));
    const spokes = (diagram.edges ?? [])
      .map((edge) => {
        const from = byId.get(edge.source);
        const to = byId.get(edge.target);
        if (!from || !to) return "";
        const a = borderPoint(from, to);
        const b = borderPoint(to, from);
        return `<g class="ds-edge ${edge.dashed ? "is-dashed" : ""}" data-edge-id="${edge.id}">
          <path class="edge-hit" d="M ${a.x} ${a.y} L ${b.x} ${b.y}"/>
          <path class="line" d="M ${a.x} ${a.y} L ${b.x} ${b.y}"/>
        </g>`;
      })
      .join("");
    return `${spokes}${drawNodes(diagram, ctx, { centre: true })}`;
  },

  sample: () => ({
    nodes: [
      { label: "Product strategy", tone: "accent" },
      { label: "People" },
      { label: "Process" },
      { label: "Technology" },
      { label: "Market" },
      { label: "Hiring plan" },
      { label: "Rituals" },
      { label: "Platform" },
      { label: "Segments" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 1, to: 5 },
      { from: 2, to: 6 },
      { from: 3, to: 7 },
      { from: 4, to: 8 },
    ],
  }),
};
