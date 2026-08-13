import { createLayeredType } from "./_layered.js";

/**
 * A release pipeline reads top to bottom, with environments drawn as groups so
 * the promotion boundary is visible rather than implied by position.
 */
export default createLayeredType({
  id: "deployment",
  label: "Deployment",
  description: "Runtime environments and the path a release takes through them",
  direction: "TB",
  rankGap: 88,
  nodeGap: 40,
  groupOptions: { className: "lane is-filled" },
  sample: () => ({
    nodes: [
      { label: "Commit", sublabel: "Trunk" },
      { label: "Build", sublabel: "Artefact produced" },
      { label: "Automated tests" },
      { label: "Staging", sublabel: "Production-like" },
      { label: "Production", tone: "accent" },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3, label: "promote" },
      { from: 3, to: 4, label: "release" },
      { from: 2, to: 0, label: "fail", dashed: true },
    ],
    groups: [
      { label: "Continuous integration", nodes: [0, 1, 2] },
      { label: "Continuous delivery", nodes: [3, 4] },
    ],
  }),
});
