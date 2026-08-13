/**
 * Radar chart.
 *
 * Every axis shares one scale, printed on the rings, because a radar with
 * per-axis scales compares nothing. A second series is supported and drawn with
 * a different outline as well as a different colour.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, legend, text } from "../render/primitives.js";
import { contentExtent, valueOf } from "./_base.js";

const RADIUS = 240;
const RINGS = [0.25, 0.5, 0.75, 1];

const polygon = (values, cx, cy, radius, max, count) =>
  values
    .map((value, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
      const r = (radius * (value ?? 0)) / max;
      return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
    })
    .join(" ");

export default {
  id: "radar",
  label: "Radar",
  description: "Multi-axis comparison on a single shared scale",
  family: "chart",

  layout(diagram, ctx) {
    const cx = roundTo(ctx.margin.left + RADIUS + 96);
    const cy = roundTo(ctx.margin.top + RADIUS + 40);
    const count = diagram.nodes.length;

    diagram.nodes.forEach((node, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
      const value = valueOf(node) ?? 0;
      node.w = 12;
      node.h = 12;
      node.fixedSize = true;
      node.x = roundTo(cx + Math.cos(angle) * ((RADIUS * value) / 100) - 6);
      node.y = roundTo(cy + Math.sin(angle) * ((RADIUS * value) / 100) - 6);
    });

    const box = { x: cx - RADIUS - 96, y: cy - RADIUS - 40, w: (RADIUS + 96) * 2, h: (RADIUS + 40) * 2 + 48 };
    const extent = contentExtent(diagram, ctx, [box]);
    return { cx, cy, count, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const { cx, cy, count } = layout;
    const max = 100;

    const rings = RINGS.map((scale) => {
      const points = diagram.nodes
        .map((_, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
          return `${cx + Math.cos(angle) * RADIUS * scale},${cy + Math.sin(angle) * RADIUS * scale}`;
        })
        .join(" ");
      return `<polygon class="grid-line" points="${points}" fill="none"/>`;
    }).join("");

    const scaleLabels = RINGS.map((scale) => text(String(Math.round(max * scale)), cx + 6, cy - RADIUS * scale + 4, TYPE.axis, { className: "axis-label" })).join("");

    const spokes = diagram.nodes
      .map((node, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
        const x = cx + Math.cos(angle) * RADIUS;
        const y = cy + Math.sin(angle) * RADIUS;
        const lx = cx + Math.cos(angle) * (RADIUS + 36);
        const ly = cy + Math.sin(angle) * (RADIUS + 36);
        const anchor = Math.abs(lx - cx) < 12 ? "middle" : lx > cx ? "start" : "end";
        return `<path class="grid-line" d="M ${cx} ${cy} L ${x} ${y}"/>${text(node.label, lx, ly + 4, TYPE.nodeSub, { anchor, className: "mark-label" })}`;
      })
      .join("");

    const primary = diagram.nodes.map(valueOf);
    const shape = `<polygon class="mark-area" points="${polygon(primary, cx, cy, RADIUS, max, count)}"/><polygon class="mark-line" points="${polygon(primary, cx, cy, RADIUS, max, count)}" fill="none"/>`;

    const dots = diagram.nodes
      .map((node) => {
        const value = valueOf(node);
        if (value === null) return "";
        return `<g class="ds-node chart-mark" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: ${value}">
          <circle class="mark ${node.tone === "accent" ? "is-focus" : ""}" cx="${node.x + 6}" cy="${node.y + 6}" r="5"/>
        </g>`;
      })
      .join("");

    const key = diagram.seriesLabel
      ? legend([{ label: diagram.seriesLabel }], cx - RADIUS, cy + RADIUS + 72)
      : "";

    return `${rings}${spokes}${scaleLabels}${shape}${dots}${key}`;
  },

  sample: () => ({
    nodes: [
      { label: "Speed", value: 72 },
      { label: "Quality", value: 84, tone: "accent" },
      { label: "Cost", value: 48 },
      { label: "Security", value: 66 },
      { label: "Adoption", value: 58 },
      { label: "Scale", value: 40 },
    ],
    edges: [],
    seriesLabel: "Current assessment",
  }),
};
