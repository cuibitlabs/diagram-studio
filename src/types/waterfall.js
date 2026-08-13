/**
 * Waterfall.
 *
 * How a starting figure becomes an ending figure, one contribution at a time.
 * The running total is carried through and the closing bar is drawn from the
 * accumulated value, not from a separately supplied number — so if the parts do
 * not add up to the stated total, the chart says so instead of hiding it.
 */

import { axisTicks, slots } from "../engine/layout/band.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent } from "./_base.js";

const PLOT = { w: 820, h: 440 };
const MAX_BAR = 76;

const num = (node) => (typeof node.value === "number" && Number.isFinite(node.value) ? node.value : null);
const isTotal = (node) => node.kind === "total";

export default {
  id: "waterfall",
  label: "Waterfall",
  description: "How a starting figure becomes an ending one",
  family: "chart",

  layout(diagram, ctx) {
    const plot = { x: ctx.margin.left + 64, y: ctx.margin.top, w: PLOT.w, h: PLOT.h };
    const centres = slots(diagram.nodes.length, plot.x, plot.x + plot.w);
    const barWidth = roundTo(Math.min(MAX_BAR, (plot.w / Math.max(1, diagram.nodes.length)) * 0.62));

    // Walk the contributions to get every bar's span.
    let running = 0;
    const bars = diagram.nodes.map((node, index) => {
      const amount = num(node);
      if (amount === null) return { node, index, amount: null };
      if (isTotal(node)) {
        const bar = { node, index, amount: running, from: 0, to: running, total: true, stated: amount };
        return bar;
      }
      const from = running;
      running += amount;
      return { node, index, amount, from, to: running };
    });

    const spans = bars.filter((bar) => bar.amount !== null);
    const top = axisTicks(Math.max(1, ...spans.flatMap((bar) => [bar.from, bar.to])), 4).at(-1);
    const scale = plot.h / (top || 1);

    for (const bar of bars) {
      const node = bar.node;
      node.fixedSize = true;
      node.w = barWidth;
      node.x = roundTo(centres[bar.index] - barWidth / 2);
      if (bar.amount === null) {
        node.h = 0;
        node.y = roundTo(plot.y + plot.h);
        continue;
      }
      const low = Math.min(bar.from, bar.to);
      const high = Math.max(bar.from, bar.to);
      node.y = roundTo(plot.y + plot.h - high * scale);
      node.h = Math.max(4, roundTo((high - low) * scale));
    }

    const closing = bars.find((bar) => bar.total);
    const mismatch = closing && typeof closing.stated === "number" && Math.abs(closing.stated - closing.amount) > 0.001
      ? { stated: closing.stated, actual: closing.amount }
      : null;

    const extent = contentExtent(diagram, ctx, [{ x: plot.x, y: plot.y, w: plot.w, h: plot.h + 88 }]);
    return { plot, bars, top, scale, mismatch, width: extent.width + 64, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const { plot, top, bars } = layout;
    const unit = diagram.unit ? ` ${diagram.unit}` : "";

    const gridlines = axisTicks(top, 4)
      .map((tick) => {
        const y = plot.y + plot.h - (plot.h * tick) / (top || 1);
        return `<path class="grid-line" d="M ${plot.x} ${y} H ${plot.x + plot.w}"/>${text(String(Math.round(tick)), plot.x - 12, y + 4, TYPE.axis, { anchor: "end", className: "axis-label" })}`;
      })
      .join("");

    const drawn = bars
      .map((bar, index) => {
        const node = bar.node;
        if (bar.amount === null) {
          return text("no value", node.x + node.w / 2, plot.y + plot.h - 12, TYPE.meta, { anchor: "middle", className: "axis-label" });
        }
        const rising = !bar.total && bar.amount >= 0;
        const className = bar.total ? "is-total" : rising ? "is-up" : "is-down";
        const previous = bars[index - 1];
        const connector = previous && previous.amount !== null && !bar.total && !previous.total
          ? `<path class="step-link" d="M ${previous.node.x + previous.node.w} ${plot.y + plot.h - previous.to * layout.scale} H ${node.x}"/>`
          : "";
        const printed = bar.total ? bar.amount : `${bar.amount > 0 ? "+" : ""}${bar.amount}`;
        return `${connector}<g class="ds-node step ${className}" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: ${printed}${unit}">
          <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="3"/>
          ${text(String(printed), node.x + node.w / 2, node.y - 10, TYPE.value, { anchor: "middle", className: "mark-value" })}
          ${text(node.label, node.x + node.w / 2, plot.y + plot.h + 26, TYPE.nodeSub, { anchor: "middle", className: "mark-label" })}
        </g>`;
      })
      .join("");

    const note = layout.mismatch
      ? text(
          `The parts sum to ${layout.mismatch.actual}${unit}, not the stated ${layout.mismatch.stated}${unit}. The closing bar shows the sum.`,
          plot.x,
          plot.y + plot.h + 60,
          TYPE.meta,
          { className: "caption" },
        )
      : "";

    return `<rect class="plot-bg" x="${plot.x}" y="${plot.y}" width="${plot.w}" height="${plot.h}" rx="4"/>
      ${gridlines}
      <path class="axis-line" d="M ${plot.x} ${plot.y} V ${plot.y + plot.h} H ${plot.x + plot.w}"/>
      ${drawn}${note}`;
  },

  sample: () => ({
    nodes: [
      { label: "Opening ARR", value: 4200 },
      { label: "New business", value: 1400 },
      { label: "Expansion", value: 620, tone: "accent" },
      { label: "Contraction", value: -280 },
      { label: "Churn", value: -740 },
      { label: "Closing ARR", kind: "total", value: 5200 },
    ],
    edges: [],
    unit: "k",
  }),
};
