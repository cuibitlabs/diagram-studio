import { createLayeredType } from "./_layered.js";

/**
 * Sources are parallelograms, transformations are boxes, stores are cylinders.
 * Shape carries the role so the diagram survives greyscale printing.
 */
export default createLayeredType({
  id: "data-flow",
  label: "Data flow",
  description: "Sources, transformations and destinations",
  direction: "LR",
  rankGap: 120,
  nodeGap: 40,
  prepare(diagram) {
    const incoming = new Set((diagram.edges ?? []).map((edge) => edge.target));
    for (const node of diagram.nodes) {
      if (node.role || node.shape) continue;
      if (!incoming.has(node.id)) node.role = "input";
    }
  },
  sample: () => ({
    nodes: [
      { label: "Operational systems", role: "input" },
      { label: "Ingest", sublabel: "Batch and stream" },
      { label: "Transform", sublabel: "Clean, join, conform", tone: "accent" },
      { label: "Warehouse", role: "store" },
      { label: "Reporting", role: "output" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3, label: "load" },
      { from: 3, to: 4, label: "serve" },
    ],
  }),
});
