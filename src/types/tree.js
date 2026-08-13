import { createTreeType } from "./_tree.js";

/**
 * A taxonomy. Connectors carry no arrowheads because containment is not a
 * direction of travel — an arrow here would imply a flow that does not exist.
 */
export default createTreeType({
  id: "tree",
  label: "Tree",
  description: "Parent and child relationships in a taxonomy",
  direction: "TB",
  levelGap: 80,
  siblingGap: 28,
  marker: "bar",
  sample: () => ({
    nodes: [
      { label: "Platform", tone: "accent" },
      { label: "Experience" },
      { label: "Services" },
      { label: "Web" },
      { label: "Mobile" },
      { label: "Identity" },
      { label: "Billing" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
      { from: 2, to: 5 },
      { from: 2, to: 6 },
    ],
  }),
});
