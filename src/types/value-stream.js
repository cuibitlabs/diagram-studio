/**
 * Value stream map.
 *
 * Steps across the top, and underneath the ladder that makes the point: process
 * time low, wait time high. The efficiency figure is computed from those two
 * numbers and printed with its working, because a value stream map without the
 * ratio is a flow chart with extra boxes.
 *
 * A step missing either time is drawn and counted as unmeasured. Nothing is
 * assumed to be zero — a wait nobody measured is not a wait that did not happen.
 */

import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent, drawNodes, sizeAll } from "./_base.js";

const STEP_GAP = 56;
const LADDER_GAP = 72;
const LADDER_HEIGHT = 72;

const num = (value) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null);

export default {
  id: "value-stream",
  label: "Value stream",
  description: "Steps with process and wait time, and the efficiency that falls out",
  family: "timeline",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, { minW: 176, maxW: 224, maxSubLines: 2 });

    let cursor = ctx.margin.left;
    for (const node of diagram.nodes) {
      node.x = roundTo(cursor);
      node.y = roundTo(ctx.margin.top);
      cursor += node.w + STEP_GAP;
    }

    const tallest = Math.max(0, ...diagram.nodes.map((node) => node.h));
    const ladderY = roundTo(ctx.margin.top + tallest + LADDER_GAP);

    const measured = diagram.nodes.filter((node) => num(node.process) !== null && num(node.wait) !== null);
    const unmeasured = diagram.nodes.filter((node) => !measured.includes(node));
    const process = measured.reduce((sum, node) => sum + num(node.process), 0);
    const wait = measured.reduce((sum, node) => sum + num(node.wait), 0);
    const total = process + wait;

    const right = cursor - STEP_GAP;
    const extent = contentExtent(diagram, ctx, [
      { x: ctx.margin.left, y: ladderY - LADDER_HEIGHT, w: right - ctx.margin.left, h: LADDER_HEIGHT + 96 },
    ]);

    return {
      ladderY,
      right,
      process,
      wait,
      total,
      unmeasured,
      efficiency: total > 0 ? (process / total) * 100 : null,
      width: extent.width,
      height: extent.height,
    };
  },

  draw(diagram, ctx, layout) {
    const { ladderY, right } = layout;
    const unit = diagram.timeUnit ?? "";

    // The ladder: high while waiting, low while working.
    let path = "";
    const marks = [];
    diagram.nodes.forEach((node, index) => {
      const process = num(node.process);
      const wait = num(node.wait);
      const x1 = node.x;
      const x2 = node.x + node.w;
      const next = diagram.nodes[index + 1];
      const gapEnd = next ? next.x : x2;

      if (process !== null) {
        path += `${index === 0 ? "M" : "L"} ${x1} ${ladderY} L ${x2} ${ladderY} `;
        marks.push(text(`${process}${unit}`, (x1 + x2) / 2, ladderY + 20, TYPE.meta, { anchor: "middle", className: "mark-value" }));
      }
      if (wait !== null && next) {
        path += `L ${x2} ${ladderY - LADDER_HEIGHT} L ${gapEnd} ${ladderY - LADDER_HEIGHT} L ${gapEnd} ${ladderY} `;
        marks.push(text(`${wait}${unit}`, (x2 + gapEnd) / 2, ladderY - LADDER_HEIGHT - 10, TYPE.meta, { anchor: "middle", className: "axis-label" }));
      }
    });

    const legend = [
      text("Working", ctx.margin.left, ladderY + 44, TYPE.axis, { className: "axis-label" }),
      text("Waiting", ctx.margin.left, ladderY - LADDER_HEIGHT - 34, TYPE.axis, { className: "axis-label" }),
    ].join("");

    const summary = layout.efficiency === null
      ? text("No step carries both a process time and a wait time, so no efficiency can be shown.", ctx.margin.left, ladderY + 76, TYPE.meta, { className: "caption" })
      : `${text(
          `${layout.process}${unit} working · ${layout.wait}${unit} waiting · ${Math.round(layout.efficiency)}% flow efficiency`,
          right,
          ladderY + 76,
          TYPE.value,
          { anchor: "end", className: "mark-value" },
        )}`;

    const caveat = layout.unmeasured.length
      ? text(
          `Unmeasured: ${layout.unmeasured.map((node) => node.label).join(", ")} — excluded from the ratio.`,
          ctx.margin.left,
          ladderY + 76,
          TYPE.meta,
          { className: "caption" },
        )
      : "";

    return `${drawNodes(diagram, ctx)}
      <path class="ladder" d="${path.trim()}"/>
      ${marks.join("")}${legend}${summary}${caveat}`;
  },

  sample: () => ({
    nodes: [
      { label: "Request raised", sublabel: "Ticket created", process: 1, wait: 8 },
      { label: "Triage", sublabel: "Scoped and sized", process: 2, wait: 16 },
      { label: "Build", sublabel: "Change written and reviewed", process: 6, wait: 24, tone: "accent" },
      { label: "Test", sublabel: "Regression pack", process: 3, wait: 12 },
      { label: "Release", sublabel: "Deployed to production", process: 1, wait: 0 },
    ],
    edges: [],
    timeUnit: "h",
  }),
};
