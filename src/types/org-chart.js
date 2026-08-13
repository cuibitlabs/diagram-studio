import { createTreeType } from "./_tree.js";

/**
 * Reporting lines. The sublabel is the role, not a technology, and reporting
 * lines are plain rules: an arrowhead would read as delegation direction.
 */
export default createTreeType({
  id: "org-chart",
  label: "Org chart",
  description: "Teams, ownership and reporting lines",
  direction: "TB",
  levelGap: 72,
  siblingGap: 24,
  marker: "bar",
  minW: 176,
  maxSubLines: 1,
  sample: () => ({
    nodes: [
      { label: "Chief executive", tone: "accent" },
      { label: "Product", sublabel: "Discovery and roadmap" },
      { label: "Engineering", sublabel: "Delivery and platform" },
      { label: "Design", sublabel: "Research and craft" },
      { label: "Platform team", sublabel: "Shared services" },
      { label: "Product teams", sublabel: "Stream aligned" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
    ],
  }),
});
