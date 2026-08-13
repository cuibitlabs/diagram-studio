/**
 * Stacked bar.
 *
 * Composition across categories. Only the bottom segment sits on a common
 * baseline, so only the bottom segment can be compared across bars — the series
 * order is therefore the model's, never re-sorted, and the legend states which
 * one is the comparable band.
 *
 * A category missing a value for a series leaves that band out and is counted,
 * rather than being padded with a zero that would read as "measured, and none".
 */

import { axisTicks, slots } from "../engine/layout/band.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { seriesColour } from "../theme/palettes.js";
import { esc, text } from "../render/primitives.js";
import { contentExtent } from "./_base.js";

const PLOT = { w: 800, h: 440 };
const MAX_BAR = 84;

const seriesOf = (diagram) => (Array.isArray(diagram.series) && diagram.series.length ? diagram.series.map(String) : ["Value"]);
const valuesOf = (node, count) => {
  const raw = Array.isArray(node.values) ? node.values : typeof node.value === "number" ? [node.value] : [];
  return Array.from({ length: count }, (_, index) =>
    typeof raw[index] === "number" && Number.isFinite(raw[index]) && raw[index] >= 0 ? raw[index] : null,
  );
};

export default {
  id: "stacked-bar",
  label: "Stacked bar",
  description: "What each category is made of, and how the totals compare",
  family: "chart",

  layout(diagram, ctx) {
    const series = seriesOf(diagram);
    const plot = { x: ctx.margin.left + 64, y: ctx.margin.top, w: PLOT.w, h: PLOT.h };
    const centres = slots(diagram.nodes.length, plot.x, plot.x + plot.w);
    const barWidth = roundTo(Math.min(MAX_BAR, (plot.w / Math.max(1, diagram.nodes.length)) * 0.6));

    let incomplete = 0;
    const stacks = diagram.nodes.map((node, index) => {
      const values = valuesOf(node, series.length);
      if (values.some((entry) => entry === null)) incomplete++;
      const total = values.reduce((sum, entry) => sum + (entry ?? 0), 0);
      return { node, index, values, total };
    });

    const scale = axisTicks(Math.max(1, ...stacks.map((stack) => stack.total)), 4);
    const top = scale.at(-1);

    for (const stack of stacks) {
      const node = stack.node;
      node.fixedSize = true;
      node.w = barWidth;
      node.x = roundTo(centres[stack.index] - barWidth / 2);
      node.h = Math.max(4, roundTo((stack.total / top) * plot.h));
      node.y = roundTo(plot.y + plot.h - node.h);
    }

    const extent = contentExtent(diagram, ctx, [{ x: plot.x, y: plot.y, w: plot.w, h: plot.h + 104 }]);
    return { plot, series, stacks, scale, top, incomplete, width: extent.width + 64, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const { plot, series, stacks, scale, top } = layout;
    const unit = diagram.unit ? ` ${diagram.unit}` : "";

    const gridlines = scale
      .map((tick) => {
        const y = plot.y + plot.h - (plot.h * tick) / (top || 1);
        return `<path class="grid-line" d="M ${plot.x} ${y} H ${plot.x + plot.w}"/>${text(String(Math.round(tick)), plot.x - 12, y + 4, TYPE.axis, { anchor: "end", className: "axis-label" })}`;
      })
      .join("");

    const bars = stacks
      .map((stack) => {
        const node = stack.node;
        let cursor = plot.y + plot.h;
        const bands = stack.values
          .map((entry, index) => {
            if (entry === null) return "";
            const height = (entry / top) * plot.h;
            cursor -= height;
            const fill = index === 0 && node.tone === "accent" ? "var(--accent)" : seriesColour(ctx.theme, index);
            return `<rect x="${node.x}" y="${roundTo(cursor)}" width="${node.w}" height="${Math.max(1, roundTo(height))}" fill="${fill}"><title>${esc(series[index])}: ${entry}${unit}</title></rect>`;
          })
          .join("");
        return `<g class="ds-node stack" data-node-id="${esc(node.id)}" tabindex="0" role="button" aria-label="${esc(node.label)}: ${stack.total}${unit}">
          ${bands}
          ${text(String(stack.total), node.x + node.w / 2, node.y - 10, TYPE.value, { anchor: "middle", className: "mark-value" })}
          ${text(node.label, node.x + node.w / 2, plot.y + plot.h + 26, TYPE.nodeSub, { anchor: "middle", className: "mark-label" })}
        </g>`;
      })
      .join("");

    let cursor = plot.x;
    const legend = series
      .map((name, index) => {
        const label = index === 0 ? `${name} — on the baseline, comparable across bars` : name;
        const swatch = `<rect x="${cursor}" y="${plot.y + plot.h + 52}" width="12" height="12" rx="3" fill="${seriesColour(ctx.theme, index)}"/>`;
        const markup = `${swatch}${text(label, cursor + 20, plot.y + plot.h + 62, TYPE.legend, { className: "legend-label" })}`;
        cursor += label.length * 6.6 + 34;
        return markup;
      })
      .join("");

    const note = layout.incomplete
      ? text(
          `${layout.incomplete} categor${layout.incomplete === 1 ? "y is" : "ies are"} missing a series value; those bands are left out rather than shown as zero.`,
          plot.x,
          plot.y + plot.h + 88,
          TYPE.meta,
          { className: "caption" },
        )
      : "";

    return `<rect class="plot-bg" x="${plot.x}" y="${plot.y}" width="${plot.w}" height="${plot.h}" rx="4"/>
      ${gridlines}
      <path class="axis-line" d="M ${plot.x} ${plot.y} V ${plot.y + plot.h} H ${plot.x + plot.w}"/>
      ${bars}${legend}${note}`;
  },

  sample: () => ({
    nodes: [
      { label: "Q1", values: [180, 90, 40] },
      { label: "Q2", values: [210, 120, 55] },
      { label: "Q3", values: [240, 160, 60], tone: "accent" },
      { label: "Q4", values: [265, 205, 72] },
    ],
    edges: [],
    series: ["Subscription", "Usage", "Services"],
    unit: "k",
  }),
};
