/**
 * Loop / flywheel: a reinforcing cycle.
 *
 * The hub is optional and its text comes from `diagram.hub` — the renderer
 * never invents a centre label. Stages connect along the ring so the direction
 * of reinforcement is unambiguous.
 */

import { ringLayout } from "../engine/layout/radial.js";
import { measureText } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { text } from "../render/primitives.js";
import { contentExtent, drawNodes, normaliseTo, sizeAll } from "./_base.js";

const CENTRE = { x: 0, y: 0 };

export default {
  id: "loop",
  label: "Loop / flywheel",
  description: "A reinforcing cycle of stages",
  family: "radial",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, { maxW: 216, maxSubLines: 1 });
    const hubRadius = diagram.hub
      ? Math.max(72, measureText(diagram.hub.label ?? "", TYPE.nodeTitle) / 2 + 28)
      : 0;
    const ring = ringLayout(diagram.nodes, {
      origin: CENTRE,
      ringGap: 96,
      minRadius: hubRadius ? hubRadius + 120 : undefined,
    });
    const shift = normaliseTo(diagram, { x: ctx.margin.left, y: ctx.margin.top });
    const centre = { x: CENTRE.x + shift.dx, y: CENTRE.y + shift.dy };
    const extent = contentExtent(diagram, ctx);
    return { ring, centre, hubRadius, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const { centre, ring } = layout;
    const nodes = diagram.nodes;
    const arcs = nodes
      .map((node, index) => {
        const next = nodes[(index + 1) % nodes.length];
        if (!next || nodes.length < 2) return "";
        const a = ring.angles.get(node.id);
        const b = ring.angles.get(next.id);
        if (a === undefined || b === undefined) return "";
        const pad = 0.16;
        const from = { x: centre.x + Math.cos(a + pad) * ring.radius, y: centre.y + Math.sin(a + pad) * ring.radius };
        const to = { x: centre.x + Math.cos(b - pad) * ring.radius, y: centre.y + Math.sin(b - pad) * ring.radius };
        const d = `M ${from.x} ${from.y} A ${ring.radius} ${ring.radius} 0 0 1 ${to.x} ${to.y}`;
        return `<path class="line ring-arc" d="${d}" marker-end="url(#${ctx.uid}-arrow)"/>`;
      })
      .join("");

    const hub = diagram.hub
      ? `<g class="hub-group"><circle class="hub" cx="${centre.x}" cy="${centre.y}" r="${layout.hubRadius}"/>${text(
          diagram.hub.label,
          centre.x,
          centre.y + (diagram.hub.sublabel ? -2 : 6),
          TYPE.nodeTitle,
          { anchor: "middle", className: "hub-label" },
        )}${diagram.hub.sublabel ? text(diagram.hub.sublabel, centre.x, centre.y + 20, TYPE.meta, { anchor: "middle", className: "hub-label" }) : ""}</g>`
      : "";

    return `<g class="ds-edge ring">${arcs}</g>${hub}${drawNodes(diagram, ctx, { centre: true })}`;
  },

  sample: () => ({
    nodes: [
      { label: "Discover", sublabel: "Find the real problem" },
      { label: "Decide", sublabel: "Choose one bet" },
      { label: "Deliver", tone: "accent" },
      { label: "Measure", sublabel: "Against the bet" },
      { label: "Learn", sublabel: "Feed the next cycle" },
    ],
    edges: [],
    hub: { label: "Shared context" },
  }),
};
