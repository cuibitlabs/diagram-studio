/**
 * Layer stack: abstractions above and below each other.
 *
 * Bands are full width and equal height unless the model weights them, so a
 * reader cannot infer importance from an accidental size difference.
 */

import { bands } from "../engine/layout/band.js";
import { roundTo } from "../engine/text.js";
import { TYPE } from "../engine/typography.js";
import { text } from "../render/primitives.js";
import { contentExtent, drawNodes, sizeAll } from "./_base.js";

const WIDTH = 880;
const BAND_H = 88;
const GAP = 12;

export default {
  id: "layers",
  label: "Layer stack",
  description: "Stacked abstractions from experience down to infrastructure",
  family: "band",

  layout(diagram, ctx) {
    sizeAll(diagram.nodes, ctx, { maxSubLines: 1 });
    const count = diagram.nodes.length;
    const area = { x: ctx.margin.left, y: ctx.margin.top, w: WIDTH, h: count * BAND_H + (count - 1) * GAP };
    const rows = bands(count, area, { axis: "y", gap: GAP });

    diagram.nodes.forEach((node, index) => {
      const row = rows[index];
      node.x = roundTo(row.x);
      node.y = roundTo(row.y);
      node.w = roundTo(row.w);
      node.h = roundTo(row.h);
      node.fixedSize = true;
    });

    const extent = contentExtent(diagram, ctx);
    return { rows, width: extent.width, height: extent.height };
  },

  draw(diagram, ctx, layout) {
    const scale = diagram.nodes
      .map((node, index) => text(String(diagram.nodes.length - index), node.x - 28, node.y + node.h / 2 + 5, TYPE.axis, {
        anchor: "end",
        className: "axis-label",
      }))
      .join("");
    return `${scale}${drawNodes(diagram, ctx)}`;
  },

  sample: () => ({
    nodes: [
      { label: "Experience", sublabel: "What people touch" },
      { label: "Application", sublabel: "Use cases and orchestration" },
      { label: "Domain", sublabel: "Rules that outlive the UI", tone: "accent" },
      { label: "Data", sublabel: "Records of truth" },
      { label: "Infrastructure", sublabel: "Runtime and network" },
    ],
    edges: [],
  }),
};
