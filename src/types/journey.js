/**
 * Customer journey: stages, what the customer does, and how it feels.
 *
 * The sentiment line is drawn only when the model carries sentiment values. A
 * journey without measured sentiment gets stages and actions and nothing else,
 * because an invented curve is the most persuasive kind of lie in this format.
 */

import { slots } from "../engine/layout/band.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { text } from "../render/primitives.js";
import { contentExtent, drawNodes, sizeAll, valueOf } from "./_base.js";

const SENTIMENT_H = 176;
const SENTIMENT_GAP = 48;
const MIN_STAGE = 200;

export default {
  id: "journey",
  label: "Customer journey",
  description: "Stages, customer actions and measured sentiment",
  family: "timeline",

  layout(diagram, ctx) {
    const count = diagram.nodes.length;
    sizeAll(diagram.nodes, ctx, { minW: MIN_STAGE, maxW: 248, maxSubLines: 3 });
    const stageWidth = Math.max(MIN_STAGE, ...diagram.nodes.map((node) => node.w));
    const gap = 20;
    const totalWidth = count * stageWidth + (count - 1) * gap;

    diagram.nodes.forEach((node, index) => {
      node.w = stageWidth;
      node.x = roundTo(ctx.margin.left + index * (stageWidth + gap));
      node.y = roundTo(ctx.margin.top);
    });

    const stageBottom = ctx.margin.top + Math.max(...diagram.nodes.map((node) => node.h));
    const hasSentiment = diagram.nodes.every((node) => valueOf(node) !== null) && count > 1;
    const plot = hasSentiment
      ? {
          x: ctx.margin.left,
          y: roundTo(stageBottom + SENTIMENT_GAP),
          w: roundTo(totalWidth),
          h: SENTIMENT_H,
        }
      : null;

    const centres = slots(count, ctx.margin.left, ctx.margin.left + totalWidth);
    const extent = contentExtent(diagram, ctx, plot ? [plot] : []);
    return { plot, centres, hasSentiment, width: Math.max(extent.width, totalWidth), height: extent.height };
  },

  draw(diagram, ctx, layout) {
    if (!layout.plot) return drawNodes(diagram, ctx);

    const { plot, centres } = layout;
    const points = diagram.nodes.map((node, index) => ({
      x: centres[index],
      y: plot.y + plot.h - (plot.h * valueOf(node)) / 100,
      node,
    }));

    const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const area = `${line} L ${points.at(-1).x} ${plot.y + plot.h} L ${points[0].x} ${plot.y + plot.h} Z`;
    const dots = points
      .map((point) => `<circle class="timeline-dot${point.node.tone === "accent" ? " is-focus" : ""}" cx="${point.x}" cy="${point.y}" r="6"/>${text(
        String(valueOf(point.node)),
        point.x,
        point.y - 14,
        TYPE.value,
        { anchor: "middle", className: "mark-value" },
      )}`)
      .join("");

    const guides = [0, 50, 100]
      .map((value) => {
        const y = plot.y + plot.h - (plot.h * value) / 100;
        return `<path class="grid-line" d="M ${plot.x} ${y} H ${plot.x + plot.w}"/>${text(String(value), plot.x - 12, y + 4, TYPE.axis, { anchor: "end", className: "axis-label" })}`;
      })
      .join("");

    return `${drawNodes(diagram, ctx)}
      ${text("Sentiment", plot.x, plot.y - 16, TYPE.section, { className: "axis-label" })}
      ${guides}
      <path class="mark-area" d="${area}"/>
      <path class="mark-line" d="${line}"/>
      ${dots}`;
  },

  sample: () => ({
    nodes: [
      { label: "Awareness", sublabel: "Finds us through a peer", value: 62 },
      { label: "Evaluate", sublabel: "Compares three options", value: 48 },
      { label: "Buy", sublabel: "Procurement review", value: 34, tone: "accent" },
      { label: "Onboard", sublabel: "First team enabled", value: 66 },
      { label: "Grow", sublabel: "Second department joins", value: 78 },
    ],
    edges: [],
  }),
};
