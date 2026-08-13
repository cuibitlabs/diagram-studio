/**
 * Timeline: events on one axis.
 *
 * Cards alternate above and below so long labels never collide, and the axis
 * carries only the marks the model actually contains — no invented interval
 * ticks between them.
 */

import { alternating, ticks } from "../engine/layout/band.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { text } from "../render/primitives.js";
import { contentExtent, drawNodes, sizeAll } from "./_base.js";

const STEM = 56;
const MIN_STEP = 208;

export default {
  id: "timeline",
  label: "Timeline",
  description: "Events in order along a single axis",
  family: "timeline",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, { maxW: 232, maxSubLines: 2 });
    const count = diagram.nodes.length;
    const step = Math.max(MIN_STEP, ...diagram.nodes.map((node) => node.w + 32));
    const left = ctx.margin.left + step / 2;
    const right = left + step * Math.max(0, count - 1);
    const xs = ticks(count, left, right);

    const tallestAbove = Math.max(0, ...diagram.nodes.filter((_, i) => i % 2 === 0).map((node) => node.h));
    const axisY = roundTo(ctx.margin.top + tallestAbove + STEM);
    const placed = alternating(diagram.nodes, axisY, xs, STEM);
    diagram.nodes.forEach((node, index) => {
      node.x = placed[index].x;
      node.y = placed[index].y;
    });

    const extent = contentExtent(diagram, ctx);
    return {
      axisY,
      xs,
      left: ctx.margin.left,
      right: right + step / 2,
      width: Math.max(extent.width, right + step / 2 - ctx.margin.left),
      height: extent.height,
    };
  },

  draw(diagram, ctx, layout) {
    const axis = `<path class="timeline-axis" d="M ${layout.left} ${layout.axisY} H ${layout.right}" marker-end="url(#${ctx.uid}-arrow)"/>`;
    const marks = diagram.nodes
      .map((node, index) => {
        const x = layout.xs[index];
        const above = index % 2 === 0;
        const stemTo = above ? node.y + node.h : node.y;
        const focus = node.tone === "accent" ? " is-focus" : "";
        return `<path class="timeline-stem" d="M ${x} ${layout.axisY} V ${stemTo}"/>
          <circle class="timeline-dot${focus}" cx="${x}" cy="${layout.axisY}" r="7"/>
          ${node.marker ? text(node.marker, x, layout.axisY + (above ? 30 : -18), TYPE.axis, { anchor: "middle", className: "axis-label" }) : ""}`;
      })
      .join("");
    return `${axis}${marks}${drawNodes(diagram, ctx)}`;
  },

  sample: () => ({
    nodes: [
      { label: "Discovery", sublabel: "Problem framed with users", marker: "Q1" },
      { label: "Prototype", sublabel: "Two competing approaches", marker: "Q2" },
      { label: "Pilot", sublabel: "One region, real traffic", marker: "Q3", tone: "accent" },
      { label: "Launch", sublabel: "All regions", marker: "Q4" },
      { label: "Scale", sublabel: "Second product line", marker: "Q1+1" },
    ],
    edges: [],
  }),
};
