import { createLayeredType } from "./_layered.js";

/**
 * The executive view: few blocks, generous size, one accent, no technology
 * names. Everything that would belong in a sublabel belongs in the detail
 * diagram instead.
 */
export default createLayeredType({
  id: "high-level",
  label: "High-level system",
  description: "End-to-end platform view for a non-specialist audience",
  direction: "LR",
  rankGap: 144,
  nodeGap: 48,
  minW: 208,
  minH: 96,
  maxW: 288,
  maxSubLines: 1,
  prepare(diagram) {
    // Keep the executive view free of technical metadata.
    for (const node of diagram.nodes) if (node.sublabel && node.sublabel.length > 40) node.sublabel = "";
  },
  sample: () => ({
    nodes: [
      { label: "Customers" },
      { label: "Experience", sublabel: "Web and mobile" },
      { label: "Platform", sublabel: "Shared services", tone: "accent" },
      { label: "Intelligence", sublabel: "Analytics and models" },
      { label: "Operations", sublabel: "Support and finance" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
    ],
  }),
  maxTitleLines: 2,
});
