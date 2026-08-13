/**
 * Gantt.
 *
 * Bars come from `start` and `duration` on the node, in whatever unit the model
 * declares. Tasks missing either value are listed as unscheduled rather than
 * being given a plausible bar — the previous renderer invented every duration.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent } from "./_base.js";

const LABEL_W = 208;
const TRACK_W = 720;
const ROW_H = 56;
const ROW_GAP = 12;
const HEADER_H = 44;

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);

export default {
  id: "gantt",
  label: "Gantt",
  description: "Tasks against a declared time scale",
  family: "chart",

  layout(diagram, ctx) {
    const scheduled = [];
    const unscheduled = [];
    for (const node of diagram.nodes) {
      const start = num(node.start);
      const duration = num(node.duration);
      if (start === null || duration === null || duration <= 0) unscheduled.push(node);
      else scheduled.push(node);
    }

    const span = Math.max(1, ...scheduled.map((node) => node.start + node.duration));
    const unit = TRACK_W / span;
    const trackX = ctx.margin.left + LABEL_W;
    const top = ctx.margin.top + HEADER_H;

    diagram.nodes.forEach((node, index) => {
      node.fixedSize = true;
      node.y = roundTo(top + index * (ROW_H + ROW_GAP));
      node.h = ROW_H - 16;
      if (unscheduled.includes(node)) {
        node.x = roundTo(trackX);
        node.w = 0;
        return;
      }
      node.x = roundTo(trackX + node.start * unit);
      node.w = roundTo(Math.max(8, node.duration * unit));
    });

    const area = { x: ctx.margin.left, y: ctx.margin.top, w: LABEL_W + TRACK_W, h: HEADER_H + diagram.nodes.length * (ROW_H + ROW_GAP) };
    const extent = contentExtent(diagram, ctx, [area]);
    return { trackX, top, unit, span, unscheduled, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const { trackX, unit, span } = layout;
    const scaleLabel = diagram.timeUnit ?? "";
    const divisions = Math.min(span, 6);
    const step = span / divisions;

    const grid = Array.from({ length: divisions + 1 }, (_, index) => {
      const value = index * step;
      const x = trackX + value * unit;
      const bottom = ctx.margin.top + layout.height;
      return `<path class="grid-line" d="M ${x} ${ctx.margin.top + 28} V ${bottom}"/>${text(
        `${Math.round(value)}${scaleLabel ? ` ${scaleLabel}` : ""}`,
        x,
        ctx.margin.top + 16,
        TYPE.axis,
        { anchor: index === 0 ? "start" : index === divisions ? "end" : "middle", className: "axis-label" },
      )}`;
    }).join("");

    const rows = diagram.nodes
      .map((node) => {
        const label = text(node.label, ctx.margin.left, node.y + 24, TYPE.nodeSub, { className: "mark-label" });
        if (layout.unscheduled.includes(node)) {
          return `<g class="ds-node gantt-task is-unscheduled" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: unscheduled">
            ${label}${text("unscheduled", trackX, node.y + 24, TYPE.meta, { className: "axis-label" })}
          </g>`;
        }
        const meta = `${node.duration}${scaleLabel ? ` ${scaleLabel}` : ""}`;
        return `<g class="ds-node gantt-task" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: starts ${node.start}, lasts ${meta}">
          ${label}
          <rect class="mark ${node.tone === "accent" ? "is-focus" : ""}" x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="6"/>
          ${text(meta, node.x + node.w + 12, node.y + 24, TYPE.meta, { className: "mark-value" })}
        </g>`;
      })
      .join("");

    return `${grid}${rows}`;
  },

  sample: () => ({
    nodes: [
      { label: "Discovery", start: 0, duration: 3 },
      { label: "Design", start: 2, duration: 3 },
      { label: "Build", start: 4, duration: 6, tone: "accent" },
      { label: "Pilot", start: 9, duration: 2 },
      { label: "Launch", start: 11, duration: 1 },
    ],
    edges: [],
    timeUnit: "wk",
  }),
};
