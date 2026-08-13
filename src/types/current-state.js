import { TYPE } from "../engine/typography.js";
import { esc, text } from "../render/primitives.js";
import { createLayeredType } from "./_layered.js";

/**
 * Current state: the honest picture of a legacy landscape.
 * Constraints are marked, not hidden — nodes carrying `constraint` text get a
 * margin note so the diagram states the problem instead of implying it.
 */
export default createLayeredType({
  id: "current-state",
  label: "Current state",
  description: "Legacy landscape with its constraints made explicit",
  direction: "LR",
  rankGap: 120,
  nodeGap: 44,
  prepare(diagram) {
    for (const node of diagram.nodes) {
      if (node.role === "legacy") node.dashed = true;
    }
  },
  overlay(diagram) {
    return diagram.nodes
      .filter((node) => node.constraint)
      .map((node) => {
        const y = node.y + node.h + 20;
        return `<g class="constraint-note" data-note-for="${esc(node.id)}">${text(
          `▲ ${node.constraint}`,
          node.x,
          y,
          TYPE.meta,
          { className: "axis-label" },
        )}</g>`;
      })
      .join("");
  },
  sample: () => ({
    nodes: [
      { label: "Channels", sublabel: "Five front doors" },
      { label: "Point solutions", role: "legacy", constraint: "Overlapping ownership" },
      { label: "Legacy core", role: "legacy", tone: "accent", constraint: "Single release window" },
      { label: "Data silos", role: "store", constraint: "No shared identity" },
      { label: "Manual operations", constraint: "Reconciled by hand" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
    ],
  }),
});
